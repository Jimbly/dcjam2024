const MAX_SHIELD = 9;
const MAX_AGGRO = 9;

import assert from 'assert';
import { AnimationSequencer } from 'glov/client/animation';
import * as engine from 'glov/client/engine';
import {
  getFrameIndex,
  getFrameTimestamp,
} from 'glov/client/engine';
import {
  ALIGN,
  Font,
  fontStyle,
} from 'glov/client/font';
import { markdownAuto } from 'glov/client/markdown';
import { markdownImageRegisterSpriteSheet } from 'glov/client/markdown_renderables';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import {
  buttonText,
  drawRect,
  playUISound,
  suppressNewDOMElemWarnings,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import { randCreate } from 'glov/common/rand_alea';
import { DataObject, TSMap } from 'glov/common/types';
import { easeIn, easeOut, empty, lerp } from 'glov/common/util';
import verify from 'glov/common/verify';
import { v3set, v4set, vec2, vec4 } from 'glov/common/vmath';
import { bamfCheck } from './bamf';
import {
  AttackType,
  AttackTypeToFrameEnemies,
  ENCOUNTERS,
  ENEMIES,
  Encounter,
  EnemyDef,
} from './encounters';
import {
  AbilityDef,
  EntityDemoClient,
  HeroClassDef,
  HeroClassTier,
  entityManager,
} from './entity_demo_client';
import {
  VIEWPORT_X0,
  VIEWPORT_Y0,
  render_height,
  render_width,
} from './globals';
import { heroDrawPos } from './hero_draw';
import { ABILITIES, CLASSES, DICE_SLOTS } from './heroes';
import { drawHealthBar, myEnt } from './play';

const spritesheet_icons = require('./img/icons');
const { sprite_icons } = spritesheet_icons;

const { floor, max, min, random } = Math;

let font: Font;

let damage_sprite: Sprite;

let rand = randCreate(1234);

const style_attack = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x201b25ff,
});
const style_hint = fontStyle(null, {
  color: 0x6d758dff,
});

type Entity = EntityDemoClient;

class Enemy {
  hp: number;
  poison: number = 0;
  temp_shield: number = 0; // NOTE: not enough room in UI to actually use this on fixed-shield monsters
  constructor(public def: EnemyDef) {
    this.hp = def.hp;
  }
}
function cloneEnemy(enemy: Enemy): Enemy {
  let ret = new Enemy(enemy.def);
  let key: keyof Enemy;
  for (key in enemy) {
    (ret as unknown as DataObject)[key] = enemy[key];
  }
  return ret;
}

export class CombatHero {
  hp!: number;
  temp_shield: number = 0;
  aggro: number = 0;
  class_ref!: HeroClassDef;
  tier_ref!: HeroClassTier;
  ability_refs!: [AbilityDef, AbilityDef];
}
function cloneCombatHero(hero: CombatHero): CombatHero {
  let ret = new CombatHero();
  let key: keyof CombatHero;
  for (key in hero) {
    (ret as unknown as DataObject)[key] = hero[key];
  }
  return ret;
}

type FloaterParamEnemy = {
  enemy_idx: number;
};
type FloaterParamHero = {
  hero_idx: number;
};
type FloaterTarget = FloaterParamEnemy | FloaterParamHero;
type FloaterParam = FloaterTarget & {
  attack_type: AttackType;
  msg: string;
  sound?: string;
  from_attack_enemy?: number;
};
// function isFloaterEnemy(p: FloaterParam): p is FloaterParam & FloaterParamEnemy {
//   return (p as FloaterParamEnemy).enemy_idx !== undefined;
// }
// function isFloaterHero(p: FloaterParam): p is FloaterParam & FloaterParamHero {
//   return (p as FloaterParamHero).hero_idx !== undefined;
// }
type FloaterTargetLoose = Partial<FloaterParamEnemy & FloaterParamHero>;
function sameFloaterTarget(p1: FloaterTarget, p2: FloaterTarget): boolean {
  return (p1 as FloaterTargetLoose).enemy_idx === (p2 as FloaterTargetLoose).enemy_idx &&
    (p1 as FloaterTargetLoose).hero_idx === (p2 as FloaterTargetLoose).hero_idx;
}
type Animatable = {
  addFloater(f: FloaterParam): void;
  animateAttack(enemy_idx: number, hero_idx: number): void;
  playSound(sound: string): void;
};

