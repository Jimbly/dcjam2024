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
} from 'glov/client/font';
import * as input from 'glov/client/input';
import {
  KEYS,
  PAD,
  keyDownEdge,
  keyUpEdge,
  padButtonUpEdge,
} from 'glov/client/input';
import { ClientChannelWorker } from 'glov/client/net';
import { MenuItem } from 'glov/client/selection_box';
import * as settings from 'glov/client/settings';
import { SimpleMenu, simpleMenuCreate } from 'glov/client/simple_menu';
import {
  Sprite,
  SpriteDrawParams,
  spriteCreate,
} from 'glov/client/sprites';
import {
  ButtonStateString,
  buttonText,
  drawBox,
  menuUp,
  playUISound,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
  sprites as ui_sprites,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
} from 'glov/common/types';
import { clamp, easeIn } from 'glov/common/util';
import {
  Vec2,
  v2same,
  v4set,
  vec4,
} from 'glov/common/vmath';
import {
  JSVec3,
  crawlerLoadData,
} from '../common/crawler_state';
import {
  aiDoFloor,
  aiTraitsClientStartup,
} from './ai';
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
  DialogParam,
  dialogMoveLocked,
  dialogRun,
  dialogStartup,
} from './dialog_system';
import {
  EntityDemoClient,
  Hero,
  entitiesAt,
  entityManager,
} from './entity_demo_client';
// import { EntityDemoClient } from './entity_demo_client';
import {
  SANITY_W,
  VIEWPORT_X0,
  VIEWPORT_Y0,
  game_height,
  game_width,
  render_height,
  render_width,
} from './globals';
import { heroesDraw } from './hero_draw';
import { randomHero } from './heroes';
import { jamTraitsReset, jamTraitsStartup } from './jam_events';
import { levelGenTest } from './level_gen_test';
import { renderAppStartup, renderResetFilter } from './render_app';
import {
  statusPush,
  statusTick,
} from './status';
import { hasSaveData } from './title';

const spritesheet_icons = require('./img/icons');
const { FRAME_SANITY24 } = spritesheet_icons;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { abs, floor, max, min, round, sin } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let volume_sound: number;
  export let volume_music: number;
  export let turn_toggle: 0 | 1;
}

declare module 'glov/client/ui' {
  interface UISprites {
    sanity_bar_blocked: Sprite;
    sanity_bar_full: Sprite;
    sanity_bar_bg: Sprite;
    sanity_bg: Sprite;
  }
}

// const ATTACK_WINDUP_TIME = 1000;
const BOTTOM_UI_Y = 200;
const MINIMAP_RADIUS = 3;
const MINIMAP_X = VIEWPORT_X0 + 2;
const MINIMAP_Y = BOTTOM_UI_Y;
const MINIMAP_W = 5+7*(MINIMAP_RADIUS*2 + 1);
const COMPASS_X = MINIMAP_X;
const COMPASS_Y = MINIMAP_Y + MINIMAP_W;

const MOVE_BUTTONS_X0 = 290;
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

const allow_manual_save = false;
let pause_menu: SimpleMenu;
function pauseMenu(): void {
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
      settings.set('turn_toggle', 1 - settings.turn_toggle);
    },
  }];
  // TODO: add "load from last autosave / restart in Room of Solitude" option
  if (isLocal() && allow_manual_save) {
    items.push({
      name: 'Save game',
      cb: function () {
        crawlerSaveGame('manual');
        statusPush('Game saved.');
        pause_menu_up = false;
      },
    });
  }
  if (!isOnline() && allow_manual_save) {
    items.push({
      name: 'Save and Exit',
      cb: function () {
        crawlerSaveGame('manual');
        urlhash.go('');
      },
    });
  }
  items.push({
    name: (isOnline() || autoSavedHere()) ? 'Exit to Title' : 'Exit without saving',
    cb: function () {
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

  settings.set('volume_sound', pause_menu.getItem(1).value);
  settings.set('volume_music', pause_menu.getItem(2).value);

  menuUp();
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

function moveBlockDead(): boolean {
  controller.setFadeOverride(0.75);

  let y = VIEWPORT_Y0;
  let w = render_width;
  let x = VIEWPORT_X0;
  let h = render_height;
  let z = Z.UI + 100;

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
    text: 'Reload from last Solitude',
    disabled: !hasSaveData(slot),
  })) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    restartFromLastSave();
  }
  y += uiButtonHeight() + 16;

  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Exit to Menu',
  })) {
    urlhash.go('');
  }

  return true;
}

function useNoText(): boolean {
  return input.inputTouchMode() || input.inputPadMode() || settings.turn_toggle;
}

const SANITY_H = 38;
const SANITY_X = game_width - SANITY_W;
const SANITY_Y = game_height - SANITY_H;
const style_sanity = fontStyle(null, {
  color: 0xbc4a9bff,
  glow_color: 0x242234ff,
  glow_outer: 2.5,
});
let sanity_flash_at: number;
let sanity_flash_major: boolean;
let fake_sanity: [number, number] | null;
export function sanityDamage(perm: number, temp: number, delay: number, major: boolean): void {
  let me = myEnt();
  assert(me);
  fake_sanity = [me.data.sanity, me.data.sanity_max];
  me.data.sanity_max = max(0, me.data.sanity_max - perm);
  me.data.sanity = max(0, me.data.sanity - temp);
  sanity_flash_at = getFrameTimestamp() + delay;
  sanity_flash_major = major;
}

