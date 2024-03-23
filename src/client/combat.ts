import assert from 'assert';
import { AnimationSequencer } from 'glov/client/animation';
import { getFrameIndex } from 'glov/client/engine';
import { fontStyle } from 'glov/client/font';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import { buttonText, drawRect, playUISound, uiGetFont } from 'glov/client/ui';
import { TSMap } from 'glov/common/types';
import { vec4 } from 'glov/common/vmath';
import { AttackType, ENCOUNTERS, ENEMIES, EnemyDef } from './encounters';
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
import { drawHealthBar, myEnt } from './play';

const {
  FRAME_ATTACK_FRONT_ENEMY,
  FRAME_ATTACK_ALL,
  sprite_icons,
} = require('./img/icons');

const { floor } = Math;

type Entity = EntityDemoClient;

class Enemy {
  hp: number;
  constructor(public def: EnemyDef) {
    this.hp = def.hp;
  }
}

class CombatState {
  enemies: Enemy[] = [];
  anims: AnimationSequencer[] = [];
  did_death = false;
  did_victory = false;
}

let combat_state: CombatState | null = null;

export function cleanupCombat(dt: number): void {
  // if (!combat_state) {
  //   return;
  // }
}

const color_combat_shade = vec4(0.15, 0.15, 0.15, 0.75);

let enemy_sprites: TSMap<Sprite> = {};

const style_attack = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x201b25ff,
});

let last_combat_frame = -1;
let last_combat_ent: Entity | null = null;
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
      z: Z.UI + 1 - ii * 0.1,
      w: -ENEMY_SPRITE_H * aspect,
      h: ENEMY_SPRITE_H,
    });
    drawHealthBar(true,
      x_mid - ENEMY_BAR_W/2, ENEMY_SPRITE_Y - ENEMY_BAR_H - 2,
      Z.UI, ENEMY_BAR_W, ENEMY_BAR_H, enemy.hp, def.hp, true);
    let frame = def.attack_type === AttackType.FRONT ? FRAME_ATTACK_FRONT_ENEMY : FRAME_ATTACK_ALL;
    aspect = sprite_icons.uidata.aspect[frame];
    let icon_w = ICON_SIZE * aspect;
    sprite_icons.draw({
      x: x_mid - icon_w - 1,
      y: ENEMY_ATTACK_Y,
      w: icon_w,
      h: ICON_SIZE,
      frame,
    });
    uiGetFont().drawSized(style_attack, x_mid + 1, ENEMY_ATTACK_Y + 1, Z.UI,
      8, `${def.damage}`);
  }

  let end_combat = false;

  if (buttonText({
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
}

export function combatStartup(): void {
  // tiny_font = tiny_font_in;
  // damage_sprite = spriteCreate({
  //   name: 'particles/damage',
  // });
}