class CombatState {
  enemies: Enemy[] = [];
  heroes: CombatHero[] = [];
  deaths = 0;
  dice: number[] = [];
  dice_used: boolean[] = [];

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

  damage(enemy_idx: number, attack_type: AttackType, hp: number, animator?: Animatable): void {
    let enemy = this.enemies[enemy_idx];
    let dhp = hp - enemy.def.shield - enemy.temp_shield;
    animator?.addFloater({
      enemy_idx,
      attack_type,
      msg: `${dhp}`,
    });
    enemy.hp -= max(0, dhp);
    enemy.temp_shield = 0;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      // TODO: died!
      animator?.playSound('monster_death');
    }
  }
  poison(enemy_idx: number, amount: number, animator?: Animatable): void {
    let enemy = this.enemies[enemy_idx];
    enemy.poison += amount;
    animator?.addFloater({
      enemy_idx,
      attack_type: AttackType.POISON,
      msg: `${amount}[img=poison]`,
    });
  }

  clone(): CombatState {
    let ret = new CombatState();
    ret.enemies = this.enemies.map(cloneEnemy);
    ret.heroes = this.heroes.map(cloneCombatHero);
    ret.deaths = this.deaths;
    ret.dice = this.dice.slice(0);
    ret.dice_used = this.dice_used.slice(0);
    return ret;
  }

  activateAbility(hero_idx: number, ability_idx: number, animator?: Animatable): void {

    let die = DICE_SLOTS[hero_idx][ability_idx];
    let found = -1;
    for (let ii = 0; ii < this.dice.length; ++ii) {
      if (this.dice[ii] === die && !this.dice_used[ii]) {
        found = ii;
        break;
      }
    }
    assert(found !== -1);
    this.dice_used[found] = true;

    let { heroes } = this;
    let hero = heroes[hero_idx];
    let { ability_refs } = hero;
    let ability = ability_refs[ability_idx];

    hero.aggro += ability.aggro;
    if (hero.aggro > MAX_AGGRO) {
      hero.aggro = MAX_AGGRO;
    } else if (hero.aggro < 0) {
      hero.aggro = 0;
    }
    let { effects } = ability;
    let living_enemies = this.livingEnemies();
    for (let ii = 0; ii < effects.length; ++ii) {
      let effect = effects[ii];
      switch (effect.type) {
        case AttackType.FRONT:
          this.damage(living_enemies[0], effect.type, effect.amount, animator);
          break;
        case AttackType.POISON:
          this.poison(living_enemies[0], effect.amount, animator);
          break;
        case AttackType.BACK:
          this.damage(living_enemies[living_enemies.length - 1], effect.type, effect.amount, animator);
          break;
        case AttackType.ALL:
          for (let jj = 0; jj < living_enemies.length; ++jj) {
            this.damage(living_enemies[jj], effect.type, effect.amount, animator);
          }
          break;
        case AttackType.SHIELD_SELF:
          if (hero.temp_shield < MAX_SHIELD) {
            animator?.addFloater({
              hero_idx,
              attack_type: effect.type,
              msg: `${effect.amount}[img=shield]`,
            });
          }
          hero.temp_shield += effect.amount;
          if (hero.temp_shield > MAX_SHIELD) {
            hero.temp_shield = MAX_SHIELD;
          }
          break;
        case AttackType.SHIELD_ALL:
          for (let jj = 0; jj < heroes.length; ++jj) {
            let target_hero = heroes[jj];
            if (!target_hero.hp) {
              continue;
            }
            if (target_hero.temp_shield < MAX_SHIELD) {
              animator?.addFloater({
                hero_idx: jj,
                attack_type: AttackType.SHIELD_SELF,
                msg: `${effect.amount}[img=shield]`,
              });
            }
            target_hero.temp_shield += effect.amount;
            if (target_hero.temp_shield > MAX_SHIELD) {
              target_hero.temp_shield = MAX_SHIELD;
            }
          }
          break;
        case AttackType.HEAL: {
          // TODO: smart target to prioritize anyone who would die this turn (aggro based, including predicted self)
          let best = -1;
          let best_missing_hp = 0;
          let best_total_hp = 0;
          for (let jj = 0; jj < heroes.length; ++jj) {
            let target_hero = heroes[jj];
            if (!target_hero.hp) {
              continue;
            }
            let missing_hp = min(target_hero.tier_ref.hp - target_hero.hp, effect.amount);
            if (missing_hp > best_missing_hp || missing_hp === best_missing_hp && target_hero.hp < best_total_hp) {
              best = jj;
              best_missing_hp = missing_hp;
              best_total_hp = target_hero.hp;
            }
          }
          if (best !== -1) {
            let target_hero = heroes[best];
            let dhp = min(effect.amount, target_hero.tier_ref.hp - target_hero.hp);
            target_hero.hp += dhp;
            animator?.addFloater({
              hero_idx: best,
              attack_type: AttackType.HEAL,
              msg: `${dhp}[img=heal]`,
            });
          }
        } break;
        case AttackType.HEAL_ALL:
          for (let jj = 0; jj < heroes.length; ++jj) {
            let target_hero = heroes[jj];
            if (!target_hero.hp) {
              continue;
            }
            let dhp = min(effect.amount, target_hero.tier_ref.hp - target_hero.hp);
            if (dhp) {
              animator?.addFloater({
                hero_idx: jj,
                attack_type: AttackType.HEAL,
                msg: `${dhp}[img=heal]`,
              });
              target_hero.hp += dhp;
            }
          }
          break;
        default:
          verify.unreachable(effect.type);
      }
    }
  }

  heroes_attacked!: Partial<Record<number, [AttackType, number][]>>;
  aggro_targetted!: Partial<Record<number, true>>;
  decayAggro(): void {
    let { heroes } = this;
    for (let hero_idx in this.heroes_attacked) {
      heroes[hero_idx].temp_shield = 0;
    }

    for (let ii = 0; ii < heroes.length; ++ii) {
      let hero = heroes[ii];
      if (!hero.hp) {
        hero.aggro = 0;
      } else if (this.aggro_targetted[ii]) {
        hero.aggro = max(0, min(hero.aggro - 1, floor(hero.aggro / 2)));
      }
    }
  }

  damageHero(enemy_idx: number, attack_type: AttackType, idx: number, amount: number, animator?: Animatable): void {
    let hero = this.heroes[idx];
    let class_tier = hero.tier_ref;
    amount = max(0, amount - (hero.temp_shield || 0) - class_tier.shield);
    let sound = amount ? attack_type === AttackType.ALL ? 'monster_attack_all' : 'monster_attack' : 'shield_block';
    hero.hp -= amount;
    if (hero.hp <= 0) {
      hero.hp = 0;
      this.deaths++;
      this.dice.push(6);
      this.dice_used.push(true);
      // Died!
      // animator?.playSound('hero_death');
      sound = 'hero_death';
    }
    animator?.addFloater({
      hero_idx: idx,
      attack_type: amount ? attack_type : AttackType.SHIELD_SELF,
      msg: amount ? `${amount}` : '[img=shield]',
      from_attack_enemy: enemy_idx,
      sound,
    });
    let arr = this.heroes_attacked[idx] = this.heroes_attacked[idx] || [];
    arr.push([attack_type, amount]);
  }
  doEnemyAction(enemy_idx: number, animator?: Animatable): void {
    let { heroes, enemies } = this;
    let enemy = enemies[enemy_idx];
    assert(enemy.hp);
    let { def, poison } = enemy;
    if (poison) {
      animator?.addFloater({
        enemy_idx,
        attack_type: AttackType.FRONT,
        msg: `${poison}`,
      });
      enemy.hp -= poison;
      if (enemy.hp <= 0) {
        enemy.hp = 0;
        // TODO: died!
        animator?.playSound('monster_death');
        return;
      }
    }
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
            this.aggro_targetted[best[kk]] = true;
            animator?.animateAttack(enemy_idx, best[kk]);
            this.damageHero(enemy_idx, effect.type, best[kk], floor(effect.amount / best.length), animator);
          }
        } break;
        case AttackType.ALL:
          animator?.animateAttack(enemy_idx, -1);
          for (let kk = 0; kk < heroes.length; ++kk) {
            if (heroes[kk].hp > 0) {
              this.damageHero(enemy_idx, effect.type, kk, effect.amount, animator);
            }
          }
          break;
        default:
          assert(false);
      }
    }
  }
  enemy_tick_idx!: number;
  doEnemyTurnStart(): void {
    this.heroes_attacked = {};
    this.aggro_targetted = {};
    this.enemy_tick_idx = 0;
  }
  doEnemyTurnTick(animator?: Animatable): boolean {
    let { enemies } = this;
    // skip dead instantly
    while (this.enemy_tick_idx < enemies.length && !enemies[this.enemy_tick_idx].hp) {
      this.enemy_tick_idx++;
    }
    if (this.enemy_tick_idx >= enemies.length) {
      return false;
    }
    this.doEnemyAction(this.enemy_tick_idx, animator);
    this.enemy_tick_idx++;
    return true;
  }
  doEnemyTurnFinish(): void {
    this.decayAggro();
    this.dice_used = [];
  }
  doEnemyTurn(animator?: Animatable): void {
    this.doEnemyTurnStart();

    while (this.doEnemyTurnTick(animator)) {
      // repeat
    }

    this.doEnemyTurnFinish();
  }

  roll(): void {
    this.dice = [
      rand.range(6) + 1,
      rand.range(6) + 1,
    ];
    for (let ii = 0; ii < this.deaths; ++ii) {
      this.dice.push(rand.range(6) + 1);
    }
    //this.dice = [1,2,3,4,5,6];
    //this.dice[1] = 5;
    this.dice_used = this.dice.map((a) => false);
  }

  getDiceAvail(): Partial<Record<number, true>> {
    let dice_avail: Partial<Record<number, true>> = {};
    for (let ii = 0; ii < this.dice_used.length; ++ii) {
      if (!this.dice_used[ii]) {
        dice_avail[this.dice[ii]] = true;
      }
    }
    return dice_avail;
  }
}

