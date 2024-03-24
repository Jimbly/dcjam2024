import assert from 'assert';
import { ALIGN, Font, fontStyle } from 'glov/client/font';
import {
  buttonText,
  uiGetFont,
} from 'glov/client/ui';
import { AttackTypeToFrameHeroes } from './encounters';
import { Hero } from './entity_demo_client';
import { game_height } from './globals';
import { ABILITIES, CLASSES, DICE_SLOTS } from './heroes';
import { myEnt } from './play';

const spritesheet_faces = require('./img/faces');
const { sprite_faces } = spritesheet_faces;
const spritesheet_icons = require('./img/icons');
const {
  FRAME_AGGRO,
  FRAME_HERO_BG,
  FRAME_HERO_BG_EMPTY,
  FRAME_HEALTHBAR_LEFT,
  FRAME_HEALTHBAR_RIGHT,
  FRAME_SHIELD_ON_BLACK,
  sprite_icons,
} = spritesheet_icons;

const { floor, max } = Math;
let font_tiny: Font;
let font: Font;

export function heroesDrawStartup(font_tiny_in: Font): void {
  font_tiny = font_tiny_in;
  font = uiGetFont();
}

const style_hp = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x4a546280,
});

const style_shield = fontStyle(null, {
  color: 0xb3b9d1ff,
});
const style_aggro = fontStyle(null, {
  color: 0xda1625ff,
});
const style_effect = fontStyle(null, {
  color: 0x000000ff,
});

