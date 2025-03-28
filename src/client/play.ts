/* eslint max-len:off */
import assert from 'assert';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import {
  getFrameDt,
  getFrameTimestamp,
} from 'glov/client/engine';
import {
  ALIGN,
  Font,
  FontStyle,
  fontStyle,
  fontStyleAlpha,
} from 'glov/client/font';
import { fscreenActive, fscreenAvailable, fscreenEnter, fscreenExit } from 'glov/client/fscreen';
import * as input from 'glov/client/input';
import {
  keyDownEdge,
  KEYS,
  keyUpEdge,
  PAD,
  padButtonUpEdge,
} from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { markdownSetColorStyle } from 'glov/client/markdown_renderables';
import { ClientChannelWorker } from 'glov/client/net';
import {
  scoreAlloc,
  ScoreSystem,
} from 'glov/client/score';
import { MenuItem } from 'glov/client/selection_box';
import * as settings from 'glov/client/settings';
import { settingsRegister, settingsSet } from 'glov/client/settings';
import { SimpleMenu, simpleMenuCreate } from 'glov/client/simple_menu';
import {
  Sprite,
  spriteCreate,
  SpriteDrawParams,
} from 'glov/client/sprites';
import {
  ButtonStateString,
  buttonText,
  drawBox,
  drawRect,
  menuUp,
  modalDialog,
  panel,
  playUISound,
  sprites as ui_sprites,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
} from 'glov/common/types';
import { clamp, easeIn } from 'glov/common/util';
import {
  v2same,
  v4set,
  Vec2,
  vec4,
} from 'glov/common/vmath';
import {
  crawlerLoadData,
  JSVec3,
} from '../common/crawler_state';
import {
  aiDoFloor,
  aiTraitsClientStartup,
} from './ai';
import { ambienceHeartbeatPulse, ambienceSetHeartbeat, ambienceTick, forceNoMusic } from './ambience';
import { bamfReset, bamfTick } from './bamf';
import { cleanupCombat, combatPreviewAlpha, doCombat } from './combat';
// import './client_cmds';
import {
  buildModeActive,
  crawlerBuildModeUI,
} from './crawler_build_mode';
import {
  crawlerCommStart,
  crawlerCommWant,
} from './crawler_comm';
import { CrawlerController } from './crawler_controller';
import {
  crawlerEntityClientStartupEarly,
  crawlerEntityManager,
  crawlerEntityTraitsClientStartup,
  crawlerMyEnt,
  crawlerMyEntOptional,
  isLocal,
  isOnline,
} from './crawler_entity_client';
import {
  crawlerMapViewDraw,
  crawlerMapViewStartup,
  mapViewActive,
  mapViewSetActive,
  mapViewToggle,
} from './crawler_map_view';
import {
  crawlerBuildModeActivate,
  crawlerController,
  crawlerCurSavePlayTime,
  crawlerGameState,
  crawlerPlayBottomOfFrame,
  crawlerPlayInitOffline,
  crawlerPlayStartup,
  crawlerPlayTopOfFrame,
  crawlerPlayWantMode,
  crawlerPrepAndRenderFrame,
  crawlerRenderSetUIClearColor,
  crawlerSaveGame,
  crawlerSavePlayTime,
  crawlerScriptAPI,
  getScaledFrameDt,
} from './crawler_play';
import {
  crawlerRenderViewportSet,
} from './crawler_render';
import {
  crawlerRenderEntitiesStartup,
} from './crawler_render_entities';
import { crawlerScriptAPIDummyServer } from './crawler_script_api_client';
import { crawlerOnScreenButton } from './crawler_ui';
import './dialog_data';
import {
  dialogMoveLocked,
  DialogParam,
  dialogRun,
  dialogStartup,
} from './dialog_system';
import {
  entitiesAt,
  EntityDemoClient,
  entityManager,
  Hero,
} from './entity_demo_client';
// import { EntityDemoClient } from './entity_demo_client';
import {
  game_height,
  game_width,
  render_height,
  render_width,
  SANITY_W,
  VIEWPORT_X0,
  VIEWPORT_Y0,
} from './globals';
import { heroesDraw } from './hero_draw';
import { jamTraitsReset, jamTraitsStartup } from './jam_events';
import { levelGenTest } from './level_gen_test';
import { renderAppStartup, renderResetFilter } from './render_app';
import {
  statusPush,
  statusTick,
} from './status';
import { hasSaveData } from './title';

const spritesheet_icons = require('./img/icons');
const {
  FRAME_SANITY24,
  FRAME_XPBAR,
} = spritesheet_icons;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { abs, floor, max, min, round, sin } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let turn_toggle: 0 | 1;
}

declare module 'glov/client/ui' {
  interface UISprites {
    abilitybutton_disabled_focused: Sprite;
    sanity_bar_blocked: Sprite;
    sanity_bar_full: Sprite;
    sanity_bar_bg: Sprite;
    sanity_bg: Sprite;
    panel_note: Sprite;
    panel_combat_log_title: Sprite;
    filler: Sprite;
  }
}

const MOVE_BUTTONS_X0 = 290;
// const ATTACK_WINDUP_TIME = 1000;
const BOTTOM_UI_Y = 200;
const MINIMAP_RADIUS = 3;
const MINIMAP_W = 5+7*((MINIMAP_RADIUS+1)*2 + 1);
const MINIMAP_H = 5+7*(MINIMAP_RADIUS*2 + 1);
const MINIMAP_X = VIEWPORT_X0 + floor((MOVE_BUTTONS_X0 - VIEWPORT_X0 - MINIMAP_W)/2);
const MINIMAP_Y = BOTTOM_UI_Y + floor((game_height - BOTTOM_UI_Y - MINIMAP_H)/2);
const COMPASS_X = MINIMAP_X;
const COMPASS_Y = MINIMAP_Y + MINIMAP_H;

const MOVE_BUTTONS_Y0 = BOTTOM_UI_Y;

const BUTTON_W = 32;

