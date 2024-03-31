import { AnimationSequencer, animationSequencerCreate } from 'glov/client/animation';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyle, fontStyleColored } from 'glov/client/font';
import { fscreenAvailable, fscreenEnter } from 'glov/client/fscreen';
import {
  KEYS,
  eatAllInput,
  inputTouchMode,
  keyDown,
  keyDownEdge,
  mouseDownAnywhere,
} from 'glov/client/input';
import { localStorageGetJSON } from 'glov/client/local_storage';
import { netSubs } from 'glov/client/net';
import { scoresDraw } from 'glov/client/score_ui';
import { Sprite, spriteCreate } from 'glov/client/sprites';
import {
  buttonText,
  modalDialog,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { TSMap } from 'glov/common/types';
import { vec4 } from 'glov/common/vmath';
import { createAccountUI } from './account_ui';
import { ambienceTick } from './ambience';
import {
  crawlerCommStart,
  crawlerCommStartup,
  crawlerCommWant,
} from './crawler_comm';
import {
  SavedGameData,
  crawlerPlayWantMode,
  crawlerPlayWantNewGame,
} from './crawler_play';
import { creditsGo } from './credits';
import { game_height, game_width } from './globals';
import * as main from './main';
import {
  Score,
  getScoreSystem,
} from './play';


const { floor, max, min, sin, random } = Math;

type AccountUI = ReturnType<typeof createAccountUI>;

let account_ui: AccountUI;

let sprite_title: Sprite;
let sprite_shadow: Sprite;
let parallax: Sprite[];

export function hasSaveData(slot: number): boolean {
  let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
  let auto_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.auto`, { timestamp: 0 });
  return Boolean(manual_data.timestamp || auto_data.timestamp);
}

let want_hof = false;
export function goToHallOfFame(): void {
  want_hof = true;
}


let fs_did: TSMap<number> = {};
function fullscreenGo(key: string): void {
  if (inputTouchMode() && fscreenAvailable()) {
    fscreenEnter();
  }
  fs_did[key] = engine.getFrameIndex();
}
function fullscreenDid(key: string): boolean {
  return (fs_did[key] && fs_did[key]! >= engine.getFrameIndex() - 1) || false;
}

let title_anim: AnimationSequencer | null = null;
let title_alpha = {
  title: 0,
  sub: 0,
  button: 0,
};

const style_sub = fontStyle(null, {
  color: 0x6d758dff,
  glow_color: 0x141013ff,
  glow_inner: 1.5,
  glow_outer: 2.5,
});

const color_myblack = vec4(20/255, 16/255, 19/255, 1);

const FOR_LOGO = false;

export function drawParallax(): void {
  let W = game_width;
  let H = game_height;
  for (let ii = 0; ii < parallax.length; ++ii) {
    let img = parallax[ii];
    let offs = engine.getFrameTimestamp() * (1 + ii * 0.1) * 0.000003;
    let uvs = img.uvs;
    let aspect = img.getAspect();
    let vh = W / aspect;
    let v1 = H / vh;
    img.draw({
      x: 0,
      y: 0,
      z: 0.1 + ii * 0.1,
      w: W,
      h: H,
      uvs: [0, offs, uvs[2], v1 * uvs[3] + offs],
    });
  }
}

function title(dt: number): void {
  gl.clearColor(color_myblack[0], color_myblack[1], color_myblack[2], 0);
  if (want_hof) {
    want_hof = false;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    engine.setState(stateHighScores);
    return;
  }
  main.chat_ui.run({
    hide: true,
  });

  if (title_anim) {
    if (keyDown(KEYS.SHIFT) || mouseDownAnywhere()) {
      dt = 100000;
    }
    if (!title_anim.update(dt)) {
      title_anim = null;
    } else {
      eatAllInput();
    }
  }

  let y = 40;
  if (netSubs() && false) {
    let next_y = account_ui.showLogin({
      x: 10,
      y: 10,
      pad: 2,
      text_w: 120,
      label_w: 80,
      style: null,
      center: false,
      button_width: uiButtonWidth(),
      font_height_small: uiTextHeight(),
    });

    y = max(next_y + 2, y);
  }

  let W = game_width;

  if (!FOR_LOGO) {
    drawParallax();
  }

  let title_w = 260;
  let title_h = 132;
  sprite_title.draw({
    x: floor(W - title_w)/2,
    y: 20,
    w: title_w,
    h: title_h,
    z: Z.UI - 2,
    color: [1,1,1,title_alpha.title],
  });
  let shadow_alpha = sin(engine.getFrameTimestamp() * 0.0005) * 500 - 499;
  if (FOR_LOGO) {
    shadow_alpha = 1;
  }
  if (shadow_alpha > 0) {
    sprite_shadow.draw({
      x: 94 + (FOR_LOGO ? 0 : random() * 10),
      y: 45 + (FOR_LOGO ? -20 : random() * 20),
      w: 294,
      h: 248,
      z: FOR_LOGO ? Z.UI - 3 : Z.UI - 1,
      color: [1,1,1,min(shadow_alpha, 0.25)],
    });
  }

  let button_height = uiButtonHeight();
  let text_height = uiTextHeight();
  y = game_height - button_height * 5 - text_height * 3 - 16;
  let font = uiGetFont();

  if (FOR_LOGO) {
    title_alpha.sub = 0;
  }
  font.draw({
    style: style_sub,
    alpha: title_alpha.sub,
    x: 0, y, w: game_width, align: ALIGN.HCENTER,
    text: 'By Jimb Esser, Siena Merlin Moraff,',
  });
  y += text_height + 2;
  font.draw({
    style: style_sub,
    alpha: title_alpha.sub,
    x: 0, y, w: game_width, align: ALIGN.HCENTER,
    text: 'Rose Evans, and Cooper Savage',
  });
  y += text_height + 2;
  font.draw({
    style: style_sub,
    alpha: title_alpha.sub,
    x: 0, y, w: game_width, align: ALIGN.HCENTER,
    text: 'Monster Art from Tyler Warren',
  });
  y += text_height + 4;

  let mid_w = uiButtonWidth() * 2 + 16;
  let x0 = floor((W - mid_w) / 2);
  let x = x0;
  y += uiTextHeight() + 2;
  if (title_alpha.button) {
    let y_save = 0;
    let y_save2 = 0;
    for (let ii = 0; ii < 2; ++ii) {
      let slot = ii + 1;
      let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
      let auto_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.auto`, { timestamp: 0 });
      if (auto_data.timestamp > manual_data.timestamp) {
        manual_data = auto_data;
      }
      let yy = y;
      font.draw({
        x, y: yy,
        color: 0x333941ff,
        w: uiButtonWidth(),
        alpha: title_alpha.button,
        align: ALIGN.HCENTER,
        text: `Slot ${slot}`,
      });
      yy += text_height + 1;
      let key = `lg${ii}`;
      y_save = yy;
      if (buttonText({
        x, y: yy, text: 'Load Game',
        disabled: !hasSaveData(slot),
        in_event_cb: fullscreenGo.bind(null, key),
        color: [1,1,1,title_alpha.button],
      }) || fullscreenDid(key)) {
        crawlerPlayWantMode('recent');
        urlhash.go(`?c=local&slot=${slot}`);
      }
      yy += uiButtonHeight() + 2;
      if (manual_data.time_played) {
        uiGetFont().draw({
          alpha: title_alpha.button,
          x, y: yy,
          w: uiButtonWidth(),
          align: ALIGN.HCENTER,
          text: engine.defines.SECONDS ? `${Math.ceil(manual_data.time_played/1000)}` :
            `(${Math.ceil(manual_data.time_played/(1000*60))} mins)`
        });
      }
      yy += uiTextHeight() + 2;
      key = `ng${ii}`;
      if (buttonText({
        x, y: yy, text: 'New Game',
        in_event_cb: fullscreenGo.bind(null, key),
        color: [1,1,1,title_alpha.button],
      }) || fullscreenDid(key)) {
        if (manual_data.timestamp) {
          modalDialog({
            text: 'This will overwrite your existing game.  Continue?',
            buttons: {
              yes: function () {
                crawlerPlayWantNewGame();
                urlhash.go(`?c=local&slot=${slot}`);
              },
              no: null,
            }
          });
        } else {
          crawlerPlayWantNewGame();
          urlhash.go(`?c=local&slot=${slot}`);
        }
      }
      y_save2 = yy + uiButtonHeight();
      x += uiButtonWidth() + 16;
    }

    y = floor((y_save + y_save2 - uiButtonHeight()) / 2);
    x = floor((x0 - uiButtonWidth())/2);
    if (buttonText({
      x, y, text: 'Hall of Fame',
      color: [1,1,1,title_alpha.button],
    })) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      engine.setState(stateHighScores);
    }
    x = floor(game_width - ((game_width - mid_w) / 2 - uiButtonWidth())/2) - uiButtonWidth();

    if (buttonText({
      x, y, text: 'Credits',
      color: [1,1,1,title_alpha.button],
    })) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      creditsGo();
    }
  }

  if (crawlerCommWant()) {
    crawlerCommStart();
  }
  ambienceTick('title');
}

