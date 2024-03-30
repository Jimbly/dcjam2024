export const HERO_W = 204;
// eslint-disable-next-line import/order
import { game_height } from './globals';
export const HERO_H = Math.floor(game_height / 6);
export const PORTRAIT_SIZE = 32;

import assert from 'assert';
import * as engine from 'glov/client/engine';
import {
  getFrameIndex,
  getFrameTimestamp,
} from 'glov/client/engine';
import { ALIGN, Font, fontStyle, fontStyleAlpha } from 'glov/client/font';
import { markdownAuto } from 'glov/client/markdown';
import {
  ButtonTextParam,
  buttonText,
  buttonWasFocused,
  drawBox,
  uiGetFont,
  sprites as ui_sprites,
} from 'glov/client/ui';
import { WithRequired } from 'glov/common/types';
import { v4copy, v4set, vec4 } from 'glov/common/vmath';
import { bamfActive } from './bamf';
import {
  combatAcitvateAbility,
  combatAnimPaused,
  combatDrawFloaters,
  combatGetStates,
  combatIsPlayerTurn,
  combatReadyForEnemyTurn,
  combatSetPreviewState,
  showAbilityTooltip,
} from './combat';
import {
  AttackType,
  AttackTypeToFrameEnemies,
  AttackTypeToFrameHeroes,
  AttackTypeToMDHeroes,
} from './encounters';
import { Hero } from './entity_demo_client';
import {
  ABILITIES,
  CLASSES,
  DICE_SLOTS,
  effectGetValue,
} from './heroes';
import { isBootstrap, isSolitude, levelUpAbility, myEnt, xpCost } from './play';

const spritesheet_faces = require('./img/faces');
const { sprite_faces } = spritesheet_faces;
const spritesheet_icons = require('./img/icons');
const {
  FRAME_AGGRO,
  FRAME_HERO_BG,
  FRAME_HERO_BG_EMPTY,
  FRAME_HEALTHBAR_LEFT,
  FRAME_HEALTHBAR_RIGHT,
  FRAME_RANK1,
  FRAME_RANK2,
  FRAME_SHIELD_ON_BLACK,
  FRAME_STAR,
  FRAME_SKULL,
  sprite_icons,
} = spritesheet_icons;

const { abs, floor, max, min, round, sin } = Math;
let font_tiny: Font;
let font: Font;

export function heroesDrawStartup(font_tiny_in: Font): void {
  font_tiny = font_tiny_in;
  font = uiGetFont();
}

const DEAD_ALPHA = 0.5;

const style_label = fontStyle(null, { color: 0xffffffff });
const style_hp = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x4a546280,
});

const style_shield = fontStyle(null, {
  color: 0xb3b9d1ff,
});
const style_shield_dead = fontStyleAlpha(style_shield, DEAD_ALPHA);
const style_aggro = fontStyle(null, {
  color: 0xda1625ff,
});
const style_aggro_dead = fontStyleAlpha(style_aggro, DEAD_ALPHA);
const style_aggro_top = fontStyle(style_aggro, {
  color: 0x721313ff,
  outline_color: 0xda1625ff,
  outline_width: 4,
});
const style_effect = fontStyle(null, {
  color: 0x000000ff,
});
const style_effect_dead = fontStyleAlpha(style_effect, DEAD_ALPHA);

const style_attack = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x201b25ff,
});
const style_attack_blocked = fontStyleAlpha(style_attack, 0.25);

const style_name = fontStyle(null, {
  color: 0x141013ff,
  outline_width: 3.5,
  outline_color: 0x4a546265,
});

export function drawHeroName(x: number, y: number, z: number, name: string, alpha: number): void {
  font_tiny.draw({
    style: style_name,
    x,
    y,
    z,
    w: PORTRAIT_SIZE,
    align: ALIGN.HCENTER,
    text: name,
    alpha,
  });
}

const HP_W = 91;
const HP_X = 50;
const HP_Y = 4;
const HP_BIAS = 0.05; // bias to get texels to line up slightly better - instead, just draw under and draw border?
const SHIELD_X = 168;
const AGGRO_X = 194;
const ICON_SIZE = 9;
const PORTRAIT_X = 8;
const PORTRAIT_Y = 6;
const ABILITY_X = [48,126];
const ABILITY_Y = 12;
const ABILITY_W = 76;
const ABILITY_H = 32;
let dice_usable: Partial<Record<number, true>>;
const color_dead = vec4(1, 1, 1, DEAD_ALPHA);
const color_dead_portrait = vec4(0, 0, 0, 1);
const color_temp = vec4();