type Floater = FloaterParam & {
  start: number;
};
const ATTACK_TIME = 500;
const ATTACK_LAND_TIME = ATTACK_TIME / 2;
type AttackAnim = {
  enemy_idx: number;
  hero_idx: number;
  start: number;
  end: number; // interrupts
};
const FLOATER_TIME = 750; // not including fade
const FLOATER_FADE = 250;
const FLOATER_TIME_TOTAL = FLOATER_TIME + FLOATER_FADE;
const BLINK_TIME = 250;
let temp_color = vec4(1, 1, 1, 1);

enum CSID {
  PlayerTurn,
  EnemyTurn,
}

class CombatScene {
  state_id: CSID = CSID.PlayerTurn;
  combat_state: CombatState;
  preview_state!: CombatState;
  preview_state_frame!: number;
  enemy_preview_state!: CombatState;
  anims: AnimationSequencer[] = [];
  did_death = false;
  did_victory = false;
  player_is_done = false;
  usable_dice: Partial<Record<number, true>> = {};

  constructor(me: Entity, encounter: Encounter) {
    let combat_state = this.combat_state = new CombatState();
    for (let ii = 0; ii < encounter.enemies.length; ++ii) {
      let enemy_def = ENEMIES[encounter.enemies[ii]];
      assert(enemy_def);
      combat_state.enemies.push(new Enemy(enemy_def));
    }
    let { heroes } = me.data;
    for (let ii = 0; ii < heroes.length; ++ii) {
      let hero_ref = heroes[ii];
      let { class_id, tier } = hero_ref;
      let class_def = CLASSES[class_id]!;
      let { abilities } = class_def;
      let class_tier = class_def.tier[tier];
      let hero = new CombatHero();
      hero.class_ref = class_def;
      hero.tier_ref = class_tier;
      let a0 = ABILITIES[abilities[0]];
      assert(a0);
      let a1 = ABILITIES[abilities[1]];
      assert(a1);
      hero.ability_refs = [a0, a1];
      hero.hp = hero_ref.dead ? 0 : class_tier.hp;
      combat_state.heroes.push(hero);
    }
    this.setPreviewState(combat_state);
  }

