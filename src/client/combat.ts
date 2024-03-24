const MAX_SHIELD = 9;
const MAX_AGGRO = 9;

import assert from 'assert';
import { AnimationSequencer } from 'glov/client/animation';
import * as engine from 'glov/client/engine';
import {
  getFrameIndex,
  getFrameTimestamp,
} from 'glov/client/engine';
import { ALIGN, Font, fontStyle } from 'glov/client/font';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import { buttonText, drawRect, playUISound, uiGetFont, uiTextHeight } from 'glov/client/ui';
import { randCreate } from 'glov/common/rand_alea';
import { TSMap } from 'glov/common/types';
import verify from 'glov/common/verify';
import { vec4 } from 'glov/common/vmath';
import {
  AttackType,
  AttackTypeToFrameEnemies,
  ENCOUNTERS,
  ENEMIES,
  EnemyDef,
} from './encounters';
import {
  EntityDemoClient,
  entityManager,
} from './entity_demo_client';
import {
  VIEWPORT_X0,
  VIEWPORT_Y0,
  render_height,
  render_width,
} from './globals';
import { ABILITIES, CLASSES, DICE_SLOTS } from './heroes';
import { drawHealthBar, myEnt } from './play';

const spritesheet_icons = require('./img/icons');
const { sprite_icons } = spritesheet_icons;

const { floor, max, min, random } = Math;

type Entity = EntityDemoClient;

class Enemy {
  hp: number;
  constructor(public def: EnemyDef) {
    this.hp = def.hp;
  }
}

let font: Font;

let rand = randCreate(1234);

export class CombatState {
  enemies: Enemy[] = [];
  anims: AnimationSequencer[] = [];
  did_death = false;
  did_victory = false;
  dice: number[] = [0, 0];
  dice_used: boolean[] = [];
  player_is_done = false;

  needsRoll(): boolean {
    return !this.dice_used.length;
  }
  roll(): void {
    this.dice = [
      rand.range(6) + 1,
      rand.range(6) + 1,
    ];
    this.dice_used = this.dice.map((a) => false);
  }
  livingEnemies(): number[] {
    let ret = [];
    for (let ii = 0; ii < this.enemies.length; ++ii) {
      let enemy = this.enemies[ii];
      if (enemy.hp > 0) {
        ret.push(ii);
      }
    }
    assert(ret.length);
    return ret;
  }
  damage(enemy_idx: number, hp: number): void {
    let enemy = this.enemies[enemy_idx];
    enemy.hp -= max(0, hp - enemy.def.shield);
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      // TODO: died!
    }
  }
}

let combat_state: CombatState | null = null;

export function combatGetState(): CombatState | null {
  return combat_state;
}

function cleanupHeroes(): void {
  let me = myEnt();
  assert(me);
  let { heroes } = me.data;
  if (heroes) {
    for (let ii = 0; ii < heroes.length; ++ii) {
      let hero = heroes[ii];
      let { class_id, tier } = hero;
      let class_def = CLASSES[class_id]!;
      let class_tier = class_def.tier[tier];
      hero.hp = class_tier.hp;
      hero.aggro = 0;
    }
  }
}

export function cleanupCombat(dt: number): void {
  cleanupHeroes();
  if (!combat_state) {
    return;
  }
  combat_state = null;
}

const color_combat_shade = vec4(0.15, 0.15, 0.15, 0.75);

let enemy_sprites: TSMap<Sprite> = {};

const style_attack = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x201b25ff,
});
const style_hint = fontStyle(null, {
  color: 0x6d758dff,
});

export function combatActivateAbility(hero_idx: number, ability_idx: number): void {
  let me = myEnt();
  assert(me);
  assert(combat_state);

  let { heroes } = me.data;
  let hero = heroes[hero_idx];
  let { class_id/*, tier*/ } = hero;
  let class_def = CLASSES[class_id]!;
  // let class_tier = class_def.tier[tier];
  let ability_id = class_def.abilities[ability_idx];
  let ability = ABILITIES[ability_id]!;
  let die = DICE_SLOTS[hero_idx][ability_idx];
  let found = -1;
  for (let ii = 0; ii < combat_state.dice.length; ++ii) {
    if (combat_state.dice[ii] === die && !combat_state.dice_used[ii]) {
      found = ii;
      break;
    }
  }
  assert(found !== -1);
  combat_state.dice_used[found] = true;
  hero.aggro += ability.aggro;
  if (hero.aggro > MAX_AGGRO) {
    hero.aggro = MAX_AGGRO;
  }
  let { effects } = ability;
  let living_enemies = combat_state.livingEnemies();
  for (let ii = 0; ii < effects.length; ++ii) {
    let effect = effects[ii];
    switch (effect.type) {
      case AttackType.FRONT:
        combat_state.damage(living_enemies[0], effect.amount);
        break;
      case AttackType.BACK:
        combat_state.damage(living_enemies[living_enemies.length - 1], effect.amount);
        break;
      case AttackType.ALL:
        for (let jj = 0; jj < living_enemies.length; ++jj) {
          combat_state.damage(living_enemies[jj], effect.amount);
        }
        break;
      case AttackType.SHIELD_SELF:
        hero.temp_shield = (hero.temp_shield || 0) + effect.amount;
        if (hero.temp_shield > MAX_SHIELD) {
          hero.temp_shield = MAX_SHIELD;
        }
        break;
      case AttackType.SHIELD_ALL:
        for (let jj = 0; jj < heroes.length; ++jj) {
          heroes[jj].temp_shield = (heroes[jj].temp_shield || 0) + effect.amount;
          if (heroes[jj].temp_shield > MAX_SHIELD) {
            heroes[jj].temp_shield = MAX_SHIELD;
          }
        }
        break;
      default:
        verify.unreachable(effect.type);
    }
  }
}