const HERO_H = floor(game_height / 6);
const HP_W = 91;
const HP_X = 50;
const HP_Y = 4;
const HP_BIAS = 0.05; // bias to get texels to line up slightly better - instead, just draw under and draw border?
const SHIELD_X = 167;
const AGGRO_X = 194;
const ICON_SIZE = 9;
const PORTRAIT_X = 8;
const PORTRAIT_Y = 6;
const ABILITY_X = [48,126];
const ABILITY_Y = 12;
const ABILITY_W = 76;
const ABILITY_H = 32;
function drawHero(idx: number, hero: Hero, is_combat: boolean): void {
  let x0 = 0;
  let y0 = idx * HERO_H;
  let aspect = sprite_icons.uidata.aspect[FRAME_HERO_BG];
  let { class_id, tier } = hero;
  let class_def = CLASSES[class_id]!;
  let class_tier = class_def.tier[tier];
  let hp = hero.hp / class_tier.hp;
  let z = Z.UI;
  sprite_icons.draw({
    x: x0,
    y: y0,
    z,
    h: HERO_H,
    w: aspect * HERO_H,
    frame: hp ? FRAME_HERO_BG : FRAME_HERO_BG_EMPTY
  });
  z++;
  let face = class_def.faces[hero.face || 0] || class_def.faces[0];
  sprite_faces.draw({
    x: PORTRAIT_X,
    y: y0 + PORTRAIT_Y,
    w: 32, h: 32,
    frame: spritesheet_faces[`FRAME_${face.toUpperCase()}`],
  });
  if (hp) {
    let hp_w = max(1, floor(HP_W * hp));
    if (hp_w >= 5) {
      sprite_icons.draw({
        x: x0 + HP_X,
        y: y0 + HP_Y - HP_BIAS,
        z,
        w: 5,
        h: 5,
        frame: FRAME_HEALTHBAR_LEFT,
      });
      if (hp_w > 5) {
        sprite_icons.draw({
          x: x0 + HP_X + 5,
          y: y0 + HP_Y - HP_BIAS,
          z,
          w: hp_w - 5,
          h: 5,
          frame: FRAME_HEALTHBAR_RIGHT,
        });
      }
    } else {
      let uvs = sprite_icons.uidata.rects[FRAME_HEALTHBAR_LEFT];
      sprite_icons.draw({
        x: x0 + HP_X,
        y: y0 + HP_Y - HP_BIAS,
        z,
        w: hp_w,
        h: 5,
        uvs: [uvs[0], uvs[1], uvs[0] + (uvs[2] - uvs[0]) * hp_w/5, uvs[3]],
      });
    }
    z++;
    font_tiny.draw({
      style: style_hp,
      x: x0 + HP_X,
      y: y0 + HP_Y - 1,
      z,
      w: HP_W,
      align: ALIGN.HCENTER,
      text: is_combat ? `${hero.hp} / ${class_tier.hp}` : `${hero.hp}`,
    });
  }

  let y = y0 + 2;
  let shield_text = '';
  if (class_tier.shield) {
    shield_text = `${class_tier.shield}`;
  }
  if (hero.temp_shield && is_combat) {
    shield_text += `+${hero.temp_shield}`;
  }
  if (shield_text) {
    sprite_icons.draw({
      x: x0 + SHIELD_X,
      y, z,
      w: ICON_SIZE,
      h: ICON_SIZE,
      frame: FRAME_SHIELD_ON_BLACK,
    });
    font.drawSizedAligned(style_shield, x0 + SHIELD_X, y + 1, z, 8, ALIGN.HRIGHT, 0, 0, shield_text);
  }

  if (is_combat) {
    sprite_icons.draw({
      x: x0 + AGGRO_X,
      y, z,
      w: ICON_SIZE,
      h: ICON_SIZE,
      frame: FRAME_AGGRO,
    });
    font.drawSizedAligned(style_aggro, x0 + AGGRO_X, y + 1, z, 8, ALIGN.HRIGHT, 0, 0, `${hero.aggro}`);
  }

  y = y0 + ABILITY_Y;
  let abil_y0 = y;
  let zabil = z;
  for (let ability_idx = 0; ability_idx < 2; ++ability_idx) {
    z = zabil;
    y = abil_y0;
    let ability_id = class_def.abilities[ability_idx];
    let ability = ABILITIES[ability_id]!;
    let x = x0 + ABILITY_X[ability_idx];
    buttonText({
      x,
      y,
      z,
      w: ABILITY_W,
      h: ABILITY_H,
      text: ' ',
      base_name: 'abilitybutton',
      disabled: !is_combat,
    });
    z++;
    let die = DICE_SLOTS[idx][ability_idx];
    sprite_icons.draw({
      x: x + 31,
      y: y + 5,
      z,
      w: 10, h: 10,
      frame: spritesheet_icons[`FRAME_DIE${die}`],
    });
    sprite_icons.draw({
      x: x + 61,
      y: y + 6,
      z,
      w: ICON_SIZE, h: ICON_SIZE,
      frame: FRAME_AGGRO,
    });
    font.drawSizedAligned(style_aggro,
      x + 61, y + 6 + 1, z, 8, ALIGN.HRIGHT, 0, 0, `${ability.aggro}`);

    let { icon, effects } = ability;
    sprite_icons.draw({
      x: x + 4, y: y + 4, z,
      w: 24, h: 24,
      frame: spritesheet_icons[`FRAME_${icon.toUpperCase()}`],
    });

    x += 30;
    y += 18;
    const EFF_TOTAL_W = 41;
    const EFF_W = 16;
    let extra = EFF_TOTAL_W - effects.length * EFF_W;
    let padleft = effects.length > 1 ? 2 : floor(extra / (effects.length + 1));
    let padmid = effects.length > 1 ? extra - padleft * 2 : 0;
    x += padleft;
    for (let effect_idx = 0; effect_idx < effects.length; ++effect_idx) {
      let effect = effects[effect_idx];
      font.drawSized(style_effect, x, y + 1, z, 8, `${effect.amount}`);
      let frame = AttackTypeToFrameHeroes[effect.type];
      aspect = sprite_icons.uidata.aspect[frame];
      let icon_w = ICON_SIZE * aspect;
      sprite_icons.draw({
        x: x + 7,
        y, z,
        w: icon_w, h: ICON_SIZE,
        frame,
      });
      x += EFF_W + padmid;
    }
  }
}

export function heroesDraw(is_combat: boolean): void {
  let me = myEnt();
  assert(me);
  let { heroes } = me.data;
  if (!heroes) {
    return;
  }
  for (let ii = 0; ii < heroes.length; ++ii) {
    let hero = heroes[ii];
    drawHero(ii, hero, is_combat);
  }
}