  setPreviewState(new_state: CombatState): void {
    this.preview_state = new_state;
    this.preview_state_frame = getFrameIndex();
    this.updateEnemyPreview();
  }
  updateEnemyPreview(): void {
    this.enemy_preview_state = this.preview_state.clone();
    this.enemy_preview_state.doEnemyTurn();
  }

  animPaused(completely: boolean): boolean {
    let expire = getFrameTimestamp() - (completely ? FLOATER_TIME_TOTAL : FLOATER_TIME);
    let { attack_anims, floaters } = this;
    for (let ii = 0; ii < floaters.length; ++ii) {
      if (floaters[ii].start > expire) {
        return true;
      }
    }
    let attack_expire = getFrameTimestamp() + (completely ? 0 : ATTACK_LAND_TIME);
    for (let ii = 0; ii < attack_anims.length; ++ii) {
      if (attack_anims[ii].end > attack_expire) {
        return true;
      }
    }
    return false;
  }
  needsRoll(): boolean {
    return this.state_id === CSID.PlayerTurn && !this.combat_state.dice_used.length;
  }

  last_attack_land_time!: number;
  floaters: Floater[] = [];
  addFloater(f: FloaterParam): void {
    let f2 = f as Floater;
    f2.start = (f.from_attack_enemy === undefined) ? getFrameTimestamp() : this.last_attack_land_time;
    this.floaters.push(f2);
  }
  attack_anims: AttackAnim[] = [];
  animateAttack(enemy_idx: number, hero_idx: number): void {
    let tail_attack: AttackAnim | null = null;
    for (let ii = 0; ii < this.attack_anims.length; ++ii) {
      if (this.attack_anims[ii].enemy_idx === enemy_idx) {
        tail_attack = this.attack_anims[ii];
      }
    }
    let start = getFrameTimestamp();
    if (tail_attack) {
      start = tail_attack.start + ATTACK_TIME * 0.5;
      tail_attack.end = tail_attack.start + ATTACK_TIME * 0.75;
    }
    this.last_attack_land_time = start + ATTACK_LAND_TIME;
    this.attack_anims.push({
      enemy_idx,
      hero_idx,
      start,
      end: start + ATTACK_TIME,
    });
  }
  playSound(sound: string): void {
    playUISound(sound);
  }