// const MENU_BUTTON_X = VIEWPORT_X0;
// const MENU_BUTTON_Y = BOTTOM_UI_Y;
const MENU_BUTTON_X = game_width - BUTTON_W - 1;
const MENU_BUTTON_Y = 2;

const PAUSE_MENU_W = 240;

const color_myblack = vec4(20/255, 16/255, 19/255, 1);

type Entity = EntityDemoClient;

let font: Font;
let font_tiny: Font;

let loading_level = false;

let controller: CrawlerController;

let pause_menu_up = false;
let help_menu_up = false;

let button_sprites: Record<ButtonStateString, Sprite>;
let button_sprites_down: Record<ButtonStateString, Sprite>;
let button_sprites_notext: Record<ButtonStateString, Sprite>;
let button_sprites_notext_down: Record<ButtonStateString, Sprite>;
type BarSprite = {
  bg: Sprite;
  hp: Sprite;
  empty: Sprite;
};
let bar_sprites: {
  healthbar: BarSprite;
  enemy_healthbar: BarSprite;
};

const style_text = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x000000ff,
});

const style_dialog = fontStyle(null, {
  color: 0xFFFFFFff,
});

export function myEnt(): Entity {
  return crawlerMyEnt() as Entity;
}

export function myEntOptional(): Entity | undefined {
  return crawlerMyEntOptional() as Entity | undefined;
}

// function entityManager(): ClientEntityManagerInterface<Entity> {
//   return crawlerEntityManager() as ClientEntityManagerInterface<Entity>;
// }

let autosave_pos: JSVec3 | null = null;
function autoSavedHere(): boolean {
  if (!autosave_pos) {
    return false;
  }
  let ent = myEntOptional();
  if (!ent) {
    return false;
  }
  return v2same(ent.data.pos, autosave_pos);
}

const allow_manual_save = true;
let pause_menu: SimpleMenu;
function pauseMenu(in_combat: boolean): void {
  if (!pause_menu) {
    pause_menu = simpleMenuCreate({
      x: floor((game_width - PAUSE_MENU_W)/2),
      y: 50,
      z: Z.MODAL + 2,
      width: PAUSE_MENU_W,
    });
  }
  let items: MenuItem[] = [{
    name: 'Return to game',
    cb: function () {
      pause_menu_up = false;
    },
  }, {
    name: 'SFX Vol',
    slider: true,
    value_inc: 0.05,
    value_min: 0,
    value_max: 1,
  }, {
    name: 'Mus Vol',
    slider: true,
    value_inc: 0.05,
    value_min: 0,
    value_max: 1,
  }, {
    name: `Turn: ${settings.turn_toggle ? 'A/S/4/6/←/→': 'Q/E/7/9/LB/RB'}`,
    cb: () => {
      settingsSet('turn_toggle', 1 - settings.turn_toggle);
    },
  }, {
    name: `CRT Filter: ${settings.pixely === 2 ? 'ON': 'Off'}`,
    cb: () => {
      settingsSet('pixely', settings.pixely === 2 ? 1 : 2);
    },
  }];
  if (fscreenAvailable()) {
    items.push({
      name: input.inputTouchMode() ? 'Toggle Fullscreen' : 'Toggle Fullscreen (F11)',
      in_event_cb: fscreenActive() ? fscreenExit : fscreenEnter,
    });
  }
  if (!myEntOptional()?.data.cheat) {
    items.push({
      name: 'Cheat',
      cb: () => {
        pause_menu_up = false;
        modalDialog({
          title: 'Enter Cheat Mode?',
          text: 'Too difficult?  This will add insta-kill and skip turn buttons to the combat screen.\n\n' +
            'This should let you experience all game content, however it will disable high scores.  Really cheat?',
          buttons: {
            yes: () => {
              let { data } = myEnt();
              data.cheat = true;
            },
            no: null,
          },
        });
      },
    });
  } else {
    items.push({
      name: 'Cheat More',
      cb: () => {
        pause_menu_up = false;
        modalDialog({
          title: 'Free XP?',
          text: 'This will give you lots of XP.  Killing enemies and finding secrets is ' +
            'enough to max out your heroes, but why not.\n\nReally cheat?',
          buttons: {
            yes: () => {
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              giveXP('cheat');
            },
            no: null,
          },
        });
      },
    });
  }
  let save_allow = allow_manual_save;
  if (isLocal() && save_allow) {
    items.push({
      name: in_combat ? 'Save game (disabled in combat)' : 'Save game',
      disabled: in_combat,
      cb: function () {
        crawlerSaveGame('manual');
        statusPush('Game saved.');
        autosave_pos = myEnt().data.pos.slice(0) as JSVec3;
        pause_menu_up = false;
      },
    });
  }
  if (!isOnline() && save_allow) {
    items.push({
      name: in_combat ? 'Save (disabled in combat) and Exit' : 'Save and Exit',
      disabled: in_combat,
      cb: function () {
        crawlerSaveGame('manual');
        urlhash.go('');
      },
    });
  }
  items.push({
    name: (isOnline() || autoSavedHere()) ? 'Exit to Title' : 'Exit without saving',
    cb: function () {
      crawlerSavePlayTime('manual');
      urlhash.go('');
    },
  });

  let volume_item = items[1];
  volume_item.value = settings.volume_sound;
  volume_item.name = `SFX Vol: ${(settings.volume_sound * 100).toFixed(0)}`;
  volume_item = items[2];
  volume_item.value = settings.volume_music;
  volume_item.name = `Mus Vol: ${(settings.volume_music * 100).toFixed(0)}`;

  pause_menu.run({
    slider_w: 80,
    items,
  });

  settingsSet('volume_sound', pause_menu.getItem(1).value as number);
  settingsSet('volume_music', pause_menu.getItem(2).value as number);

  menuUp();
}