let first_time = true;
export function titleInit(dt: number): void {
  if (first_time) {
    title_anim = animationSequencerCreate();
    let t = title_anim.add(0, 300, (progress) => {
      title_alpha.title = progress;
    });
    // t = title_anim.add(t + 200, 1000, (progress) => {
    //   title_alpha.desc = progress;
    // });
    t = title_anim.add(t + 300, 300, (progress) => {
      title_alpha.sub = progress;
    });
    title_anim.add(t + 500, 300, (progress) => {
      title_alpha.button = progress;
    });
  }
  first_time = false;

  account_ui = account_ui || createAccountUI();
  engine.setState(title);
  title(dt);
}

const SCORE_COLUMNS = [
  // widths are just proportional, scaled relative to `width` passed in
  { name: '', width: 12, align: ALIGN.HFIT | ALIGN.HRIGHT | ALIGN.VCENTER },
  { name: 'Name', width: 60, align: ALIGN.HFIT | ALIGN.VCENTER },
  { name: 'Floor', width: 20 },
  { name: 'Discoveries', width: 32 },
  { name: 'Max Sanity Loss', width: 32 },
  { name: 'Playtime', width: 24, align: ALIGN.HRIGHT },
];
const style_score = fontStyleColored(null, 0xFFFFFFff);
const style_me = fontStyleColored(null, 0xffd541ff);
const style_header = fontStyleColored(null, 0xb9bffbff);
function timeformat(seconds: number): string {
  let ss = seconds % 60;
  let mm = (seconds - ss) / 60;
  return `${mm}:${ss < 10 ? '0' : ''}${ss} `;
}
function myScoreToRow(row: unknown[], score: Score): void {
  row.push(score.victory ? 'WIN' : `${min(score.max_floor, 5)}/5`, score.xp, score.sanity * 2,
    timeformat(score.seconds));
}
const style_title = fontStyle(null, {
  color: 0x249fdeff,
  glow_color: 0x122020ff,
  glow_inner: -2,
  glow_outer: 4,
  glow_xoffs: 0,
  glow_yoffs: 0,
});