  tickFloaters(): void {
    let now = getFrameTimestamp();
    let expire = now - FLOATER_TIME_TOTAL;
    for (let ii = this.floaters.length - 1; ii >= 0; --ii) {
      if (this.floaters[ii].start < expire) {
        this.floaters.splice(ii, 1);
      }
    }
    for (let ii = this.attack_anims.length - 1; ii >= 0; --ii) {
      let anim = this.attack_anims[ii];
      if (anim.end <= now) {
        this.attack_anims.splice(ii, 1);
      }
    }
  }

  drawFloaters(param: FloaterTarget & {
    x: number;
    y: number;
  }): number {
    let { x, y } = param;
    let { floaters } = this;
    let blink = 1;
    for (let ii = 0; ii < floaters.length; ++ii) {
      let floater = floaters[ii];
      if (!sameFloaterTarget(floater, param)) {
        continue;
      }
      let elapsed = getFrameTimestamp() - floater.start;
      if (elapsed < 0) {
        continue;
      }
      if (floater.sound) {
        playUISound(floater.sound);
        delete floater.sound;
      }
      let alpha = 1;
      if (elapsed > FLOATER_TIME) {
        alpha = 1 - (elapsed - FLOATER_TIME) / FLOATER_FADE;
        if (alpha <= 0) {
          continue;
        }
      }
      let float = easeOut(elapsed / (FLOATER_TIME + FLOATER_FADE), 2) * 20;
      if (floater.msg === '[img=shield]') {
        float = 0;
      }
      suppressNewDOMElemWarnings();
      markdownAuto({
        alpha,
        font_style: style_attack,
        x: x - 50 + 1,
        y: y - float - uiTextHeight()/2,
        z: Z.FLOATERS,
        w: 100,
        align: ALIGN.HCENTER,
        text: floater.msg,
      });
      let damage_size = 40;
      v4set(temp_color, 1, 1, 1, alpha);
      if (floater.attack_type === AttackType.FRONT ||
        floater.attack_type === AttackType.BACK ||
        floater.attack_type === AttackType.ALL
      ) {
        if (elapsed < BLINK_TIME) {
          blink = min(blink, elapsed / BLINK_TIME);
        }
        damage_sprite.draw({
          x,
          y: y - float,
          z: Z.FLOATERS - 1,
          w: damage_size, h: damage_size,
          color: temp_color,
        });
      }
    }
    return blink < 1 ? easeOut(blink, 2) : 1;
  }