markdownSetColorStyle('subtitle', fontStyle(null, {
  color: 0xdae0eaff,
  glow_color: 0x0ff,
  glow_outer: 7,
}));
const HELP_TEXT = `
[c=xp]COMBAT SYSTEM HELP[/c]

Each turn, you must use [c=3]all[/c] of your rolled dice to activate abilities, if possible.

When used, abilities always also generate [img=aggro][c=1]Aggro[/c].

[img=spacer]

[c=subtitle]Monster attack targeting[/c]

[img=attack_front_enemy]Frontal attacks target the hero with the [c=3]highest[/c]` +
` [img=aggro][c=1]Aggro[/c]. If there are ties, the damage is split, [c=2]rounded down[/c].

[img=attack_all]Area attacks target [c=3]all[/c] heroes.

[img=spacer]

[c=subtitle]Hero Abilities[/c]

Mouse over or long-press an ability to get specifics.

[img=poison]Poison applies damage at the [c=2]start[/c] of the enemy's turn, every round.

[img=shield]Shield [c=2]reduces[/c] incoming damage.  Any shield from abilities lasts only 1 round.

[img=spacer]
If a hero was attacked, their [img=aggro][c=1]Aggro[/c] decays by half at the end of the round.
`;
const style_help = fontStyle(null, {
  color: 0xdae0eaff,
});
function helpMenu(): void {
  let z = Z.HELP_MENU;
  let x0 = 5;
  let y0 = VIEWPORT_Y0;
  let w = VIEWPORT_X0 + render_width- x0;
  let h = game_height - 20 - y0;
  let panel_param = {
    x: x0,
    y: y0,
    z: z - 1,
    w,
    h,
  };

  const pad = 16;
  markdownAuto({
    font_style: style_help,
    line_height: 9,
    x: x0 + pad,
    y: y0 + pad,
    z,
    w: w - pad * 2,
    h: h - pad * 2,
    align: ALIGN.HCENTER | ALIGN.HWRAP,
    text: HELP_TEXT,
  });

  panel(panel_param);

  input.eatAllInput();
}

let temp_color = vec4(1,1,1,1);
function drawBar(
  bar: BarSprite,
  x: number, y: number, z: number,
  w: number, h: number,
  p: number, preal: number,
): void {
  drawBox({
    x, y, z,
    w, h,
  }, bar.bg, 1);
  const MIN_VIS_W = 4;
  let full_w_low = round(p * w);
  if (p > 0 && p < 1) {
    full_w_low = clamp(full_w_low, MIN_VIS_W, w - MIN_VIS_W/2);
  }
  let full_w_high = round(preal * w);
  if (preal > 0 && preal < 1) {
    full_w_high = clamp(full_w_high, MIN_VIS_W, w - MIN_VIS_W/2);
  }
  if (full_w_low > full_w_high) {
    let t = full_w_high;
    full_w_high = full_w_low;
    full_w_low = t;
  }

  if (full_w_high !== full_w_low) {
    temp_color[3] = combatPreviewAlpha();
    drawBox({
      x, y,
      w: full_w_high, h,
      z: z + 0.5,
    }, bar.hp, 1, temp_color);
    let empty_w_high = w - full_w_high;
    if (empty_w_high && full_w_high) {
      let temp_x = x + full_w_high;
      if (full_w_high) {
        temp_x -= 1;
        empty_w_high += 1;
      }
      drawBox({
        x: temp_x, y,
        w: empty_w_high, h,
        z: z + 1,
      }, bar.empty, 1, temp_color);
    }
  }

  let empty_w = w - full_w_low;
  if (full_w_low) {
    drawBox({
      x, y,
      w: full_w_low, h,
      z: z + 1,
    }, bar.hp, 1);
  }
  if (empty_w && full_w_low) {
    let temp_x = x + full_w_low;
    if (full_w_low) {
      temp_x -= 1;
      empty_w += 1;
    }
    drawBox({
      x: temp_x, y,
      w: empty_w, h,
      z: z + 1,
    }, bar.empty, 1);
  }
}

export function drawHealthBar(
  enemy: boolean,
  x: number, y: number, z: number,
  w: number, h: number,
  hp_preview: number, hp_real: number, hp_max: number,
): void {
  drawBar(bar_sprites[enemy ? 'enemy_healthbar' : 'healthbar'], x, y, z, w, h, hp_preview / hp_max, hp_real / hp_max);
  let hp_text = `${hp_preview}`;
  if (hp_preview !== hp_real) {
    hp_text = `${hp_real}→${hp_preview}`;
  }
  if (hp_text) {
    font.drawSizedAligned(style_text, x, y + (settings.pixely > 1 ? 0.5 : 0), z+2,
      8, ALIGN.HVCENTERFIT,
      w, h, hp_text);
  }
}

function engagedEnemy(): Entity | null {
  if (buildModeActive() || engine.defines.PEACE) {
    return null;
  }
  let me = crawlerMyEnt();
  // search, needs game_state, returns list of foes
  let ents: Entity[] = entitiesAt(
    entityManager(),
    me.data.pos, me.data.floor, true);
  ents = ents.filter((ent: Entity) => {
    return ent.is_enemy && ent.isAlive();
  });
  if (ents.length) {
    return ents[0];
  }
  return null;
}

function moveBlocked(): boolean {
  return false;
}

// TODO: move into crawler_play?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addFloater(ent_id: EntityID, message: string | null, anim: string): void {
  let ent = crawlerEntityManager().getEnt(ent_id);
  if (ent) {
    if (message) {
      if (!ent.floaters) {
        ent.floaters = [];
      }
      ent.floaters.push({
        start: engine.frame_timestamp,
        msg: message,
      });
    }
    if (ent.triggerAnimation) {
      ent.triggerAnimation(anim);
    }
  }
}