let ability_tooltip: string | null = null;
let ability_tooltip_level = -1;
let ability_tooltip_tier = -1;
let ability_tooltip_frame = -1;
export function getAbiltiyTooltip(for_levelup: boolean): string | null {
  if (getFrameIndex() !== ability_tooltip_frame) {
    return null;
  }
  assert(ability_tooltip);
  let ability = ABILITIES[ability_tooltip]!;
  let { name, aggro, effects } = ability;
  let ret = [];
  if (for_levelup) {
    ret.push(`[c=xp]Level up![/c] **${name}** ` +
      `L${ability_tooltip_level}${ability_tooltip_level ? `[img=rank${ability_tooltip_level}md]` : ''}` +
      `→L${ability_tooltip_level+1}[img=rank${ability_tooltip_level+1}md]`);
    ret.push(`Cost = [c=xp]${xpCost(ability_tooltip_tier, ability_tooltip_level)}xp[/c]`);
  } else {
    ret.push(`**${name}**`);
  }

  for (let ii = 0; ii < effects.length; ++ii) {
    let effect = effects[ii];
    let { type } = effect;
    let amount = effectGetValue(effect, ability_tooltip_tier, ability_tooltip_level);
    let frame = AttackTypeToMDHeroes[type];
    let msg = `${amount}${frame}`;
    if (for_levelup) {
      amount = effectGetValue(effect, ability_tooltip_tier, ability_tooltip_level + 1);
      msg += `→${amount}${frame}`;
    }
    msg += ' - ';
    switch (type) {
      case AttackType.FRONT:
        msg += `attack the [c=3]front[/c] monster for [c=1]${amount}[/c]`;
        break;
      case AttackType.BACK:
        msg += `attack the [c=3]rear[/c] monster for [c=1]${amount}[/c]`;
        break;
      case AttackType.ALL:
        msg += `attack [c=3]all[/c] monsters for [c=1]${amount}[/c]`;
        break;
      case AttackType.SHIELD_SELF:
        msg += `[c=2]block[/c] an extra ${amount} this round`;
        break;
      case AttackType.SHIELD_ALL:
        msg += `all allies [c=2]block[/c] ${amount} more this round`;
        break;
      case AttackType.POISON:
        msg += `add [c=2]${amount}[/c] [c=2]poison[/c] to the [c=3]front[/c] monster`;
        break;
      case AttackType.HEAL:
        msg += `[c=2]heal[/c] [c=1]${amount}[/c] to the most wounded ally`;
        break;
      case AttackType.HEAL_ALL:
        msg += `[c=2]heal[/c] [c=1]${amount}[/c] to all allies`;
        break;
      default:
        msg += '???';
    }
    ret.push(msg);
  }

  if (aggro < 0) {
    ret.push(`Reduces [img=aggro]aggro by [c=1]${-aggro}[/c]`);
  } else if (aggro) {
    ret.push(`[img=aggro]aggro increases by [c=1]${aggro}[/c]`);
  }

  return ret.join('\n');
}
function abilitySetTooltip(ability_id: string, tier: number, level: number): void {
  ability_tooltip_frame = getFrameIndex();
  ability_tooltip = ability_id;
  ability_tooltip_level = level;
  ability_tooltip_tier = tier;
}

const placeholder_hero: Hero = {
  name: '',
} as Hero;

let any_level_up_available: [number, number] | null = null;