  getAttackAnim(enemy_idx: number): AttackAnim | null {
    for (let ii = 0; ii < this.attack_anims.length; ++ii) {
      let anim = this.attack_anims[ii];
      if (anim.enemy_idx === enemy_idx) {
        return anim;
      }
    }
    return null;
  }
}

let combat_scene: CombatScene | null = null;

export function combatDrawFloaters(param: FloaterTarget & {
  x: number;
  y: number;
}): number {
  if (!combat_scene) {
    return 1;
  }
  return combat_scene.drawFloaters(param);
}

export function combatSetPreviewState(state: CombatState): void {
  assert(combat_scene);
  combat_scene.setPreviewState(state);
}

export function combatAcitvateAbility(hero_idx: number, ability_idx: number): void {
  assert(combat_scene);
  combat_scene.combat_state.activateAbility(hero_idx, ability_idx, combat_scene);
  combat_scene.updateEnemyPreview();
}

export function combatIsPlayerTurn(): boolean {
  if (!(combat_scene && combat_scene.state_id === CSID.PlayerTurn)) {
    return false;
  }
  // also return false if all enemies are dead, we're just playing animations
  let { enemies } = combat_scene.combat_state;
  for (let ii = 0; ii < enemies.length; ++ii) {
    if (enemies[ii].hp) {
      return true;
    }
  }
  return false;
}

export function combatGetStates(): {
  combat_state: CombatState;
  preview_state: CombatState;
  enemy_preview_state: CombatState;
} | null {
  if (combat_scene) {
    return {
      combat_state: combat_scene.combat_state,
      preview_state: combat_scene.preview_state,
      enemy_preview_state: combat_scene.enemy_preview_state,
    };
  }
  return null;
}

export function cleanupCombat(dt: number): void {
  if (!combat_scene) {
    return;
  }
  combat_scene = null;
}

const color_combat_shade = vec4(0.15, 0.15, 0.15, 0.75);

let enemy_sprites: TSMap<Sprite> = {};

export function combatReadyForEnemyTurn(usable_dice: Partial<Record<number, true>>): void {
  if (!combat_scene) {
    return;
  }
  combat_scene.usable_dice = usable_dice;
  if (empty(usable_dice)) {
    combat_scene.player_is_done = true;
  }
}

function combatStartEnemyTurn(): void {
  assert(combat_scene);
  combat_scene.state_id = CSID.EnemyTurn;
  let { combat_state } = combat_scene;
  combat_state.doEnemyTurnStart();
  combat_state.doEnemyTurnTick(combat_scene);
}
function combatTickEnemyTurn(): void {
  assert(combat_scene);
  let { combat_state } = combat_scene;
  if (combat_state.doEnemyTurnTick(combat_scene)) {
    return;
  }

  // enemies done, go back to players

  combat_state.doEnemyTurnFinish();

  // Apply deaths back to entity data
  let me = myEnt();
  assert(me);
  let ent_heroes = me.data.heroes;
  let { heroes } = combat_state;
  for (let ii = 0; ii < heroes.length; ++ii) {
    if (!heroes[ii].hp) {
      ent_heroes[ii].dead = true;
    }
  }
  combat_scene.state_id = CSID.PlayerTurn;
}

export function combatAnimPaused(): boolean {
  return combat_scene && combat_scene.animPaused(false) || false;
}