const color_dead_shade = vec4(0.3, 0, 0, 0.75);
function moveBlockDead(): boolean {
  controller.setFadeOverride(0.75);

  let y = VIEWPORT_Y0;
  let w = render_width;
  let x = VIEWPORT_X0;
  let h = render_height;
  let z = Z.UI + 100;
  let x1 = VIEWPORT_X0 + render_width;
  let y1 = VIEWPORT_Y0 + render_height;

  drawRect(x - 0.1, y - 0.1, x1 + 0.1, y1 + 0.1, z - 2, color_dead_shade);

  ambienceSetHeartbeat(0);

  y += floor(h/2);
  font.drawSizedAligned(null,
    x + floor(w/2), y - 16, z,
    uiTextHeight(), ALIGN.HCENTER|ALIGN.VBOTTOM,
    0, 0, myEnt().data.sanity <= 0 ? 'Insanity has overtaken you.' : 'The party has perished');

  let slot = urlhash.get('slot') || '1';
  let button_w = uiButtonWidth() * 3;
  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Reload from last save',
    disabled: !hasSaveData(slot),
  })) {
    forceNoMusic(false);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    restartFromLastSave();
  }
  y += uiButtonHeight() + 16;

  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Exit to Menu',
  })) {
    forceNoMusic(false);
    urlhash.go('');
  }

  return true;
}

function useNoText(): boolean {
  return input.inputTouchMode() || input.inputPadMode() || settings.turn_toggle;
}

export function isBootstrap(): boolean {
  let me = myEntOptional();
  if (!me) {
    return true;
  }
  if (!me.data.heroes) {
    return true;
  }
  if (me.data.heroes.length === 0) {
    return true;
  }
  return false;
}

export function isSolitude(): boolean {
  let level = crawlerGameState().level;
  if (level && level.getProp('solitude')) {
    return true;
  }
  return false;
}

function isFinalBattle(): boolean {
  let level = crawlerGameState().level;
  if (level && level.getProp('finale')) {
    return true;
  }
  return false;
}

const SANITY_H = 38;
const SANITY_X = game_width - SANITY_W;
const SANITY_Y = game_height - SANITY_H;
const style_sanity = fontStyle(null, {
  color: 0xbc4a9bff,
  glow_color: 0x242234ff,
  glow_outer: 2.5,
});
markdownSetColorStyle('sanity', fontStyle(style_sanity, {
  glow_color: 0,
}));
markdownSetColorStyle('3', fontStyle(null, {
  color: 0x249fdeff,
}));
let sanity_flash_at: number;
let sanity_flash_major: number = 0;
let fake_sanity: [number, number] | null;
export function sanityDamage(perm: number, temp: number, delay: number, major: boolean): void {
  let me = myEnt();
  assert(me);
  let min_value = 0;
  if (isFinalBattle()) {
    min_value = 1;
  }
  fake_sanity = [me.data.sanity, me.data.sanity_max];
  me.data.sanity_max = max(min_value, me.data.sanity_max - perm);
  me.data.sanity = max(min_value, me.data.sanity - temp);
  sanity_flash_at = getFrameTimestamp() + delay;
  sanity_flash_major = major ? 1 : 0;
  if (perm > 0) {
    me.data.score_sanity_loss = (me.data.score_sanity_loss || 0) + 1;
  }
}

function doSanity(): void {
  let me = myEnt();
  if (me.data.sanity === undefined) { // REMOVEME
    me.data.sanity = me.data.sanity_max = 100;
  }
  let { sanity, sanity_max } = me.data;
  if (engine.defines.SANITY) {
    me.data.sanity = sanity = round(100 * clamp(1 - input.mousePos()[1] / game_height, 0, 1));
    me.data.sanity_max = sanity_max = min(100, sanity + 20);
  }

  let flash = 0;
  if (sanity_flash_at) {
    let dt = getFrameTimestamp() - sanity_flash_at;
    if (dt < 0) {
      // delaying until later
      assert(fake_sanity);
      [sanity, sanity_max] = fake_sanity;
    } else if (dt < 500) {
      flash = easeIn(1 - dt / 500, 2);
    } else {
      sanity_flash_major = 0;
    }
  }

  let eff_major = sanity_flash_major;
  if (sanity < 30 && me.isAlive(true)) {
    ambienceSetHeartbeat(0.5 + (30 - sanity) / 30 * 0.5);
    flash = max(flash, ambienceHeartbeatPulse());
    eff_major = max(eff_major, 0.5);
  }

  v4set(temp_color, 1 + flash, 1, 1, 1);
  let z = Z.UI;
  ui_sprites.sanity_bg.draw({
    x: SANITY_X,
    y: SANITY_Y,
    z,
    w: SANITY_W,
    h: SANITY_H,
    color: temp_color,
  });
  z++;
  let scale = 1 + eff_major * flash * 2;
  spritesheet_icons.sprite.draw({
    x: SANITY_X + 10 - (scale - 1) * 16,
    y: SANITY_Y + 5 - (scale - 1) * 16,
    z,
    w: 24 * scale,
    h: 24 * scale,
    frame: FRAME_SANITY24,
    color: temp_color,
  });
  z++;

  font_tiny.draw({
    style: style_sanity,
    x: SANITY_X + 3,
    y: SANITY_Y + SANITY_H - 9,
    z,
    w: SANITY_W - 3,
    align: ALIGN.HCENTER,
    text: `${sanity}/${sanity_max}`,
  });

  let bar_x = game_width - 5;
  let bar_y = SANITY_Y - 198;
  ui_sprites.sanity_bar_bg.draw({
    x: bar_x,
    y: bar_y,
    z,
    w: 5,
    h: 201,
    color: temp_color,
  });
  z++;
  bar_y++;
  bar_x++;

  let bar_h = sanity * 2;
  let draw_param: SpriteDrawParams = {
    x: bar_x - 0.1,
    y: bar_y + 200 - bar_h - 0.1,
    z,
    w: 3.2,
    h: bar_h + 0.2,
    color: temp_color,
  };
  if (bar_h) {
    if (bar_h >= 94) {
      ui_sprites.sanity_bar_full.draw(draw_param);
    } else {
      draw_param.uvs = [0, 0, 1, bar_h / 94];
      ui_sprites.sanity_bar_full.draw(draw_param);
    }
  }

  bar_h = (100 - sanity_max) * 2;
  if (bar_h) {
    draw_param.y = bar_y - 0.1;
    draw_param.h = bar_h + 0.2;
    if (bar_h >= 94) {
      delete draw_param.uvs;
      ui_sprites.sanity_bar_blocked.draw(draw_param);
    } else {
      draw_param.uvs = [0, 1 - bar_h / 94, 1, 1];
      ui_sprites.sanity_bar_blocked.draw(draw_param);
    }
  }
}

