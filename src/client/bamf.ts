/* eslint max-len: off, prefer-template:off */
import assert from 'assert';
import { ALIGN, fontStyle } from 'glov/client/font';
import { inputClick } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { buttonText, panel, playUISound, uiButtonHeight } from 'glov/client/ui';
import { Hero } from './entity_demo_client';
import {
  VIEWPORT_X0,
  VIEWPORT_Y0,
  game_height,
  render_width,
} from './globals';
import {
  HERO_H,
  HERO_W,
  drawHero,
} from './hero_draw';
import { myEnt, myEntOptional } from './play';

const { floor, random } = Math;

const lines_m: string[] = [
  'NAME has died. His two cats are very hungry and unsure what to do about it.',
  'NAME has died. His fanfiction magnum opus remains unfinished, although his three followers may continue to check his page for updates.',
  'NAME has died. His three year old daughter is not old enough to understand.',
  'NAME has died. His older sister is very sad he won\'t be at her wedding.',
];
const lines_f: string[] = [
  'NAME has died. Her daughter Jane is very sad she isn\'t coming home.',
  'NAME has died. She leaves behind no next of kin, but her childhood best friend has been meaning to give her a call lately.',
  'NAME has died. Her father is still waiting to hear back about whether she\'s coming home for the holidays.',
];
const lines_a = lines_m.concat(lines_f);

const summons = [
  'It\'s gotta be NAME',
  'Call in NAME',
  'NAME\'s the one!',
  'Help me, NAME!',
  'I choose you, NAME.',
];

function ar(arr: string[]): string {
  return arr[floor(random() * arr.length)];
}

function randomLine(gender: 'm' | 'f' | 'a'): string {
  let lines = gender === 'm' ? lines_m : gender === 'f' ? lines_f : lines_a;
  return ar(lines);
}

let need_bamf: boolean;
let bamf_state: {
  page: number;
  hero: Hero;
  hero_idx: number;
  line: string;
  summons: [string, string];
  replacements: [Hero, Hero];
} | null = null;

export function bamfCheck(): void {
  let me = myEntOptional();
  if (!me) {
    return;
  }
  let ent_heroes = me.data.heroes;
  need_bamf = false;
  if (!ent_heroes) {
    return;
  }
  for (let ii = 0; ii < ent_heroes.length; ++ii) {
    let hero = ent_heroes[ii];
    if (hero.dead) {
      need_bamf = true;
      if (!bamf_state || bamf_state.hero !== hero) {
        let s: [string, string] = [ar(summons), ar(summons)];
        while (s[0] === s[1]) {
          s[1] = ar(summons);
        }
        bamf_state = {
          page: 0,
          hero_idx: ii,
          hero,
          line: randomLine(hero.gender),
          summons: s,
          replacements: [{
            class_id: 'mid1',
            tier: 1,
            name: 'Hale',
            gender: 'a',
          },{
            class_id: 'mid2',
            tier: 1,
            name: 'Mags',
            gender: 'a',
          }],
        };
      }
      break;
    }
  }
}

export function bamfReset(): void {
  bamfCheck();
}

const style_label = fontStyle(null, {
  color: 0xdae0eaff,
});

const style_death = fontStyle(style_label, {
  glow_color: 0xda1625ff,
  glow_inner: 0,
  glow_outer: 2.5,
});

const PAD = 8;
export function bamfTick(): boolean {
  if (!need_bamf) {
    return false;
  }
  let x0 = VIEWPORT_X0;
  let y0 = VIEWPORT_Y0;
  let w = render_width;
  let h = game_height - PAD - y0;
  let panel_param = {
    x: x0,
    y: y0,
    w,
    h,
    eat_clicks: false,
  };

  let x = x0 + PAD;
  w -= PAD * 2;
  let y = y0 + PAD;

  assert(bamf_state);
  let { page, hero } = bamf_state;

  if (page === 0) {
    //y += 24;
    markdownAuto({
      font_style: style_death,
      x, y, w, h: 104 - y,
      align: ALIGN.HCENTER | ALIGN.HWRAP | ALIGN.VCENTER,
      text: bamf_state.line.replace('NAME', `[c=2]${hero.name}[/c]`).replace('has died', 'has [c=1]died[/c]'),
    });

    y = 104;
    y += markdownAuto({
      font_style: style_label,
      x, y, w,
      align: ALIGN.HCENTER | ALIGN.HWRAP,
      text: 'You activate the [c=2]Bamf[/c] device and call in...',
    }).h + PAD;

    let hero_x = x + floor((w - HERO_W)/2);
    let picked = -1;
    for (let ii = 0; ii < bamf_state.replacements.length; ++ii) {
      if (inputClick({
        x: hero_x, y, w: HERO_W, h: HERO_H,
        button: 0,
      })) {
        picked = ii;
        playUISound('button_click');
      }
      drawHero(bamf_state.hero_idx, hero_x, y, bamf_state.replacements[ii]);
      y += HERO_H;
      if (buttonText({
        x: hero_x, y,
        w: HERO_W,
        text: bamf_state.summons[ii].replace('NAME', bamf_state.replacements[ii].name),
      })) {
        picked = ii;
      }
      y += uiButtonHeight() + PAD;
    }

    if (picked !== -1) {
      let me = myEnt();
      assert(me);
      let ent_heroes = me.data.heroes;
      ent_heroes[bamf_state.hero_idx] = bamf_state.replacements[picked];
      bamf_state = null;
    }
  }

  panel(panel_param);

  bamfCheck();
  return need_bamf;
}