export function heroDrawPos(hero_idx: number): [number, number] {
  return [0 + PORTRAIT_X + PORTRAIT_SIZE / 2, hero_idx * HERO_H + PORTRAIT_Y + PORTRAIT_SIZE/2];
}
export function drawHero(idx: number, x0: number, y0: number, z: number, hero_def: Hero, xp_avail?: number): void {
  let combat_states = combatGetStates();
  let combat_hero = combat_states && combat_states.combat_state.heroes[idx] || null;
  let preview_hero = combat_states && combat_states.preview_state.heroes[idx] || null;
  let aspect = sprite_icons.uidata.aspect[FRAME_HERO_BG];
  let { tier, class_id } = hero_def;
  let class_def = CLASSES[class_id];
  let is_placeholder = hero_def === placeholder_hero;
  let class_tier = class_def && class_def.tier[tier];
  let hp = is_placeholder ? 0 : preview_hero ? preview_hero.hp / class_tier!.hp : 1;
  let dead = preview_hero ? !hp : hero_def.dead;
  if (dead) {
    hp = 0;
  }
  let blink = combatDrawFloaters({
    x: x0 + PORTRAIT_X + PORTRAIT_SIZE/2,
    y: y0 + PORTRAIT_Y + PORTRAIT_SIZE/2,
    hero_idx: idx,
  });
  sprite_icons.draw({
    x: x0,
    y: y0,
    z,
    h: HERO_H,
    w: aspect * HERO_H,
    frame: hp ? FRAME_HERO_BG : FRAME_HERO_BG_EMPTY
  });
  if (hp && blink < 1) {
    v4set(color_temp, 1, 1, 1, 1 - blink);
    sprite_icons.draw({
      x: x0,
      y: y0,
      z: z + 0.1,
      h: HERO_H,
      w: aspect * HERO_H,
      frame: FRAME_HERO_BG_EMPTY,
      color: color_temp,
    });
  }
  z++;
  let face = class_def ? (class_def.faces[hero_def.face || 0] || class_def.faces[0]) : '';
  if (dead) {
    v4copy(color_temp, color_dead_portrait);
  } else {
    v4set(color_temp, blink, blink, blink, 1);
  }
  if (face) {
    let face_frame = spritesheet_faces[`FRAME_${face[1].toUpperCase()}`];
    let face_aspect = sprite_faces.uidata.aspect[face_frame] || 1;
    let face_w = round(PORTRAIT_SIZE * face_aspect);
    sprite_faces.draw({
      x: x0 + PORTRAIT_X + floor((PORTRAIT_SIZE - face_w) / 2),
      y: y0 + PORTRAIT_Y,
      z,
      w: face_w,
      h: PORTRAIT_SIZE,
      frame: face_frame,
      color: color_temp,
    });
  }
  z++;
  if (hero_def.name) {
    drawHeroName(x0 + PORTRAIT_X, y0 + PORTRAIT_Y + PORTRAIT_SIZE + 1, z, hero_def.name, 1);
  }
  for (let ii = 0; ii < tier; ++ii) {
    sprite_icons.draw({
      x: x0 + 3 + ii * 9,
      y: y0 + 30,
      z,
      w: 9, h: 8,
      frame: FRAME_STAR,
    });
  }
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
  }
  z++;
  if (class_tier) {
    font_tiny.draw({
      style: style_hp,
      x: x0 + HP_X,
      y: y0 + HP_Y - 1,
      z,
      w: HP_W,
      align: ALIGN.HCENTER,
      text: dead && !hero_def.left ? 'DEAD' :
        preview_hero ? `${preview_hero.hp} / ${class_tier!.hp}` : `${class_tier!.hp}`,
    });
  }

  let y = y0 + 2;
  let shield_text = '';
  if (class_tier && class_tier.shield) {
    shield_text = `${class_tier.shield}`;
  }
  if (preview_hero && preview_hero.temp_shield) {
    shield_text += `+${preview_hero.temp_shield}`;
  }
  if (shield_text) {
    sprite_icons.draw({
      x: x0 + SHIELD_X,
      y, z,
      w: ICON_SIZE,
      h: ICON_SIZE,
      frame: FRAME_SHIELD_ON_BLACK,
      color: dead ? color_dead : undefined,
    });
    font.draw({
      style: dead ? style_shield_dead : style_shield,
      x: x0 + SHIELD_X,
      y: y + 1,
      z,
      size: 8,
      align: ALIGN.HRIGHT,
      text: shield_text,
    });
  }

  if (preview_hero) {
    sprite_icons.draw({
      x: x0 + AGGRO_X,
      y, z,
      w: ICON_SIZE,
      h: ICON_SIZE,
      frame: FRAME_AGGRO,
      color: dead ? color_dead : undefined,
    });

    let aggro_top = false;
    {
      assert(combat_states);
      let { heroes } = combat_states.preview_state;
      let most_aggro = 1;
      for (let ii = 0; ii < heroes.length; ++ii) {
        let hero = heroes[ii];
        if (hero.hp) {
          most_aggro = max(most_aggro, hero.aggro);
        }
      }
      aggro_top = preview_hero.aggro === most_aggro;
      // This behaves weird when killing monsters
      // let incoming = combat_states.enemy_preview_state.heroes_attacked[idx];
      // if (incoming && preview_hero.aggro) {
      //   for (let ii = 0; ii < incoming.length; ++ii) {
      //     if (incoming[ii][0] !== AttackType.ALL) {
      //       aggro_top = true;
      //     }
      //   }
      // }
    }

    font.draw({
      style: dead ? style_aggro_dead : aggro_top ? style_aggro_top : style_aggro,
      x: x0 + AGGRO_X,
      y: y + 1,
      z,
      size: 8,
      align: ALIGN.HRIGHT,
      text: `${preview_hero.aggro}`,
    });
  }

  let dice_avail = combat_states && combat_states.combat_state.getDiceAvail() || {};
  y = y0 + ABILITY_Y;
  let abil_y0 = y;
  let zabil = z;
  let is_solitude = isSolitude() && !bamfActive();
  // eslint-disable-next-line no-unmodified-loop-condition
  for (let ability_idx = 0; class_def && ability_idx < 2; ++ability_idx) {
    z = zabil;
    y = abil_y0;
    let ability_id = class_def.abilities[ability_idx];
    let ability = ABILITIES[ability_id]!;
    let { icon, effects } = ability;
    let die = DICE_SLOTS[idx][ability_idx];
    let x = x0 + ABILITY_X[ability_idx];
    let disabled = Boolean(!combat_hero || !dice_avail[die] || hero_def.dead || dead || !combatIsPlayerTurn());
    let level_up_available = false;
    let tooltip: string | undefined;
    if (is_solitude) {
      if (!hero_def.levels) {
        hero_def.levels = [0,0];
      }
      let xp_for_level_up = xpCost(tier, hero_def.levels[ability_idx]);
      if (xp_avail && xp_avail >= xp_for_level_up) {
        level_up_available = true;
        disabled = false;
      } else {
        if (isFinite(xp_for_level_up)) {
          tooltip = `[c=xp]${xp_for_level_up}xp[/c] needed to level up`;
        } else {
          tooltip = 'Ability is at maximum level';
        }
      }
    }

    // Don't do this, force them to use each die, they may want to _not_ generate aggro on another ability
    // if (effects.length === 0 && ability.aggro < 0 && !hero.aggro) {
    //   disabled = true;
    // }
    if (!disabled) {
      dice_usable[die] = true;
    }
    let button_param: WithRequired<ButtonTextParam, 'x' | 'y' | 'w' | 'h'> = {
      x,
      y,
      z,
      w: ABILITY_W,
      h: ABILITY_H,
      text: ' ',
      base_name: 'abilitybutton',
      disabled,
      sound_rollover: disabled ? null : undefined,
      sound_button: level_up_available ? 'level_up' : icon,
      disabled_focusable: true,
      tooltip,
    };
    if (buttonText(button_param)) {
      if (level_up_available) {
        levelUpAbility(idx, ability_idx);
      } else {
        combatAcitvateAbility(idx, ability_idx);
      }
    } else if (buttonWasFocused() && !combatAnimPaused()) {
      if (disabled) {
        drawBox({
          ...button_param,
          z: z + 0.05,
        }, ui_sprites.abilitybutton_disabled_focused, 1);
      } else {
        if (level_up_available) {
          any_level_up_available = [idx, ability_idx];
        } else {
          assert(combat_states);
          let new_state = combat_states.combat_state.clone();
          new_state.activateAbility(idx, ability_idx);
          combatSetPreviewState(new_state);
        }
      }
      abilitySetTooltip(ability_id, tier, hero_def.levels?.[ability_idx] || 0);
    }

    z++;
    sprite_icons.draw({
      x: x + 31,
      y: y + 5,
      z,
      w: 10, h: 10,
      frame: spritesheet_icons[`FRAME_DIE${die}`],
      color: dead ? color_dead : undefined,
    });
    sprite_icons.draw({
      x: x + 61,
      y: y + 6,
      z,
      w: ICON_SIZE, h: ICON_SIZE,
      frame: FRAME_AGGRO,
      color: dead ? color_dead : undefined,
    });
    font.drawSizedAligned(dead ? style_aggro_dead : style_aggro,
      x + 61, y + 6 + 1, z, 8, ALIGN.HRIGHT, 0, 0, `${ability.aggro}`);

    sprite_icons.draw({
      x: x + 4, y: y + 4, z,
      w: 24, h: 24,
      frame: spritesheet_icons[`FRAME_${icon.toUpperCase()}`],
      color: dead ? color_dead : undefined,
    });
    let abil_level = hero_def.levels?.[ability_idx] || 0;
    if (abil_level) {
      sprite_icons.draw({
        x: x + 3, y: y + 18, z: z + 0.5,
        w: 9, h: 11,
        frame: abil_level === 1 ? FRAME_RANK1 : FRAME_RANK2,
        color: dead ? color_dead : undefined,
      });
    }

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
      let amount = effectGetValue(effect, tier, abil_level);
      font.drawSized(dead ? style_effect_dead : style_effect, x, y + 1, z, 8, `${amount}`);
      let frame = AttackTypeToFrameHeroes[effect.type];
      aspect = sprite_icons.uidata.aspect[frame];
      let icon_w = ICON_SIZE * aspect;
      sprite_icons.draw({
        x: x + 7,
        y, z,
        w: icon_w, h: ICON_SIZE,
        frame,
        color: dead ? color_dead : undefined,
      });
      x += EFF_W + padmid;
    }
  }

  if (!class_def && (idx === 0 || !isBootstrap())) {
    markdownAuto({
      font_style: style_label,
      x: x0 + ABILITY_X[0],
      y: abil_y0,
      w: ABILITY_W * 2,
      h: ABILITY_H,
      align: ALIGN.HVCENTER,
      alpha: isBootstrap() ? 0.5 : abs(sin(getFrameTimestamp() * 0.0005)) * 0.5,
      text: idx === 0 ? 'Choose a leader...' : 'Gathering party...', // '[c=2]Bamf[/c] device charging...',
    });
  }

  // draw predicted incoming damage
  // Disabled this: it's too noisy, not really clear anyway, maybe even removes the interesting aggro math
  if (combat_hero && engine.defines.INCOMING) {
    assert(combat_states);
    let incoming = combat_states.enemy_preview_state.heroes_attacked[idx];
    if (incoming) {
      y = y0; // + floor((HERO_H - ICON_SIZE) / 2);
      for (let ii = 0; ii < incoming.length; ++ii) {
        let x = x0 + HERO_W;
        let [attack_type, amount] = incoming[ii];
        let frame = AttackTypeToFrameEnemies[attack_type];
        aspect = sprite_icons.uidata.aspect[frame];
        let icon_w = ICON_SIZE * aspect;
        x += 11 - icon_w;
        sprite_icons.draw({
          x, y, z,
          w: icon_w, h: ICON_SIZE,
          frame,
          color: amount ? undefined : color_dead,
        });
        x += icon_w + 1;
        x += 4 + font.drawSized(amount ? style_attack : style_attack_blocked, x, y + 1, z, 8, `${amount}`);
        y += ICON_SIZE + 1;
      }
      if (!combat_states.enemy_preview_state.heroes[idx].hp) {
        let x = x0 + HERO_W;
        let frame = FRAME_SKULL;
        aspect = sprite_icons.uidata.aspect[frame];
        let icon_w = ICON_SIZE * aspect;
        x += 11 - icon_w;
        sprite_icons.draw({
          x, y, z,
          w: icon_w, h: ICON_SIZE,
          frame,
        });
        y += ICON_SIZE + 1;
      }
    }
  }
}

export function heroesDraw(is_combat: boolean): void {
  let me = myEnt();
  assert(me);
  let { heroes, xp } = me.data;
  if (!heroes) {
    return;
  }
  any_level_up_available = null;
  dice_usable = {};
  for (let ii = 0; ii < max(6, heroes.length); ++ii) {
    let x0 = 0;
    let y0 = ii * HERO_H;
    drawHero(ii, x0, y0, Z.UI, heroes[ii] || placeholder_hero, xp);
  }
  if (is_combat) {
    combatReadyForEnemyTurn(dice_usable);
  } else if (any_level_up_available) {
    let hero_idx = any_level_up_available[0];
    showAbilityTooltip(HERO_W, min(game_height - 68, round(HERO_H * hero_idx) + 12), true);
  }
}