const XP_X = 442;
const XP_Y = 201;
const XP_W = 33;
const XP_H = 29;
const XP_TEXT_OFFS = 16;
const XPPAD = 5;
const style_xp = fontStyle(null, {
  color: 0xfffc40ff,
  outline_color: 0x5b3138ff,
  outline_width: 2.5,
});
let xp_time = 0;
let xp_msg = '';
markdownSetColorStyle('xp', style_xp);
function doXP(map_active: boolean): void {
  let me = myEnt();
  let { xp } = me.data;
  if (xp === undefined) {
    // never got any
    return;
  }

  let z = map_active ? Z.MAP + 5 : Z.UI;
  spritesheet_icons.sprite.draw({
    x: XP_X,
    y: XP_Y,
    z,
    w: XP_W,
    h: XP_H,
    frame: FRAME_XPBAR,
  });
  z++;

  font.draw({
    style: style_xp,
    x: XP_X + 3,
    y: XP_Y + XP_TEXT_OFFS,
    z,
    w: XP_W - 3,
    align: ALIGN.HCENTER,
    text: `${xp}`,
  });

  z = Z.XP;

  let now = getFrameTimestamp();
  if (xp_time && now - xp_time < 2000) {
    let t = (now - xp_time) / 2000;
    let a = 1 - (t - 0.75) * 4;
    let text_w = font.getStringWidth(style_xp, uiTextHeight(), xp_msg);
    let x = min(XP_X + XP_W / 2 - text_w/2, game_width - text_w - XPPAD);
    let y = round(XP_Y - t * XP_H);
    font.drawSized(fontStyleAlpha(style_xp, a), x, y, z, uiTextHeight(), xp_msg);
    panel({
      x: x - XPPAD, y: y - XPPAD, z: z - 0.5,
      w: text_w + XPPAD * 2,
      h: uiTextHeight() + XPPAD * 2,
      color: [1,1,1,a],
    });
  }
}
const XP_TABLE = [
  1,
  3,
  4,
  6,
  20,
];
const XP_TABLE_STORY = [
  1,
  2,
  3,
  4,
  42,
];
export function xpCost(tier: number, level: number): number {
  if (level === 2) {
    return Infinity;
  }
  return 2 * (tier * 2 + level + 1);
}
export function giveXP(target: Entity | 'note' | 'terminal' | 'cheat' | null): void {
  let floor_id = crawlerGameState().floor_id;
  let floor_level = clamp(floor_id - 11, 0, XP_TABLE.length - 1);
  let delta = XP_TABLE[floor_level];
  if (target) {
    if (target === 'cheat') {
      delta = 100;
      playUISound('xp_gain');
    } else if (target === 'note' || target === 'terminal') {
      delta = XP_TABLE_STORY[floor_level];
      playUISound('xp_gain');
    } else {
      let is_boss = target?.data?.stats?.encounter.includes('boss');
      if (is_boss) {
        delta *= 2;
      }
    }
  }
  xp_time = getFrameTimestamp();
  xp_msg = `+${delta} xp`;
  let data = myEnt().data;
  data.xp = (data.xp || 0) + delta;
  data.score_xp_gain = (data.score_xp_gain || 0) + 1;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  setScore();
}
export function levelUpAbility(hero_idx: number, ability_idx: number): void {
  let data = myEnt().data;
  let hero = data.heroes[hero_idx];
  let cost = xpCost(hero.tier, hero.levels[ability_idx]);
  assert(data.xp && data.xp >= cost);
  data.xp -= cost;
  hero.levels[ability_idx]++;
}

export type Score = {
  victory: number;
  max_floor: number;
  xp: number;
  sanity: number;
  seconds: number;
};
let score_system: ScoreSystem<Score>;
export function getScoreSystem(): ScoreSystem<Score> {
  return score_system;
}

const ENCODE_SEC = 100000;
const ENCODE_XP = 1000;
const ENCODE_SANITY = 1000;
const ENCODE_FLOOR = 10;
function encodeScore(score: Score): number {
  let spart = max(0, ENCODE_SEC - 1 - score.seconds);
  let sanpart = max(0, ENCODE_SANITY - 1 - score.sanity) * ENCODE_SEC;
  let xpart = min(ENCODE_XP - 1, score.xp) * ENCODE_SEC * ENCODE_SANITY;
  let fpart = min(ENCODE_FLOOR - 1, score.max_floor) * ENCODE_XP * ENCODE_SEC * ENCODE_SANITY;
  let vpart = score.victory * ENCODE_FLOOR * ENCODE_XP * ENCODE_SEC * ENCODE_SANITY;
  return vpart + fpart + xpart + sanpart + spart;
}

function parseScore(value: number): Score {
  let seconds = value % ENCODE_SEC;
  value = (value - seconds) / ENCODE_SEC;
  seconds = ENCODE_SEC - 1 - seconds;
  let sanity = value % ENCODE_SANITY;
  value = (value - sanity) / ENCODE_SANITY;
  sanity = ENCODE_SANITY - 1 - sanity;
  let xp = value % ENCODE_XP;
  value = (value - xp) / ENCODE_XP;
  let max_floor = value % ENCODE_FLOOR;
  value = (value - max_floor) / ENCODE_FLOOR;
  let victory = value;
  return {
    victory,
    max_floor,
    xp,
    sanity,
    seconds,
  };
}


export function setScore(): void {
  let { data } = myEnt();
  if (data.cheat) {
    return;
  }
  let score: Score = {
    seconds: round(crawlerCurSavePlayTime() / 1000),
    max_floor: data.score_max_floor || 0,
    xp: data.score_xp_gain || 0,
    sanity: data.score_sanity_loss || 0,
    victory: data.score_won ? 1 : 0,
  };
  score_system.setScore(0, score);
}

let movement_disabled_last_frame = false;