let last_combat_frame = -1;
let last_combat_ent: Entity | null = null;
let rolled_at: number;
let color_die_used = vec4(0.25, 0.25, 0.25, 1);
let color_die_revenge = vec4(1, 0, 0, 1);
let color_die_revenge_used = vec4(0.25, 0, 0, 1);
export function doCombat(target: Entity, dt: number): void {
  let me = myEnt();
  assert(me);
  let reset = last_combat_frame !== getFrameIndex() - 1 || target !== last_combat_ent;
  last_combat_frame = getFrameIndex();
  last_combat_ent = target;
  if (reset || !combat_scene) {
    let encounter = ENCOUNTERS[target.data.stats.encounter];
    assert(encounter);
    combat_scene = new CombatScene(me, encounter);
  } else {
    if (combat_scene.preview_state !== combat_scene.combat_state) {
      if (combat_scene.preview_state_frame !== getFrameIndex()) {
        combat_scene.setPreviewState(combat_scene.combat_state);
      }
    }
  }

  combat_scene.tickFloaters();
  if (combat_scene.animPaused(false)) {
    // no state updates
  } else {
    if (combat_scene.needsRoll()) {
      rolled_at = getFrameTimestamp();
      combat_scene.combat_state.roll();
    } else if (combat_scene.state_id === CSID.PlayerTurn && combat_scene.player_is_done) {
      combatStartEnemyTurn();
    } else if (combat_scene.state_id === CSID.EnemyTurn) {
      combatTickEnemyTurn();
    }
  }

  let x0 = VIEWPORT_X0;
  let x1 = VIEWPORT_X0 + render_width;
  let w = x1 - x0;
  let y0 = VIEWPORT_Y0;
  let y1 = VIEWPORT_Y0 + render_height;

  drawRect(x0 - 0.1, y0 - 0.1, x1 + 0.1, y1 + 0.1, Z.COMBAT_SHADE, color_combat_shade);

  let { combat_state, preview_state } = combat_scene;
  let { enemies } = preview_state;

  // draw enemies
  let enemy_w = 56;
  const ENEMY_PAD = 2;
  const ENEMY_SPRITE_Y = y0 + 68;
  const ENEMY_SPRITE_H = 110;
  const ENEMY_BAR_W = 56;
  const ENEMY_BAR_H = 11;
  const ICON_SIZE = 9;
  const ENEMY_BAR_Y = ENEMY_SPRITE_Y - ENEMY_BAR_H - 2;
  const ENEMY_BAR_YOFFS = ENEMY_BAR_Y - ENEMY_SPRITE_Y;
  const ENEMY_STATUS_Y = ENEMY_BAR_Y - ICON_SIZE - 1;
  const ENEMY_STATUS_YOFFS = ENEMY_STATUS_Y - ENEMY_SPRITE_Y;
  const ENEMY_ATTACK_Y = ENEMY_SPRITE_Y + ENEMY_SPRITE_H;
  const ENEMY_ATTACK_YOFFS = ENEMY_ATTACK_Y - ENEMY_SPRITE_Y;
  let enemy_x0 = floor(x0 + (w - enemy_w * enemies.length - ENEMY_PAD * (enemies.length - 1)) / 2);
  for (let ii = 0; ii < enemies.length; ++ii) {
    let enemy = enemies[ii];
    let enemy_x = enemy_x0 + ii * (enemy_w + ENEMY_PAD);
    let enemy_y = ENEMY_SPRITE_Y;
    let z = Z.ENEMY;
    let anim = combat_scene.getAttackAnim(ii);
    if (anim) {
      let p = (getFrameTimestamp() - anim.start) / ATTACK_TIME;
      if (p < 0.5) {
        z += 10;
        p *= 2;
      } else {
        p = 1 - (p * 2 - 1);
      }
      if (anim.hero_idx === -1) {
        // also grow?
        enemy_x = lerp(easeIn(p, 2), enemy_x, enemy_x - 20);
        let p2 = p * 2;
        if (p2 > 1) {
          p2 = 2 - p2;
        }
        enemy_y = lerp(easeOut(p2, 2), enemy_y, enemy_y - 40);
      } else {
        let hero_pos = heroDrawPos(anim.hero_idx);
        enemy_x = lerp(easeIn(p, 2), enemy_x, hero_pos[0]);
        if (p > 0.5) {
          enemy_y = lerp(easeIn(p * 2 - 1, 2), enemy_y, hero_pos[1] - ENEMY_SPRITE_H / 2);
        }
      }
    }
    let x_mid = floor(enemy_x + enemy_w/2);
    let blink = combat_scene.drawFloaters({
      enemy_idx: ii,
      x: x_mid,
      y: enemy_y + ENEMY_SPRITE_H * 0.25,
    });
    let { def } = enemy;
    let { tex } = def;
    let sprite = enemy_sprites[tex];
    let alpha = enemy.hp ? 1 : 0.25;
    temp_color[3] = alpha;
    v3set(temp_color, blink, blink, blink);
    if (!sprite) {
      sprite = enemy_sprites[tex] = spriteCreate({
        name: `enemies/${tex}`,
        lazy_load: true,
        origin: [0.5, 0],
      });
    }
    let aspect = sprite.getAspect();
    sprite.draw({
      x: x_mid,
      y: enemy_y,
      z: z + 1 - ii * 0.1 + (enemy.hp ? 0 : -0.5),
      w: -ENEMY_SPRITE_H * aspect,
      h: ENEMY_SPRITE_H,
      color: temp_color,
    });
    if (!enemy.hp) {
      continue;
    }
    drawHealthBar(true,
      x_mid - ENEMY_BAR_W/2, enemy_y + ENEMY_BAR_YOFFS,
      z, ENEMY_BAR_W, ENEMY_BAR_H, enemy.hp, def.hp, true);

    let status_text = [];
    if (enemy.poison) {
      status_text.push(`${enemy.poison}[img=poison]`);
    }
    if (enemy.temp_shield || def.shield) {
      let text = '';
      if (def.shield) {
        text = `${def.shield}`;
      }
      if (enemy.temp_shield) {
        text += `+${enemy.temp_shield}`;
      }
      status_text.push(`${text}[img=shield]`);
    }
    if (status_text.length) {
      markdownAuto({
        font_style: style_attack,
        x: enemy_x,
        y: enemy_y + ENEMY_STATUS_YOFFS,
        z,
        w: enemy_w,
        h: ICON_SIZE,
        align: ALIGN.HCENTER,
        text: status_text.join(' '),
      });
    }

    let { effects } = def;
    assert.equal(effects.length, 1);
    let attack = effects[0];
    let frame = AttackTypeToFrameEnemies[attack.type];
    aspect = sprite_icons.uidata.aspect[frame];
    let icon_w = ICON_SIZE * aspect;
    sprite_icons.draw({
      x: x_mid - icon_w - 1,
      y: enemy_y + ENEMY_ATTACK_YOFFS,
      z,
      w: icon_w,
      h: ICON_SIZE,
      frame,
    });
    font.drawSized(style_attack, x_mid + 1, enemy_y + ENEMY_ATTACK_YOFFS + 1, z,
      8, `${attack.amount}`);
  }

  // draw dice
  const DIE_W = 20;
  const DIE_PAD = 8;
  const DIE_Y = VIEWPORT_Y0 + render_height + DIE_PAD;
  let num_dice = preview_state.dice.length;
  let die_x = floor(VIEWPORT_X0 + (render_width - (DIE_W * num_dice + DIE_PAD * (num_dice - 1))) / 2);
  for (let ii = 0; ii < num_dice; ++ii) {
    let die = preview_state.dice[ii];
    let used = preview_state.dice_used[ii];
    if (rolled_at > getFrameTimestamp() - 250) {
      die = floor(random() * 6) + 1;
    } else {
      if (!combat_scene.usable_dice[die]) {
        used = true;
      }
    }

    let revenge = ii >= num_dice - combat_scene.combat_state.deaths;
    sprite_icons.draw({
      x: die_x,
      y: DIE_Y,
      w: DIE_W, h: DIE_W,
      frame: spritesheet_icons[`FRAME_DIE${die}`],
      color: revenge ? used ? color_die_revenge_used : color_die_revenge : used ? color_die_used : undefined,
    });
    die_x += DIE_W + DIE_PAD;
  }

  // show hint
  let hint: string = '';
  let num_left = 0;
  for (let ii = 0; ii < combat_state.dice.length; ++ii) {
    let used = combat_state.dice_used[ii];
    if (!used) {
      num_left++;
    }
  }
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
  if (combat_scene.animPaused(true)) {
    end_combat = false;
  }
  enemies = combat_state.enemies;
  for (let ii = 0; ii < enemies.length; ++ii) {
    let enemy = enemies[ii];
    if (enemy.hp) {
      end_combat = false;
    }
  }

  if (engine.DEBUG && buttonText({
    x: VIEWPORT_X0 + 4,
    y: VIEWPORT_Y0 + 4,
    text: 'WIN',
  })) {
    end_combat = true;
  }

  if (end_combat && !combat_scene.did_victory) {
    // victory!
    combat_scene.did_victory = true;
    playUISound('victory');
    entityManager().deleteEntity(target.id, 'killed');
    // TODO: give loot
    bamfCheck();
  }
  combat_scene.player_is_done = false;
}

export function combatStartup(): void {
  // tiny_font = tiny_font_in;
  damage_sprite = spriteCreate({
    name: 'bang',
    origin: vec2(0.5, 0.5),
  });
  font = uiGetFont();
  markdownImageRegisterSpriteSheet(spritesheet_icons);
}
