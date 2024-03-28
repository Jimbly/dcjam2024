/* eslint prefer-template:off, max-len:off */
import { fontStyle } from 'glov/client/font';
import { randSimpleSpatial } from 'glov/client/rand_fast';
import { PanelParam, sprites as ui_sprites } from 'glov/client/ui';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
} from '../common/crawler_script';
import {
  dialogPush,
  dialogRegister,
} from './dialog_system';
import { Hero } from './entity_demo_client';
import {
  PORTRAIT_SIZE,
  drawHeroName,
} from './hero_draw';
import { CLASSES } from './heroes';
import { onetimeEvent } from './jam_events';
import {
  giveXP,
  myEnt,
  sanityDamage,
} from './play';

const spritesheet_faces = require('./img/faces');
const { sprite_faces } = spritesheet_faces;
const spritesheet_icons = require('./img/icons');
const {
  FRAME_HERO_BG_CHAT,
  sprite_icons,
} = spritesheet_icons;

const { min, floor, round } = Math;

const style_terminal = fontStyle(null, {
  color: 0x59c135ff,
  outline_color: 0x59c13520,
  outline_width: 2,
});

const style_note = fontStyle(null, {
  color: 0x141013ff,
});

dialogIconsRegister({
  terminal: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN;
  },
  note: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN;
  },
  medkit: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE + 2;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN + 2;
  },
});

const CHAT_BG_H = 44;
function drawFace(name: string, face_id: string, param: PanelParam): void {
  let { x, y } = param;
  x += 2;
  y -= CHAT_BG_H - 3;
  let z = Z.STATUS + 4;
  let aspect = sprite_icons.uidata.aspect[FRAME_HERO_BG_CHAT];
  sprite_icons.draw({
    x,
    y,
    z,
    h: CHAT_BG_H,
    w: aspect * CHAT_BG_H,
    frame: FRAME_HERO_BG_CHAT,
    color: param.color,
  });
  z++;
  let face_frame = spritesheet_faces[`FRAME_${face_id.toUpperCase()}`];
  let face_aspect = sprite_faces.uidata.aspect[face_frame] || 1;
  let face_w = round(PORTRAIT_SIZE * face_aspect);
  let px = x + 8;
  let py = y + 5;
  sprite_faces.draw({
    x: px + floor((PORTRAIT_SIZE - face_w) / 2),
    y: py,
    z,
    w: face_w,
    h: PORTRAIT_SIZE,
    frame: face_frame,
    color: param.color,
  });
  if (name) {
    drawHeroName(px + 1, py + PORTRAIT_SIZE + 1, z, name, param.color ? param.color[3] : 1);
  }
}
function randomHeroSpatial(): Hero {
  let me = myEnt();
  let { pos, heroes } = me.data;
  let rnd = randSimpleSpatial(pos[0], pos[1], 0);
  let choice = heroes[floor(rnd * heroes.length)];
  return choice;
}
dialogRegister({
  terminal: function (param: string) {
    if (onetimeEvent()) {
      giveXP('terminal');
    }
    dialogPush({
      name: '',
      text: param,
      font_style: style_terminal,
      transient: true,
    });
  },
  note: function (param: string) {
    if (onetimeEvent()) {
      giveXP('note');
    }
    let name = randomHeroSpatial().name;
    dialogPush({
      name: '',
      text: `*NAME finds a little piece of paper on the ground.*\n\n${param}`.replace('NAME', name),
      font_style: style_note,
      transient: true,
      instant: true,
      panel_sprite: ui_sprites.panel_note,
    });
  },
  party: function (param: string) {
    if (onetimeEvent()) {
      let hero = randomHeroSpatial();
      let { class_id, face, name } = hero;
      let class_def = CLASSES[class_id];
      let face_id = class_def ? (class_def.faces[face || 0] || class_def.faces[0]) : '';
      dialogPush({
        name: '',
        text: param,
        transient: true,
        transient_long: true,
        custom_render: face_id ? drawFace.bind(null, name, face_id[1]) : undefined,
      });
    }
  },
  sanity_restore: function (param: string) {
    let me = myEnt();
    let delta = me.data.sanity_max - me.data.sanity;
    if (delta) {
      sanityDamage(0, -delta, 1000, true);
      dialogPush({
        name: '',
        text: 'You take a moment in solitude to regain some [c=sanity]sanity[/c]...',
        transient: true,
      });
    } else {
      dialogPush({
        name: '',
        text: 'You feel fine now, but know that if you come back, you can refresh your [c=sanity]sanity[/c]...',
        transient: true,
      });
    }
  },
  medkit: function (param) {
    if (!onetimeEvent(true)) {
      return;
    }
    let me = myEnt();
    let delta = min(15, 100 - me.data.sanity_max);
    let mushroom = param === 'mushroom';
    if (!delta) {
      dialogPush({
        name: '',
        text: `${mushroom ?
          'These mushrooms might be useful later...' :
          'This medical station may be useful later...'}` +
          '\n(Restores up to [c=sanity]15 MAX Sanity[/c])',
        transient: true,
      });
    } else {
      dialogPush({
        name: mushroom ? '' : 'Medical Station',
        text: (mushroom ?
          'You find some red and white mushrooms... eat them?' :
          'You rummage through the drawers and see some pills... take them?') +
          '\n(Restores up to [c=sanity]15 MAX Sanity[/c])',
        buttons: [{
          label: 'What\'s the worst that could happen?',
          cb: 'pills',
        }, {
          label: 'No, maybe later...',
        }],
      });
    }
  },
  pills: function () {
    let me = myEnt();
    let delta = min(15, 100 - me.data.sanity_max);
    if (!delta) {
      return;
    }
    if (!onetimeEvent()) {
      return;
    }
    sanityDamage(-delta, -delta, 1000, true);
    dialogPush({
      name: '',
      text: 'You mind feels more at ease.  Let\'s not worry about the side effects...',
      transient: true,
    });
  },
});

const LEAVE_TEXT = `
I'm too scared to go forward, and too lost to find my way out of this place alone. I'm not leaving this room.
I think I like it here. This place is perfect... I'm sorry, but I'm going to stay behind here...
I'm out. This is my home now. Tell my roommates back home they'll have to put up with their subletter on a more permanent basis. Beats being dead.
I... can't take it anymore. What are those things? Who are you guys? I'm just going to stay here. Sorry.
I barely even remember my own name. This is the end for me, this is where I rest.
`.trim().split('\n');

export function doSolitudeLeave(floor_idx: number, hero: Hero): void {
  let { class_id, face, name } = hero;
  let class_def = CLASSES[class_id];
  let face_id = class_def ? (class_def.faces[face || 0] || class_def.faces[0]) : '';
  dialogPush({
    name: '',
    text: LEAVE_TEXT[floor_idx] + `\n\n([c=2]${name}[/c] has left the party)`,
    custom_render: face_id ? drawFace.bind(null, name, face_id[1]) : undefined,
    buttons: [{
      label: 'Okay...',
    }, {
      label: 'We\'ll miss you.',
    }]
  });
}