function playCrawl(): void {
  profilerStartFunc();

  if (!controller.canRun()) {
    return profilerStopFunc();
  }

  if (!controller.hasMoveBlocker() && !myEnt().isAlive()) {
    crawlerSavePlayTime('auto');
    forceNoMusic(true);
    playUISound('game_over');
    controller.setMoveBlocker(moveBlockDead);
  }

  let down = {
    menu: 0,
    help: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge = {
    menu: 0,
    help: 0,
  } as Record<ValidKeys, number>;

  let dt = getScaledFrameDt();

  const frame_map_view = mapViewActive();
  const is_fullscreen_ui = false; // any game-mode fullscreen UIs up?
  let dialog_viewport = {
    x: VIEWPORT_X0 + 8,
    w: render_width - 16,
    y: VIEWPORT_Y0,
    h: render_height + 1,
    z: Z.STATUS,
    pad_top: 5,
    pad_bottom: 5,
  };
  if (is_fullscreen_ui || frame_map_view) {
    dialog_viewport.x = 0;
    dialog_viewport.w = game_width;
    dialog_viewport.y = 0;
    dialog_viewport.h = game_height - 3;
  }
  let engaged_enemy = engagedEnemy();
  dialogRun(dt, dialog_viewport, Boolean(engaged_enemy || frame_map_view));

  const build_mode = buildModeActive();
  let locked_dialog = dialogMoveLocked();
  const need_bamf = !build_mode && !locked_dialog && bamfTick();
  const frame_combat = !need_bamf && engagedEnemy();
  if (!frame_combat) {
    help_menu_up = false;
  }
  const overlay_menu_up = pause_menu_up || help_menu_up;
  let minimap_display_h = build_mode ? BUTTON_W : MINIMAP_H;
  let show_compass = false; // !build_mode;
  let compass_h = show_compass ? 11 : 0;

  if (build_mode && !controller.ignoreGameplay()) {
    crawlerBuildModeUI({
      x: 2,
      y: 2,
      w: VIEWPORT_X0 - 4,
      h: game_height - 4,
      map_view: frame_map_view,
    });
  }


  let button_x0: number;
  let button_y0: number;

  let disabled = controller.hasMoveBlocker();

  function button(
    rx: number, ry: number,
    frame: number,
    key: ValidKeys,
    keys: number[],
    pads: number[],
    toggled_down?: boolean
  ): void {
    let z;
    let no_visible_ui = frame_map_view;
    let my_disabled = disabled;
    if (key === 'menu') {
      no_visible_ui = false;
      if (frame_map_view) {
        z = Z.MAP + 1;
      } else if (pause_menu_up) {
        z = Z.MODAL + 1;
      } else {
        z = Z.MENUBUTTON;
      }
    } else if (key === 'help') {
      no_visible_ui = false;
    } else {
      if (overlay_menu_up && toggled_down) {
        no_visible_ui = true;
      } else {
        my_disabled = my_disabled || overlay_menu_up;
      }
    }
    if (help_menu_up && !no_visible_ui) {
      z = Z.HELP_MENU + 1;
    }
    let ret = crawlerOnScreenButton({
      x: button_x0 + (BUTTON_W + 2) * rx,
      y: button_y0 + (BUTTON_W + 2) * ry,
      z,
      w: BUTTON_W, h: BUTTON_W,
      frame,
      keys,
      pads,
      no_visible_ui,
      do_up_edge: true,
      disabled: my_disabled,
      button_sprites: useNoText() ?
        toggled_down ? button_sprites_notext_down : button_sprites_notext :
        toggled_down ? button_sprites_down : button_sprites,
    });
    // down_edge[key] += ret.down_edge;
    down[key] += ret.down;
    up_edge[key] += ret.up_edge;
  }


  // Escape / open/close menu button - *before* pauseMenu()
  button_x0 = MENU_BUTTON_X;
  button_y0 = MENU_BUTTON_Y;
  let menu_up = frame_map_view || build_mode || overlay_menu_up;
  let menu_keys = [KEYS.ESC];
  let menu_pads = [PAD.START];
  if (menu_up) {
    menu_pads.push(PAD.B, PAD.BACK);
  }
  if (!isBootstrap() && !need_bamf) {
    button(0, 0, menu_up ? 10 : 6, 'menu', menu_keys, menu_pads);
    if (frame_combat) {
      button_x0 -= BUTTON_W + 2;
      button(0, 0, 8, 'help', [KEYS.F1], [PAD.Y]);
    }
  }
  // if (!build_mode) {
  //   button(0, 1, 7, 'inv', [KEYS.I], [PAD.Y], inventory_up);
  //   if (up_edge.inv) {
  //     inventory_up = !inventory_up;
  //   }
  // }

  if (pause_menu_up) {
    pauseMenu(Boolean(frame_combat));
  }
  if (help_menu_up) {
    helpMenu();
  }

  // if (frame_combat && frame_combat !== crawlerEntInFront()) {
  //   // turn to face
  //   let me = crawlerMyEnt();
  //   let dir = dirFromDelta(v2sub(temp_delta, frame_combat.data.pos, me.data.pos));
  //   controller.forceFaceDir(dir);
  // } else {
  //   controller.forceFaceDir(null);
  // }

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  // Check for intentional events
  // if (!build_mode) {
  //   button(2, -3, 7, 'inventory', [KEYS.I], [PAD.X], inventory_up);
  // }
  //
  // if (up_edge.inventory) {
  //   inventory_up = !inventory_up;
  // }

  if (!build_mode && !isBootstrap()) {
    doSanity();
    doXP(frame_map_view);
  }

  if (frame_combat) {
    if (controller.queueLength() === 1) {
      heroesDraw(true);
      let existing_fade = (frame_combat.fade === null) ? 1 : frame_combat.fade;
      frame_combat.fade = max(0, existing_fade - getFrameDt() * 0.003);
      doCombat(frame_combat, dt);
    } else {
      heroesDraw(false);
    }
  } else {
    if (!build_mode) {
      heroesDraw(false);
    }
    cleanupCombat(dt);
  }

  if (!buildModeActive() && settings.pixely) {
    ui_sprites.filler.draw({
      x: 0, y: 0, z: 0.1,
      w: game_width,
      h: game_height,
    });
  }

  let disable_player_impulse = Boolean(frame_combat || locked_dialog || need_bamf ||
    frame_map_view && !build_mode);
  movement_disabled_last_frame = disable_player_impulse;
  controller.doPlayerMotion({
    dt,
    button_x0: MOVE_BUTTONS_X0,
    button_y0: build_mode ? game_height - 16 : MOVE_BUTTONS_Y0,
    no_visible_ui: frame_map_view,
    button_w: build_mode ? 6 : BUTTON_W,
    button_sprites: useNoText() ? button_sprites_notext : button_sprites,
    disable_move: moveBlocked() || overlay_menu_up,
    disable_player_impulse,
    show_buttons: !disable_player_impulse,
    do_debug_move: engine.defines.LEVEL_GEN || build_mode,
    show_debug: settings.show_fps ? { x: VIEWPORT_X0, y: VIEWPORT_Y0 + (build_mode ? 3 : 0) } : null,
  });

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  if (engine.DEBUG && keyUpEdge(KEYS.B)) {
    crawlerBuildModeActivate(!build_mode);
    if (crawlerCommWant()) {
      return profilerStopFunc();
    }
    // inventory_up = false;
  }

  if (up_edge.menu) {
    if (help_menu_up) {
      help_menu_up = false;
    } else if (menu_up) {
      if (build_mode && mapViewActive()) {
        mapViewSetActive(false);
        // but stay in build mode
      } else if (build_mode) {
        crawlerBuildModeActivate(false);
      } else {
        // close everything
        mapViewSetActive(false);
        // inventory_up = false;
      }
      pause_menu_up = false;
    } else {
      pause_menu_up = true;
    }
  }
  if (up_edge.help) {
    help_menu_up = !help_menu_up;
  }

  if (!frame_map_view) {
    if (!build_mode) {
      // Do game UI/stats here
    }
    // Do modal UIs here
  } else {
    if (input.click({ button: 2 })) {
      mapViewToggle();
    }
  }
  if (engine.DEBUG && keyDownEdge(KEYS.I)) {
    sanityDamage(1, 10, 0, true);
  }
  if (engine.DEBUG && keyDownEdge(KEYS.X)) {
    giveXP(null);
  }
  if (engine.DEBUG && keyDownEdge(KEYS.O)) {
    for (let ii = 1; ii < 6; ++ii) {
      myEnt().data.heroes[ii].dead = true;
    }
    bamfReset();
  }
  if (!overlay_menu_up && !frame_combat && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK) ||
    padButtonUpEdge(PAD.Y))
  ) {
    playUISound('button_click');
    mapViewToggle();
  }
  // inventoryMenu();
  let game_state = crawlerGameState();
  let script_api = crawlerScriptAPI();
  if (frame_map_view) {
    if (engine.defines.LEVEL_GEN) {
      if (levelGenTest(game_state)) {
        controller.initPosFromLevelDebug();
      }
    }
    let map_full_x = VIEWPORT_X0 - 2;
    crawlerMapViewDraw(game_state, map_full_x, 0, game_width - map_full_x, game_height, 0, Z.MAP,
      engine.defines.LEVEL_GEN, script_api, overlay_menu_up,
      floor((game_width - MINIMAP_W)/2), 2); // note: compass ignored, compass_h = 0 above
    // crawlerMapViewDraw(game_state, 0, 0, game_width, game_height, 0, Z.MAP,
    //   engine.defines.LEVEL_GEN, script_api, overlay_menu_up,
    //   floor((game_width - MINIMAP_W)/2), 2); // note: compass ignored, compass_h = 0 above
  } else if (!frame_combat && !need_bamf) {
    crawlerMapViewDraw(game_state, MINIMAP_X, MINIMAP_Y, MINIMAP_W, minimap_display_h, compass_h, Z.MAP,
      false, script_api, overlay_menu_up || !myEntOptional()?.isAlive(),
      COMPASS_X, COMPASS_Y);

    panel({
      x: MINIMAP_X - 3,
      y: MINIMAP_Y - 3,
      w: MINIMAP_W + 6,
      h: minimap_display_h + 6,
      z: Z.MAP - 1,
    });
  }

  statusTick(dialog_viewport);

  ambienceTick(frame_combat ? 'combat' : 'play');

  profilerStopFunc();
}

