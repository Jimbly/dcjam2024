/*eslint global-require:off, comma-spacing:error*/
import * as local_storage from 'glov/client/local_storage.js'; // eslint-disable-line import/order
local_storage.setStoragePrefix('dcj24'); // Before requiring anything else that might load from this

import assert from 'assert';
import { chatUICreate } from 'glov/client/chat_ui';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import { Font, fontCreate } from 'glov/client/font';
import { markdownImageRegisterSpriteSheet, markdown_default_renderables } from 'glov/client/markdown_renderables';
import { netInit } from 'glov/client/net';
import * as settings from 'glov/client/settings';
import { shadersSetInternalDefines } from 'glov/client/shaders';
import { spriteSetGet } from 'glov/client/sprite_sets';
import { spritesheetTextureOpts } from 'glov/client/spritesheet';
import { textureDefaultFilters } from 'glov/client/textures';
import { uiSetPanelColor } from 'glov/client/ui';
import * as ui from 'glov/client/ui';
import { combatStartup } from './combat';
// import './client_cmds.js'; // for side effects
import { crawlerBuildModeStartup } from './crawler_build_mode';
// import { crawlerOnPixelyChange } from './crawler_play.js';
import { crawlerRenderSetLODBiasRange } from './crawler_render';
import { game_height, game_width } from './globals';
import { heroesDrawStartup } from './hero_draw';
import { playStartup } from './play';
import { titleInit, titleStartup } from './title';

const crawlertest = require('./img/crawlertest');

const { round } = Math;

Z.BACKGROUND = 1;
Z.SPRITES = 10;
Z.PARTICLES = 20;
Z.CHAT = 60;
Z.UI = 100;
Z.MAP = Z.UI + 5; // also minimap
Z.COMBAT_SHADE = Z.UI - 1;
Z.COMBAT = 120;
Z.FLOATERS = 125;
Z.STATUS = 140;
Z.CHAT_FOCUSED = 100;

let fonts: Font[] | undefined;

// crawlerOnPixelyChange(function (new_value: number): void {
//   assert(fonts);
//   engine.setFonts(fonts[new_value] || fonts[2]);
// });

export let chat_ui: ReturnType<typeof chatUICreate>;