function doSanity(): void {
  let me = myEnt();
  if (!me) {
    return;
  }
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
    }
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
  let scale = sanity_flash_major ? (1 + flash * 2) : 1;
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
    h: 200,
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

let movement_disabled_last_frame = false;

function playCrawl(): void {
  profilerStartFunc();

  if (!controller.canRun()) {
    return profilerStopFunc();
  }

  if (!controller.hasMoveBlocker() && !myEnt().isAlive()) {
    crawlerSavePlayTime('auto');
    controller.setMoveBlocker(moveBlockDead);
  }

  let down = {
    menu: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge = {
    menu: 0,
  } as Record<ValidKeys, number>;

  let dt = getScaledFrameDt();

  const frame_map_view = mapViewActive();
  const is_fullscreen_ui = false; // any game-mode fullscreen UIs up?
  let dialog_viewport = {
    x: VIEWPORT_X0 + 8,
    w: render_width - 16,
    y: VIEWPORT_Y0,
    h: render_height + 4,
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
  dialogRun(dt, dialog_viewport);

  const build_mode = buildModeActive();
  const need_bamf = !build_mode && bamfTick();
  const frame_combat = !need_bamf && engagedEnemy();
  let locked_dialog = dialogMoveLocked();
  const overlay_menu_up = pause_menu_up; // || inventory_up
  let minimap_display_h = build_mode ? BUTTON_W : MINIMAP_W;
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
    } else {
      if (overlay_menu_up && toggled_down) {
        no_visible_ui = true;
      } else {
        my_disabled = my_disabled || overlay_menu_up;
      }
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
  button(0, 0, menu_up ? 10 : 6, 'menu', menu_keys, menu_pads);
  // if (!build_mode) {
  //   button(0, 1, 7, 'inv', [KEYS.I], [PAD.Y], inventory_up);
  //   if (up_edge.inv) {
  //     inventory_up = !inventory_up;
  //   }
  // }

  if (pause_menu_up) {
    pauseMenu();
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

  if (!build_mode) {
    doSanity();
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


  let disable_player_impulse = Boolean(frame_combat || locked_dialog || need_bamf);
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

  if (keyUpEdge(KEYS.B)) {
    crawlerBuildModeActivate(!build_mode);
    if (crawlerCommWant()) {
      return profilerStopFunc();
    }
    // inventory_up = false;
  }

  if (up_edge.menu) {
    if (menu_up) {
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
  if (!overlay_menu_up && !frame_combat && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK))) {
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
    crawlerMapViewDraw(game_state, 0, 0, game_width, game_height, 0, Z.MAP,
      engine.defines.LEVEL_GEN, script_api, overlay_menu_up,
      floor((game_width - MINIMAP_W)/2), 2); // note: compass ignored, compass_h = 0 above
  } else if (!frame_combat && !need_bamf) {
    crawlerMapViewDraw(game_state, MINIMAP_X, MINIMAP_Y, MINIMAP_W, minimap_display_h, compass_h, Z.MAP,
      false, script_api, overlay_menu_up || !myEntOptional()?.isAlive(),
      COMPASS_X, COMPASS_Y);
  }

  statusTick(dialog_viewport);

  profilerStopFunc();
}

export function play(dt: number): void {
  let game_state = crawlerGameState();
  if (crawlerCommWant()) {
    // Must have been disconnected?
    crawlerCommStart();
    return;
  }

  let overlay_menu_up = pause_menu_up || dialogMoveLocked(); // || inventory_up

  crawlerPlayTopOfFrame(overlay_menu_up || movement_disabled_last_frame);
  movement_disabled_last_frame = false;

  if (keyDownEdge(KEYS.F3)) {
    settings.set('show_fps', 1 - settings.show_fps);
  }
  if (keyDownEdge(KEYS.F)) {
    settings.set('filter', 1 - settings.filter);
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
  crawlerSaveGame('auto');
  statusPush('Auto-saved.');
  autosave_pos = myEnt().data.pos.slice(0) as JSVec3;
}

export function restartFromLastSave(): void {
  crawlerPlayWantMode('recent');
  crawlerPlayInitOffline();
}

settings.register({
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
  return style_dialog;
}

export function playStartup(font_tiny_in: Font): void {
  font_tiny = font_tiny_in;
  font = uiGetFont();
  crawlerScriptAPIDummyServer(true); // No script API running on server
  let heroes: Hero[] = [];
  while (heroes.length < 6) {
    heroes.push(randomHero(heroes.length, heroes.length === 0 ? 1 : 0, heroes, true));
  }
  crawlerPlayStartup({
    // on_broadcast: onBroadcast,
    play_init_online: playInitEarly,
    play_init_offline: playInitOffline,
    offline_data: {
      new_player_data: {
        type: 'player',
        pos: [0, 0, 0],
        floor: 0,
        stats: {
          hp: 1, // set to 0 to trigger end of game
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