export function play(dt: number): void {
  let game_state = crawlerGameState();
  if (crawlerCommWant()) {
    // Must have been disconnected?
    crawlerCommStart();
    return;
  }

  let overlay_menu_up = pause_menu_up || help_menu_up || dialogMoveLocked(); // || inventory_up

  crawlerPlayTopOfFrame(overlay_menu_up || movement_disabled_last_frame || controller.move_blocker === moveBlockDead);
  movement_disabled_last_frame = false;

  if (keyDownEdge(KEYS.F3)) {
    settingsSet('show_fps', 1 - settings.show_fps);
  }
  if (keyDownEdge(KEYS.F)) {
    settingsSet('filter', 1 - settings.filter);
    renderResetFilter();
  }

  playCrawl();

  crawlerPrepAndRenderFrame();

  if (!loading_level && !buildModeActive()) {
    let script_api = crawlerScriptAPI();
    script_api.is_visited = true; // Always visited for AI
    aiDoFloor(game_state.floor_id, game_state, entityManager(), engine.defines,
      settings.ai_pause || engine.defines.LEVEL_GEN || overlay_menu_up || movement_disabled_last_frame, script_api);
  }

  crawlerPlayBottomOfFrame();
}

function onPlayerMove(old_pos: Vec2, new_pos: Vec2): void {
  // let game_state = crawlerGameState();
  // aiOnPlayerMoved(game_state, myEnt(), old_pos, new_pos,
  //   settings.ai_pause || engine.defines.LEVEL_GEN, script_api);
}

function onInitPos(): void {
  // autoAttackCancel();
}