export function main(): void {
  if (engine.DEBUG || true) {
    netInit({
      engine,
      cmd_parse,
      auto_create_user: true,
      allow_anon: true,
    });
  }

  // Default style
  let antialias = false;
  let use_fbos = 1;
  let need_dfdxy = false;
  let override_pixely = false;
  if ('AA hires') { // !!!!1
    need_dfdxy = true;
    antialias = true; // antialiases 3D geometry edges only
    use_fbos = 0;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settings.set('pixely', 0);
    override_pixely = true;
    settings.set('filter', 0);
    settings.set('entity_split', 0);
    settings.set('entity_nosplit_use_near', 1);
  } else if (!'simple lowres') { // !!!!2
    settings.set('pixely', 1);
    settings.set('filter', 0);
    settings.set('entity_split', 0);
    settings.set('entity_nosplit_use_near', 1);
  } else if (!'lowres with mipmapping') {
    // also antilias=true & use_fbos=0 is potentially useful
    crawlerRenderSetLODBiasRange(-3, -1.5);
    settings.set('pixely', 1);
    settings.set('filter', 2);
    settings.set('entity_split', 0);
    settings.set('entity_nosplit_use_near', 1);
  } else if (!'simple AA lowres') { // !!!!3
    need_dfdxy = true;
    antialias = true;
    use_fbos = 0;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settings.set('pixely', 1);
    settings.set('filter', 0);
    settings.set('entity_split', 0);
    settings.set('entity_nosplit_use_near', 1);
  } else if (!'CRT filter') { // !!!!4
    settings.set('pixely', 3);
    settings.set('hybrid', 1);
    settings.set('filter', 0);
    settings.set('entity_split', 0);
    settings.set('entity_nosplit_use_near', 1);
  } else if ('split logic') { // !!!!5
    settings.set('pixely', 1);
    settings.set('filter', 0);
    settings.set('entity_split', 1);
  } else if (!'split logic filter') {
    settings.set('pixely', 1);
    settings.set('filter', 1);
    settings.set('entity_split', 1);
  }
  const font_info_palanquin32 = require('./img/font/palanquin32.json');
  const font_info_04b03 = require('./img/font/04b03_8x1.json');
  let pixely = settings.pixely === 2 ? 'strict' : settings.pixely ? 'on' : override_pixely ? 'on' : false;
  let font_info = require('./img/font/ibm8x8x1.json');
  let font = {
    info: font_info,
    texture: 'font/ibm8x8x1',
  };
  settings.set('use_fbos', use_fbos); // Needed for our effects

  spritesheetTextureOpts('whitebox', { force_mipmaps: true });
  // spritesheetTextureOpts('icons', {
  //   filter_min: 9728,
  //   filter_mag: 9728,
  // });

  if (!engine.startup({
    game_width,
    game_height,
    pixely,
    font,
    viewport_postprocess: true,
    antialias,
    znear: 11,
    zfar: 2000,
    do_borders: false,
    show_fps: false,
    ui_sprites: {
      ...spriteSetGet('pixely'),
      color_set_shades: [1, 1, 1],
      // button: { name: 'button', ws: [3, 20, 3], hs: [26] },
      // button_rollover: { name: 'button_rollover', ws: [3, 20, 3], hs: [26] },
      // button_down: { name: 'button_down', ws: [3, 20, 3], hs: [26] },
      // button_disabled: { name: 'button_disabled', ws: [3, 20, 3], hs: [26] },
      abilitybutton: { name: 'abilitybutton', ws: [24, 16, 24], hs: [32] },
      abilitybutton_rollover: { name: 'abilitybutton_rollover', ws: [24, 16, 24], hs: [32] },
      abilitybutton_down: { name: 'abilitybutton_down', ws: [24, 16, 24], hs: [32] },
      abilitybutton_disabled: { name: 'abilitybutton_disabled', ws: [24, 16, 24], hs: [32] },
      buttonselected_regular: { name: 'pixely/buttonselected', ws: [4, 5, 4], hs: [13] },
      buttonselected_down: { name: 'pixely/buttonselected_down', ws: [4, 5, 4], hs: [13] },
      buttonselected_rollover: { name: 'pixely/buttonselected', ws: [4, 5, 4], hs: [13] },
      buttonselected_disabled: { name: 'pixely/buttonselected_disabled', ws: [4, 5, 4], hs: [13] },
      // panel: { name: 'panel', ws: [3, 2, 3], hs: [3, 10, 3] },
      // menu_entry: { name: 'menu_entry', ws: [4, 5, 4], hs: [13] },
      // menu_selected: { name: 'menu_selected', ws: [4, 5, 4], hs: [13] },
      // menu_down: { name: 'menu_down', ws: [4, 5, 4], hs: [13] },
      // menu_header: { name: 'menu_header', ws: [4, 5, 12], hs: [13] },
      // scrollbar_bottom: { name: 'scrollbar_bottom', ws: [11], hs: [11] },
      // scrollbar_trough: { name: 'scrollbar_trough', ws: [11], hs: [16] },
      // scrollbar_top: { name: 'scrollbar_top', ws: [11], hs: [11] },
      // scrollbar_handle_grabber: { name: 'scrollbar_handle_grabber', ws: [11], hs: [11] },
      // scrollbar_handle: { name: 'scrollbar_handle', ws: [11], hs: [3, 5, 3] },
    },
    ui_sounds: {
      button_click: 'button_click',
      rollover: { file: 'rollover', volume: 0.25 },
      user_join: 'user_join',
      user_leave: 'user_leave',
      msg_in: 'msg_in',
      msg_err: 'msg_err',
      msg_out_err: 'msg_out_err',
      msg_out: 'msg_out',
    },
  })) {
    return;
  }
  if (!engine.webgl2 && need_dfdxy) {
    assert(gl.getExtension('OES_standard_derivatives'), 'GL_OES_standard_derivatives not supported!');
  }
  let font_tiny = fontCreate(font_info_04b03, 'font/04b03_8x1');
  fonts = [
    fontCreate(font_info_palanquin32, 'font/palanquin32'),
    fontCreate(font_info, 'font/ibm8x8x1'),
    font_tiny,
  ];

  let build_font = fonts[0];

  gl.clearColor(20/255, 16/255, 19/255, 1);

  // Actually not too bad:
  if (settings.filter === 1) {
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);
  } else if (settings.filter === 2) {
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.NEAREST);
  }

  ui.scaleSizes(13 / 32);
  ui.setModalSizes(0, round(game_width * 0.8), round(game_height * 0.23), 0, 0);
  ui.setFontHeight(8);
  ui.setPanelPixelScale(1);
  uiSetPanelColor([1, 1, 1, 1]);
  // ui.uiSetFontStyleFocused(fontStyle(ui.uiGetFontStyleFocused(), {
  //   outline_width: 2.5,
  //   outline_color: dawnbringer.font_colors[8],
  // }));

  chat_ui = chatUICreate({
    max_len: 1000,
    w: 256,
    h: 38,
    outline_width: 3,
    fade_start_time: [10000, 5000],
    fade_time: [1000, 1000],
    renderables: markdown_default_renderables, // use all system renderables
  });

  markdownImageRegisterSpriteSheet(crawlertest);

  crawlerBuildModeStartup({
    font: build_font,
    button_height: 11,
  });
  playStartup();
  heroesDrawStartup(font_tiny);
  combatStartup();
  engine.setState(titleInit);
  titleStartup();
}
