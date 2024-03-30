import { autoReset } from 'glov/client/auto_reset';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyle } from 'glov/client/font';
import { KEYS, keyUpEdge, mouseDownAnywhere } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { FADE_OUT, soundPlayMusic } from 'glov/client/sound';
import { buttonText } from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { vec4 } from 'glov/common/vmath';
import { ambienceTick } from './ambience';
import { game_height, game_width } from './globals';
import { titleInit } from './title';

const { round } = Math;

const text = `

Thanks for playing!




[c=xp]PLACEHOLDER TITLE[/c]
[c=sanity] (c)2024 Jimb Esser, et al, All rights reserved[/c]

Created in 9 days for [c=3]Dungeon Crawler Jam 2024[/c]


[c=xp]CODING - DESIGN - KITBASHING[/c]
[c=sanity]Jimb Esser[/c]

[c=xp]WRITING - DESIGN[/c]
[c=sanity]Siena Moraff[/c]

[c=xp]SOUND FX[/c]
[c=sanity]Rose Evans[/c]
Footstep sounds by [c=sanity]Alex Hamadey[/c]

[c=xp]MUSIC[/c]
[c=sanity]Cooper Savage[/c]

[c=xp]MONSTER ART ASSETS BY[/c]
[c=sanity]Tyler Warren[/c]

[c=xp]OTHER ASSET PACKS BY[/c]
See page on itch.io for links
[c=sanity]ELV[/c]
[c=sanity]finalbossblues[/c]
[c=sanity]Dungeon Crawl Stone Soup[/c]
[c=sanity]Digital Mosaic Games[/c]
[c=sanity]game-icons.net[/c]
[c=sanity]Oryx[/c]

[c=xp]ENGINE[/c]
[c=sanity]GLOV.js + crawler toolkit[/c]
[c=sanity]MIT Licensed[/c]
[c=sanity]by Jimb Esser[/c]

[c=xp]CREDITS MUSIC[/c]
[c=sanity]Zooperdan via Suno.ai[/c]

[c=xp]SPECIAL THANKS[/c]
[c=sanity]Steve Moraff for inspiring us[/c]
[c=sanity]The DungeonCrawlers.org Discord[/c]

`.split('\n');

const color_myblack = vec4(20/255, 16/255, 19/255, 1);
const style_credits = fontStyle(null, {
  color: 0xdae0eaff,
});

const PAD = 20;
let scroll_pos = 0;
let looped = false;
let clicked = false;
function exit(): void {
  urlhash.go('');
  engine.setState(titleInit);
  soundPlayMusic('music/credits', 0, FADE_OUT);
}
function doCredits(): void {
  gl.clearColor(color_myblack[0], color_myblack[1], color_myblack[2], 0);

  if (mouseDownAnywhere()) {
    clicked = true;
  } else {
    scroll_pos += engine.getFrameDt() * 0.03;
  }

  if (autoReset('credits')) {
    scroll_pos = -game_height + 32;
  }

  let y = -round(scroll_pos);
  for (let ii = 0; ii < text.length; ++ii) {
    let line = text[ii];
    if (line) {
      y += markdownAuto({
        font_style: style_credits,
        x: PAD,
        y,
        w: game_width - PAD * 2,
        align: ALIGN.HCENTER|ALIGN.HWRAP,
        line_height: 9,
        text: line,
      }).h + 1;
    } else {
      y += 9;
    }
  }
  if (y <= 0) {
    scroll_pos = -game_height;
    looped = true;
  }

  if (looped || clicked) {
    if (buttonText({
      x: game_width - 24 - 4,
      y: 4,
      w: 24,
      h: 24,
      text: '←',
    })) {
      exit();
    }
  }
  if (keyUpEdge(KEYS.ESC)) {
    exit();
  }

  ambienceTick();
}

export function creditsGo(): void {
  soundPlayMusic('music/credits');
  engine.setState(doCredits);
}