const level_idx = 0;
function stateHighScores(): void {
  let W = game_width;
  let H = game_height;
  // camera2d.setAspectFixed(W, H);
  drawParallax();
  let font = uiGetFont();

  let y = 8;
  let pad = 16;
  let text_height = uiTextHeight();
  let button_h = uiButtonHeight();

  font.draw({
    x: 0, w: W, y, align: ALIGN.HCENTER,
    size: text_height * 2,
    style: style_title,
    text: 'Hall of Fame',
  });

  y += text_height * 2 + 8;

  // let has_score = score_system.getScore(level_idx);

  let button_w = 120;

  if (buttonText({
    x: (W - button_w)/2, y,
    w: button_w, h: button_h,
    text: 'Return to Title',
  }) || keyDownEdge(KEYS.ESC)) {
    engine.setState(title);
  }
  y += button_h + 2;

  // pad = 8;
  // let x = pad;
  // let toggle_y = H - button_h - pad;
  // if (buttonImage({
  //   img: sprite_space,
  //   shrink: 16/button_h,
  //   frame: settings.volume_sound ? FRAME_SOUND_ON : FRAME_SOUND_OFF,
  //   x, y: toggle_y, h: button_h, w: button_h,
  // })) {
  //   settings.set('volume_sound', settings.volume_sound ? 0 : 1);
  // }
  // x += button_h + pad;
  // if (buttonImage({
  //   img: sprite_space,
  //   shrink: 16/button_h,
  //   frame: settings.volume_music ? FRAME_MUSIC_ON : FRAME_MUSIC_OFF,
  //   x, y: toggle_y, h: button_h, w: button_h,
  // })) {
  //   settings.set('volume_music', settings.volume_music ? 0 : 1);
  // }

  pad = 24;
  scoresDraw<Score>({
    score_system: getScoreSystem(),
    allow_rename: true,
    x: pad, width: W - pad * 2,
    y, height: H - y - 2,
    z: Z.UI,
    size: text_height,
    line_height: text_height+2,
    level_index: level_idx,
    columns: SCORE_COLUMNS,
    scoreToRow: myScoreToRow,
    style_score,
    style_me,
    style_header,
    color_line: [1,1,1,1],
    color_me_background: [0.2,0.2,0.2,1],
  });

  ambienceTick('title');
}

export function titleStartup(): void {
  crawlerCommStartup({
    lobby_state: titleInit,
    title_func: (value: string) => 'Snake Eyes',
    chat_ui: main.chat_ui,
  });
  sprite_title = spriteCreate({
    name: 'title',
  });
  sprite_shadow = spriteCreate({
    name: 'shadow',
  });

  parallax = [1, 2, 3, 4, 5, 6].map((a) => {
    return spriteCreate({
      name: `titlebg${a}`,
    });
  });
}