function playInitShared(online: boolean): void {
  controller = crawlerController();

  controller.setOnPlayerMove(onPlayerMove);
  controller.setOnInitPos(onInitPos);

  pause_menu_up = false;
  help_menu_up = false;
  // inventory_up = false;
  movement_disabled_last_frame = false;
  autosave_pos = null;
}

function initLevel(): void {
  bamfReset();
  jamTraitsReset();
}

function playOfflineLoading(): void {
  // TODO
}

function playInitOffline(): void {
  playInitShared(false);
}

function playInitEarly(room: ClientChannelWorker): void {

  // let room_public_data = room.getChannelData('public') as { seed: string };
  // game_state.setSeed(room_public_data.seed);

  playInitShared(true);
}

export function autosave(): void {
  let floor_id = myEnt().data.floor;
  let max_floor = 0;
  if (floor_id >= 10 && floor_id <= 16) {
    max_floor = floor_id - 10;
    if (max_floor > (myEnt().data.score_max_floor || 0)) {
      myEnt().data.score_max_floor = max_floor;
    }
  }
  crawlerSaveGame('auto');
  statusPush('Game saved.').counter = 2000;
  autosave_pos = myEnt().data.pos.slice(0) as JSVec3;
  setScore();
}

export function restartFromLastSave(): void {
  crawlerPlayWantMode('recent');
  crawlerPlayInitOffline();
}

settingsRegister({
  ai_pause: {
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
  turn_toggle: {
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
});

export function dialogTextStyle(dialog?: DialogParam): FontStyle {
  return dialog?.font_style || style_dialog;
}

export function playStartup(font_tiny_in: Font): void {
  font_tiny = font_tiny_in;
  font = uiGetFont();
  crawlerScriptAPIDummyServer(true); // No script API running on server
  let heroes: Hero[] = [];
  // while (heroes.length < 6) {
  //   heroes.push(randomHero(heroes.length, heroes.length === 0 ? 1 : 0, heroes, true));
  // }
  crawlerPlayStartup({
    // on_broadcast: onBroadcast,
    play_init_online: playInitEarly,
    play_init_offline: playInitOffline,
    offline_data: {
      new_player_data: {
        type: 'player',
        pos: [0, 0, 0], // set in level10.json
        floor: 10,
        stats: {
          hp: 1,
        },
        sanity: 100,
        sanity_max: 100,
        heroes,
      },
      loading_state: playOfflineLoading,
    },
    play_state: play,
    on_init_level_offline: initLevel,
    default_vstyle: 'demo',
    allow_offline_console: engine.DEBUG,
    chat_ui_param: {
      x: 3,
      y_bottom: game_height,
      border: 2,
      scroll_grow: 2,
      cuddly_scroll: true,
    },
  });
  renderAppStartup();
  crawlerEntityClientStartupEarly();
  aiTraitsClientStartup();
  jamTraitsStartup();
  crawlerEntityTraitsClientStartup({
    name: 'EntityDemoClient',
    Ctor: EntityDemoClient,
  });
  crawlerRenderEntitiesStartup(font);
  crawlerRenderViewportSet({
    x: VIEWPORT_X0,
    y: VIEWPORT_Y0,
    w: render_width,
    h: render_height,
  });
  crawlerRenderSetUIClearColor(color_myblack);

  let button_param = {
    filter_min: gl.NEAREST,
    filter_mag: gl.NEAREST,
    ws: [BUTTON_W, BUTTON_W, BUTTON_W],
    hs: [BUTTON_W, BUTTON_W, BUTTON_W, BUTTON_W],
  };
  button_sprites = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_disabled',
      ...button_param,
    }),
  };
  button_sprites_down = {
    regular: button_sprites.down,
    down: button_sprites.regular,
    rollover: button_sprites.rollover,
    disabled: button_sprites.disabled,
  };
  button_sprites_notext = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons_notext',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_notext_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_notext_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_notext_disabled',
      ...button_param,
    }),
  };
  button_sprites_notext_down = {
    regular: button_sprites_notext.down,
    down: button_sprites_notext.regular,
    rollover: button_sprites_notext.rollover,
    disabled: button_sprites_notext.disabled,
  };

  let bar_param = {
    filter_min: gl.NEAREST,
    filter_mag: gl.NEAREST,
    ws: [2, 4, 2],
    hs: [2, 4, 2],
  };
  let healthbar_bg = spriteCreate({
    name: 'crawler_healthbar_bg',
    ...bar_param,
  });
  bar_sprites = {
    healthbar: {
      bg: healthbar_bg,
      hp: spriteCreate({
        name: 'crawler_healthbar_hp',
        ...bar_param,
        ws: [5, 3, 2],
      }),
      empty: spriteCreate({
        name: 'crawler_healthbar_empty',
        ...bar_param,
      }),
    },
    enemy_healthbar: {
      bg: spriteCreate({
        name: 'enemy_healthbar_bg',
        ...bar_param,
        ws: [2,2,2],
        hs: [2,7,2],
      }),
      hp: spriteCreate({
        name: 'enemy_healthbar_hp',
        ...bar_param,
        ws: [2,3,2],
        hs: [2,7,2],
      }),
      empty: spriteCreate({
        name: 'enemy_healthbar_empty',
        ...bar_param,
        ws: [2,1,2],
        hs: [2,7,2],
      }),
    },
  };

  const level_def = {
    name: 'the',
  };
  score_system = scoreAlloc({
    score_to_value: encodeScore,
    value_to_score: parseScore,
    level_defs: [level_def],
    score_key: 'DCJ24',
    ls_key: 'dcj24',
    asc: false,
    rel: 16,
    num_names: 3,
    histogram: false,
  });

  dialogStartup({
    font,
    text_style_cb: dialogTextStyle,
  });
  crawlerLoadData(webFSAPI());
  crawlerMapViewStartup({
    allow_pathfind: true,
    // color_rollover: dawnbringer.colors[8],
    build_mode_entity_icons: {},
    // style_map_name: fontStyle(...)
    compass_border_w: 6,
  });
}