export function combatReadyForEnemyTurn(): void {
  if (!combat_state) {
    return;
  }
  combat_state.player_is_done = true;
}

function combatDoEnemyTurn(): void {
  let me = myEnt();
  assert(me);
  assert(combat_state);

  let { heroes } = me.data;
  combat_state.dice_used = [];
  let { enemies } = combat_state;
  let attacked: Partial<Record<number, true>> = {};
  let aggro_targetted: Partial<Record<number, true>> = {};
  function damageHero(idx: number, amount: number): void {
    let hero = heroes[idx];
    let { class_id, tier } = hero;
    let class_def = CLASSES[class_id]!;
    let class_tier = class_def.tier[tier];
    hero.hp -= max(0, amount - (hero.temp_shield || 0) - class_tier.shield);
    if (hero.hp <= 0) {
      // TODO: died!
      hero.hp = 0;
    }
    attacked[idx] = true;
  }


  for (let ii = 0; ii < enemies.length; ++ii) {
    let enemy = enemies[ii];
    if (!enemy.hp) {
      continue;
    }
    let { def } = enemy;
    for (let jj = 0; jj < def.effects.length; ++jj) {
      let effect = def.effects[jj];
      switch (effect.type) {
        case AttackType.FRONT: {
          let best: number[] = [];
          let best_aggro = -1;
          for (let kk = 0; kk < heroes.length; ++kk) {
            let hero = heroes[kk];
            if (hero.hp) {
              if (hero.aggro > best_aggro) {
                best_aggro = hero.aggro;
                best = [kk];
              } else if (hero.aggro === best_aggro) {
                best.push(kk);
              }
            }
          }
          for (let kk = 0; kk < best.length; ++kk) {
            aggro_targetted[best[kk]] = true;
            damageHero(best[kk], floor(effect.amount / best.length));
          }
        } break;
        case AttackType.ALL:
          for (let kk = 0; kk < heroes.length; ++kk) {
            if (heroes[kk].hp > 0) {
              damageHero(kk, effect.amount);
            }
          }
          break;
        default:
          assert(false);
      }
    }
  }

  for (let hero_idx in attacked) {
    heroes[hero_idx].temp_shield = 0;
  }

  for (let ii = 0; ii < heroes.length; ++ii) {
    let hero = heroes[ii];
    if (!hero.hp) {
      hero.aggro = 0;
    } else if (aggro_targetted[ii]) {
      hero.aggro = min(hero.aggro - 1, floor(hero.aggro / 2));
    }
  }
}

