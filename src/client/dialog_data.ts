/* eslint prefer-template:off, max-len:off */
import { fontStyle } from 'glov/client/font';
import { PanelParam, sprites as ui_sprites } from 'glov/client/ui';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
} from '../common/crawler_script';
import { crawlerScriptAPI } from './crawler_play';
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

const MEDKIT_AMT = 5;

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
function randomHeroSpatial(offset?: number): Hero {
  let me = myEnt();
  let { heroes } = me.data;
  let idx = (crawlerScriptAPI().getRand().range(heroes.length) + (offset || 0)) % heroes.length;
  let choice = heroes[idx];
  return choice;
}
let sapling_water_count = 0;
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
    let text = `*NAME finds a little piece of paper on the ground.*\n\n${param}`.replace('NAME', name);
    if (param.startsWith('NAME')) {
      text = `*${param}*`.replace('NAME', name);
    }
    dialogPush({
      name: '',
      text: text,
      font_style: style_note,
      transient: true,
      instant: true,
      panel_sprite: ui_sprites.panel_note,
    });
  },
  party: function (param: string) {
    if (onetimeEvent() || true) {
      let offset = 0;
      if (param.startsWith('1 ')) {
        offset = 1;
        param = param.slice(2);
      }
      let hero = randomHeroSpatial(offset);
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
    let delta = min(MEDKIT_AMT, 100 - me.data.sanity_max);
    let mushroom = param === 'mushroom';
    if (!delta) {
      dialogPush({
        name: '',
        text: `${mushroom ?
          'These mushrooms might be useful later...' :
          'This medical station may be useful later...'}` +
          `\n(Restores up to [c=sanity]${MEDKIT_AMT} MAX Sanity[/c])`,
        transient: true,
      });
    } else {
      dialogPush({
        name: mushroom ? '' : 'Medical Station',
        text: (mushroom ?
          'You find some red and white mushrooms... eat them?' :
          'You rummage through the drawers and see some pills... take them?') +
          `\n(Restores up to [c=sanity]${MEDKIT_AMT} MAX Sanity[/c])`,
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
    let delta = min(MEDKIT_AMT, 100 - me.data.sanity_max);
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
  leader_upgrade: function () {
    let hero = myEnt().data.heroes[0];
    if (hero.tier === 2) {
      return;
    }
    hero.tier = 2;
    hero.levels[0] = 0;
    hero.levels[1] = 0;
    let { class_id, face, name } = hero;
    let class_def = CLASSES[class_id];
    let face_id = class_def ? (class_def.faces[face || 0] || class_def.faces[0]) : '';
    dialogPush({
      name: '',
      text: 'I feel... stronger...\n([c=xp]Upgraded to MAX TIER[img=star][img=star][/c])',
      custom_render: face_id ? drawFace.bind(null, name, face_id[1]) : undefined,
      transient: true,
      transient_long: true,
    });
  },
  finale: function () {
    let hero = randomHeroSpatial();
    let { class_id, face, name } = hero;
    let class_def = CLASSES[class_id];
    let face_id = class_def ? (class_def.faces[face || 0] || class_def.faces[0]) : '';
    sapling_water_count = 0;
    dialogPush({
      name: '',
      text: 'Ph\'nglui mglw\'nafh Cthulhu R\'lyeh wgah\'nagl fhtagn!',
      custom_render: face_id ? drawFace.bind(null, '???', 'boss') : undefined,
      buttons: [{
        label: '...',
        cb: function () {
          dialogPush({
            name: '',
            text: 'I swear he said "I hate birthdays", but that has to be wrong.',
            custom_render: face_id ? drawFace.bind(null, name, face_id[1]) : undefined,
            buttons: [{
              label: '...',
              cb: function () {
                dialogPush({
                  name: '',
                  text: 'The creature lies spread eagled on its back, in a pool of its own blood.' +
                    ' Turquoise roots wriggle out of the wound in its chest and a little sapling sprouts lavender leaves.',
                  buttons: [{
                    label: 'Water the sapling.',
                    cb: 'saplingwater',
                  }, {
                    label: 'Pick the sapling.',
                    cb: 'saplingpick',
                  }],
                });
              },
            }],
          });
        },
      }],
    });
  },
  saplingpick: function () {
    dialogPush({
      name: '',
      text: 'Your party takes turns cradling the delicate plant in their hands and feeling an otherworldly sense of care for it. Holding this plant, you feel an otherworldly sense of direction.',
      buttons: [{
        label: 'We can go home!',
        cb: function () {
          dialogPush({
            name: '',
            text: 'The party makes their way out of the dungeon, no sweat. By the time they arrive back in the latrine, the sapling is as withered as an old carrot. They look at each other, shrug, and flush it down the toilet. Their loved ones are very happy to know they\'re coming home.',
            buttons: [{
              label: 'The end.',
              cb: 'end',
            }],
          });
        },
      }],
    });
  },
  saplingwater: function () {
    ++sapling_water_count;
    if (sapling_water_count === 7) {
      return dialogPush({
        name: '',
        text: 'Your party\'s canteens are all empty.',
        buttons: [{
          label: 'Stay with the sapling.',
          cb: 'saplingstay',
        }, {
          label: 'Pick the sapling.',
          cb: 'saplingpick',
        }],
      });
    }
    let line = [
      '',
      'As water falls on the tender plant, your party feels an otherworldly sense of understanding. The minds of your party members drift through a sea of wordless answers.',
      'As droplets cascade onto the delicate foliage, a surreal comprehension envelops your group. Together, their thoughts wander through an ocean of unspoken truths.',
      'Like the gentle shower upon the fragile sapling, a mystical insight embraces your party.',
      'As water trickles onto the tender greenery, an unearthly awareness settles upon your party. Their thoughts meander through a vast expanse of silent understanding, like voyagers adrift on a wordless sea.',
      'With each drop nurturing the young plant, an otherworldly clarity dawns upon the party.',
      'Like gentle rain on a fragile bloom, an ethereal comprehension descends upon your gathering. Each member\'s consciousness meanders through a realm of silent revelations.',
    ][sapling_water_count];
    dialogPush({
      name: '',
      text: line,
      buttons: [{
        label: 'Water the sapling.',
        cb: 'saplingwater',
      }, {
        label: 'Pick the sapling.',
        cb: 'saplingpick',
      }],
    });
  },
  saplingstay: function () {
    dialogPush({
      name: '',
      text: 'The sapling grows into a tall, wide, gentle tree, and your party members grow old. They lose their names, and faces, and die unafraid.',
      buttons: [{
        label: 'The end.',
        cb: 'end',
      }],
    });
  },
  end: function () {
    // TODO
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
