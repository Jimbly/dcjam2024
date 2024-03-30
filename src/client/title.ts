import * as camera2d from 'glov/client/camera2d';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyle, fontStyleColored } from 'glov/client/font';
import { fscreenAvailable, fscreenEnter } from 'glov/client/fscreen';
import {
  KEYS,
  inputTouchMode,
  keyDownEdge,
} from 'glov/client/input';
import { localStorageGetJSON } from 'glov/client/local_storage';
import { netSubs } from 'glov/client/net';
import { scoresDraw } from 'glov/client/score_ui';
import {
  buttonText,
  modalDialog,
  print,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { TSMap } from 'glov/common/types';
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
import { game_height, game_width } from './globals';
import * as main from './main';
import {
  Score,
  getScoreSystem,
} from './play';


const { max } = Math;

type AccountUI = ReturnType<typeof createAccountUI>;

let account_ui: AccountUI;

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

function title(dt: number): void {
  if (want_hof) {
    want_hof = false;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    engine.setState(stateHighScores);
    return;
  }
  main.chat_ui.run({
    hide: true,
  });

  let y = 40;
  if (netSubs()) {
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

  let x = 10;
  print(null, x, y, Z.UI, 'Crawler Demo');
  x += 10;
  y += uiTextHeight() + 2;
  for (let ii = 0; ii < 3; ++ii) {
    let slot = ii + 1;
    let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
    let auto_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.auto`, { timestamp: 0 });
    if (auto_data.timestamp > manual_data.timestamp) {
      manual_data = auto_data;
    }
    let yy = y;
    print(null, x, yy, Z.UI, `Slot ${slot}`);
    yy += uiButtonHeight();
    let key = `lg${ii}`;
    if (buttonText({
      x, y: yy, text: 'Load Game',
      disabled: !hasSaveData(slot),
      in_event_cb: fullscreenGo.bind(null, key),
    }) || fullscreenDid(key)) {
      crawlerPlayWantMode('recent');
      urlhash.go(`?c=local&slot=${slot}`);
    }
    yy += uiButtonHeight() + 2;
    if (manual_data.time_played) {
      uiGetFont().draw({
        x, y: yy,
        w: uiButtonWidth(),
        align: ALIGN.HCENTER,
        text: `(${Math.ceil(manual_data.time_played/(1000*60))} mins)`
      });
    }
    yy += uiTextHeight() + 2;
    key = `ng${ii}`;
    if (buttonText({
      x, y: yy, text: 'New Game',
      in_event_cb: fullscreenGo.bind(null, key),
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
    x += uiButtonWidth() + 2;
  }
  x = 10;

  y += uiButtonHeight() * 4 + 10;
  if (buttonText({
    x, y, text: 'Hall of Fame',
  })) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    engine.setState(stateHighScores);
  }
  // y += uiButtonHeight() * 4 + 6;
  // if (netSubs().loggedIn()) {
  //   if (buttonText({
  //     x, y, text: 'Online Test', w: uiButtonWidth() * 1.5,
  //   })) {
  //     urlhash.go('?c=build');
  //   }
  //   y += uiButtonHeight() + 2;
  // }
  if (crawlerCommWant()) {
    crawlerCommStart();
  }
  ambienceTick();
}

export function titleInit(dt: number): void {
  account_ui = account_ui || createAccountUI();
  engine.setState(title);
  title(dt);
}

const SCORE_COLUMNS = [
  // widths are just proportional, scaled relative to `width` passed in
  { name: '', width: 12, align: ALIGN.HFIT | ALIGN.HRIGHT | ALIGN.VCENTER },
  { name: 'Name', width: 60, align: ALIGN.HFIT | ALIGN.VCENTER },
  { name: 'Floor', width: 32 },
  { name: 'Discover', width: 32 },
  { name: 'Max Sanity Loss', width: 32 },
];
const style_score = fontStyleColored(null, 0xFFFFFFff);
const style_me = fontStyleColored(null, 0xffd541ff);
const style_header = fontStyleColored(null, 0xFFFFFFff);
function myScoreToRow(row: unknown[], score: Score): void {
  row.push(score.victory ? 'WIN' : `${score.max_floor}/5`, score.xp, score.sanity * 2);
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
  camera2d.setAspectFixed(W, H);
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

  ambienceTick();
}

export function titleStartup(): void {
  crawlerCommStartup({
    lobby_state: titleInit,
    title_func: (value: string) => `Crawler Demo | "${value}"`,
    chat_ui: main.chat_ui,
  });
}