let last_combat_frame = -1;
let last_combat_ent: Entity | null = null;
let rolled_at: number;
let temp_color = vec4(1, 1, 1, 1);
export function doCombat(target: Entity, dt: number): void {
  let me = myEnt();
  assert(me);
  let reset = last_combat_frame !== getFrameIndex() - 1 || target !== last_combat_ent;
  last_combat_frame = getFrameIndex();
  last_combat_ent = target;
  if (reset || !combat_state) {
    combat_state = new CombatState();
    let encounter = ENCOUNTERS[target.data.stats.encounter];
    assert(encounter);
    for (let ii = 0; ii < encounter.enemies.length; ++ii) {
      let enemy_def = ENEMIES[encounter.enemies[ii]];
      assert(enemy_def);
      combat_state.enemies.push(new Enemy(enemy_def));
    }
    cleanupHeroes();
  }

  if (combat_state.needsRoll()) {
    rolled_at = getFrameTimestamp();
    combat_state.roll();
  } else if (combat_state.player_is_done) {
    combatDoEnemyTurn();
  }

  let x0 = VIEWPORT_X0;
  let x1 = VIEWPORT_X0 + render_width;
  let w = x1 - x0;
  let y0 = VIEWPORT_Y0;
  let y1 = VIEWPORT_Y0 + render_height;

  drawRect(x0, y0, x1, y1, Z.COMBAT_SHADE, color_combat_shade);

  let { enemies } = combat_state;

  let enemy_w = 56;
  const ENEMY_PAD = 2;
  const ENEMY_SPRITE_Y = y0 + 68;
  const ENEMY_SPRITE_H = 110;
  const ENEMY_BAR_W = 56;
  const ENEMY_BAR_H = 11;
  const ICON_SIZE = 9;
  const ENEMY_ATTACK_Y = ENEMY_SPRITE_Y + ENEMY_SPRITE_H;
  let enemy_x0 = floor(x0 + (w - enemy_w * enemies.length - ENEMY_PAD * (enemies.length - 1)) / 2);
  for (let ii = 0; ii < enemies.length; ++ii) {
    let enemy = enemies[ii];
    let enemy_x = enemy_x0 + ii * (enemy_w + ENEMY_PAD);
    let { def } = enemy;
    let { tex } = def;
    let sprite = enemy_sprites[tex];
    let alpha = enemy.hp ? 1 : 0.25;
    temp_color[3] = alpha;
    if (!sprite) {
      sprite = enemy_sprites[tex] = spriteCreate({
        name: `enemies/${tex}`,
        lazy_load: true,
        origin: [0.5, 0],
      });
    }
    let aspect = sprite.getAspect();
    let x_mid = floor(enemy_x + enemy_w/2);
    sprite.draw({
      x: x_mid,
      y: ENEMY_SPRITE_Y,
      z: Z.UI + 1 - ii * 0.1 + (enemy.hp ? 0 : -0.5),
      w: -ENEMY_SPRITE_H * aspect,
      h: ENEMY_SPRITE_H,
      color: temp_color,
    });
    if (!enemy.hp) {
      continue;
    }
    drawHealthBar(true,
      x_mid - ENEMY_BAR_W/2, ENEMY_SPRITE_Y - ENEMY_BAR_H - 2,
      Z.UI, ENEMY_BAR_W, ENEMY_BAR_H, enemy.hp, def.hp, true);
    let { effects } = def;
    assert.equal(effects.length, 1);
    let attack = effects[0];
    let frame = AttackTypeToFrameEnemies[attack.type];
    aspect = sprite_icons.uidata.aspect[frame];
    let icon_w = ICON_SIZE * aspect;
    sprite_icons.draw({
      x: x_mid - icon_w - 1,
      y: ENEMY_ATTACK_Y,
      w: icon_w,
      h: ICON_SIZE,
      frame,
    });
    font.drawSized(style_attack, x_mid + 1, ENEMY_ATTACK_Y + 1, Z.UI,
      8, `${attack.amount}`);
  }

  // draw dice
  const DIE_W = 20;
  const DIE_PAD = 8;
  const DIE_Y = VIEWPORT_Y0 + render_height + DIE_PAD;
  let num_dice = combat_state.dice.length;
  let die_x = floor(VIEWPORT_X0 + (render_width - (DIE_W * num_dice + DIE_PAD * (num_dice - 1))) / 2);
  let num_left = 0;
  for (let ii = 0; ii < num_dice; ++ii) {
    let die = combat_state.dice[ii];
    if (rolled_at > getFrameTimestamp() - 250) {
      die = floor(random() * 6) + 1;
    }
    let used = combat_state.dice_used[ii];
    if (!used) {
      num_left++;
    }
    sprite_icons.draw({
      x: die_x,
      y: DIE_Y,
      w: DIE_W, h: DIE_W,
      frame: spritesheet_icons[`FRAME_DIE${die}`],
      alpha: used ? 0.5 : 1,
    });
    die_x += DIE_W + DIE_PAD;
  }

  // show hint
  let hint: string = '';
  if (num_left > 1) {
    hint = 'COMBAT: choose 2 abilities\nmatching your dice';
  } else if (num_left === 1) {
    hint = 'COMBAT: choose 1 more ability\nand then the enemy will attack';
  }
  if (hint) {
    font.drawSizedAligned(style_hint, VIEWPORT_X0, DIE_Y + DIE_W + DIE_PAD, Z.UI, uiTextHeight(),
      ALIGN.HCENTER|ALIGN.HWRAP,
      render_width, 0, hint);
  }

  let end_combat = true;
  for (let ii = 0; ii < enemies.length; ++ii) {
    let enemy = enemies[ii];
    if (enemy.hp) {
      end_combat = false;
    }
  }

  if (engine.defines.DEBUG && buttonText({
    x: VIEWPORT_X0 + 4,
    y: VIEWPORT_Y0 + 4,
    text: 'WIN',
  })) {
    end_combat = true;
  }

  if (end_combat && !combat_state.did_victory) {
    // victory!
    combat_state.did_victory = true;
    playUISound('victory');
    entityManager().deleteEntity(target.id, 'killed');
    // TODO: give loot
  }
  combat_state.player_is_done = false;
}

export function combatStartup(): void {
  // tiny_font = tiny_font_in;
  // damage_sprite = spriteCreate({
  //   name: 'particles/damage',
  // });
  font = uiGetFont();
}
