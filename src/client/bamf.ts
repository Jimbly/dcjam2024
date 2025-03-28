/* eslint-disable @stylistic/max-len */
/* eslint-disable prefer-template */
import assert from 'assert';
import { getFrameTimestamp } from 'glov/client/engine';
import { ALIGN, fontStyle } from 'glov/client/font';
import { inputClick } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import {
  buttonText,
  drawRect,
  panel,
  playUISound,
  suppressNewDOMElemWarnings,
  uiButtonHeight,
} from 'glov/client/ui';
import type { TSMap } from 'glov/common/types';
import { easeOut } from 'glov/common/util';
import { showAbilityTooltip } from './combat';
import { crawlerGameState } from './crawler_play';
import { Hero } from './entity_demo_client';
import {
  game_height,
  render_width,
  VIEWPORT_X0,
  VIEWPORT_Y0,
} from './globals';
import {
  drawHero,
  HERO_H,
  HERO_W,
} from './hero_draw';
import { randomHero } from './heroes';
import { isBootstrap, myEnt, myEntOptional } from './play';

const { floor, max, min, random } = Math;

let lines_seen: TSMap<number> = {};

const lines_m: string[] = [
  'NAME has died. His two cats are very hungry and unsure what to do about it.',
  'NAME has died. His fanfiction magnum opus remains unfinished, although his three followers may continue to check his page for updates.',
  'NAME has died. His three year old daughter is not old enough to understand.',
  'NAME has died. His older sister is very sad he won\'t be at her wedding.',
  'NAME has died. He leaves no one behind.',
  'NAME has died. He was waiting for the last season of SUPER COOL VAMPIRES to air.',
  'NAME has died. His fiance Jackson will be undone by knowing he isn\'t coming home.',
  'NAME has died. The worms will eat his bones and find them to be delicious.',
];
const lines_f: string[] = [
  'NAME has died. Her daughter Jane is very sad she isn\'t coming home.',
  'NAME has died. She leaves behind no next of kin, but her childhood best friend has been meaning to give her a call lately.',
  'NAME has died. Her father is still waiting to hear back about whether she\'s coming home for the holidays.',
  'NAME has died. Her Minecraft horses will not miss her because they are not real.',
  'NAME has died. Her fiance Taylor will be distraught she isn\'t coming home.',
  'NAME has died. Her younger brothers are not sure if they can delete her game saves.',
  'NAME has died. She leaves no one behind.',
  'NAME has died. She was in the middle of a good book.',
];
const lines_a = lines_m.concat(lines_f).concat([
  'NAME has died. The world may be better off for it.',
]);

const summons = [
  'It\'s gotta be NAME.',
  'Call in NAME.',
  'NAME\'s the one!',
  'Help me, NAME!',
  'I choose you, NAME.',
  'Give me a hand, NAME!',
  'Get in here, NAME!',
  'Get out here, NAME!',
  'Help me, NAME, you\'re my only hope!',
  'Where have you been, NAME?',
  'Long time no see, NAME.',
  'Funny meeting you here, NAME.',
  'It\'s your time to shine, NAME!',
];

function ar(arr: string[]): string {
  return arr[floor(random() * arr.length)];
}

function randomLine(gender: 'm' | 'f' | 'a'): string {
  let lines = gender === 'm' ? lines_m : gender === 'f' ? lines_f : lines_a;
  let min_count = Infinity;
  lines.map((a) => {
    let c = lines_seen[a] || 0;
    min_count = min(c, min_count);
    return c;
  });
  lines = lines.filter((a) => (lines_seen[a] || 0) === min_count);
  assert(lines.length);
  let r = ar(lines);
  lines_seen[r] = (lines_seen[r] || 0) + 1;
  return r;
}

function tierFromFloor(): number {
  let floor_id = crawlerGameState().floor_id;
  if (floor_id === 15) {
    return 2;
  } else if (floor_id === 13 || floor_id === 14) {
    return 1;
  }
  return 0;
}

let need_bamf: boolean;
let bamf_state: {
  hero: Hero;
  hero_idx: number;
  line: string;
  summons: [string, string];
  replacements: [Hero, Hero];
  start: number;
  played_upgrade_sound: boolean;
} | null = null;

const placeholder_hero = { dead: true, tier: 0 } as Hero;

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
  if (ent_heroes.length === 0) {
    ent_heroes = [placeholder_hero];
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
        let dead_names: string[] = [];
        let heroes_temp = ent_heroes.filter((a) => {
          if (a.dead) {
            dead_names.push(a.name);
            return false;
          } else {
            return true;
          }
        });
        let levels: [number, number] = hero.levels ? hero.levels.slice(0) as [number, number] : [0, 0];
        let dead_tier = hero.tier;
        if (dead_tier < 2 && levels[0] === 2 && levels[1] === 2) {
          dead_tier++;
          levels = [0, 0];
        }
        let tier = max(tierFromFloor(), dead_tier, isBootstrap() ? 1 : 0);
        let h1 = randomHero(ii, tier, heroes_temp, heroes_temp.length, isBootstrap(), dead_names);
        if (hero.levels && h1.tier === hero.tier) {
          h1.levels = levels;
        }
        heroes_temp.push(h1);
        let h2 = randomHero(ii, tier, heroes_temp, heroes_temp.length, isBootstrap(), dead_names);
        if (hero.levels && h2.tier === hero.tier) {
          h2.levels = levels;
        }
        bamf_state = {
          hero_idx: ii,
          hero,
          line: randomLine(hero.gender),
          summons: s,
          replacements: [h1, h2],
          start: 0,
          played_upgrade_sound: false,
        };
      }
      break;
    }
  }
}

export function bamfReset(): void {
  need_bamf = false;
  bamf_state = null;
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

export function bamfAddRandom(): void {
  let ent_heroes = myEnt().data.heroes;
  let h1 = randomHero(ent_heroes.length, 0, ent_heroes, 1, false, []);
  ent_heroes.push(h1);
}

export function bamfActive(): boolean {
  return need_bamf;
}

const PAD = 8;
export function bamfTick(): boolean {
  if (!need_bamf) {
    return false;
  }
  let x0 = VIEWPORT_X0;
  let y0 = VIEWPORT_Y0;
  let w = render_width;
  let h = game_height - PAD - y0;
  let z = Z.BAMF;
  let panel_param = {
    x: x0,
    y: y0,
    z: z - 1,
    w,
    h,
    eat_clicks: false,
  };

  let x = x0 + PAD;
  w -= PAD * 2;
  let y = y0 + PAD;

  assert(bamf_state);
  bamf_state.start = bamf_state.start || getFrameTimestamp();
  let { hero, start } = bamf_state;
  let dt = getFrameTimestamp() - start;


  let upgrade_state = '';
  if (bamf_state.replacements[0].tier > hero.tier) {
    if (bamf_state.replacements[0].tier === 2) {
      upgrade_state = '[c=xp]MAX TIER[img=star][img=star][/c]';
    } else {
      upgrade_state = '[c=xp]TIER[img=star] UP[/c]';
    }
  }

  let alpha_death = 1;
  let alpha_choices = 0;
  let alpha_upgrade_state = 0;
  if (dt < 500) {
    alpha_death = dt/500;
  } else {
    if (upgrade_state) {
      if (dt < 1300) {
        alpha_upgrade_state = min(1, (dt - 500) / 800);
        if (!bamf_state.played_upgrade_sound) {
          playUISound('xp_gain');
          bamf_state.played_upgrade_sound = true;
        }
      }
      if (dt > 1000) {
        alpha_choices = min(1, (dt - 1000) / 500);
      }
    } else {
      alpha_choices = min(1, (dt - 500) / 500);
    }
  }

  //y += 24;
  if (hero === placeholder_hero) {
    markdownAuto({
      font_style: style_label,
      x, y, z, w, h: 104 - y,
      align: ALIGN.HCENTER | ALIGN.HWRAP | ALIGN.VCENTER,
      text: `
Drifting through deep space is an [c=2]ancient shipwreck[/c] said to be bigger on the inside than it is on the outside.

Rumor has it that deep within this ruin lie answers to questions about the meaning of life and one's place in the universe.

[c=2]WHO VENTURES NEXT[/c] into the ruined ship, seeking fortune, glory, philosophical answers, or a cure for boredom?
`,
      alpha: alpha_death,
    });
  } else {
    markdownAuto({
      font_style: style_death,
      x, y, z, w, h: 104 - y,
      align: ALIGN.HCENTER | ALIGN.HWRAP | ALIGN.VCENTER,
      text: bamf_state.line.replace('NAME', `[c=2]${hero.name}[/c]`).replace('has died',
        hero.left ? 'has [c=3]decided to remain here[/c]' : 'has [c=1]died[/c]'),
      alpha: alpha_death,
    });
  }

  let picked = -1;
  y = 102;

  if (alpha_upgrade_state) {
    suppressNewDOMElemWarnings();
    markdownAuto({
      x: x - 100,
      y,
      z: z + 10,
      w: w + 200,
      h: y0 + h - y - PAD,
      align: ALIGN.HVCENTER,
      text_height: 16 + alpha_upgrade_state * 30,
      text: upgrade_state,
      alpha: easeOut(1 - alpha_upgrade_state, 2),
    });
  }

  if (alpha_choices) {
    y += markdownAuto({
      font_style: style_label,
      x, y, z, w,
      align: ALIGN.HCENTER | ALIGN.HWRAP,
      text: 'You activate the [c=2]Bamf[/c] device and call in...' +
        (upgrade_state ? `\n(${upgrade_state})` : ''),
      alpha: min(alpha_choices, hero === placeholder_hero ? 0 : 1),
    }).h + PAD;


    let hero_x = x + floor((w - HERO_W)/2);
    if (alpha_choices < 1) {
      drawRect(hero_x, y, hero_x + HERO_W, y + (HERO_H + uiButtonHeight()) * 2 + PAD, Z.BAMFFADE,
        [32/255, 27/255, 37/255, 1 - alpha_choices]);
    }
    for (let ii = 0; ii < bamf_state.replacements.length; ++ii) {
      if (inputClick({
        x: hero_x, y, w: HERO_W, h: HERO_H,
        button: 0,
      })) {
        picked = ii;
        playUISound('button_click');
      }
      drawHero(bamf_state.hero_idx, hero_x, y, z, bamf_state.replacements[ii]);
      y += HERO_H;
      if (buttonText({
        x: hero_x, y, z,
        w: HERO_W,
        text: bamf_state.summons[ii].replace('NAME', bamf_state.replacements[ii].name),
      })) {
        picked = ii;
      }
      y += uiButtonHeight() + PAD;
    }

    if (!isBootstrap()) {
      showAbilityTooltip(28, y - HERO_H * 2 - uiButtonHeight(), false);
    }
  }

  if (picked !== -1) {
    let me = myEnt();
    assert(me);
    let ent_heroes = me.data.heroes;
    ent_heroes[bamf_state.hero_idx] = bamf_state.replacements[picked];
    bamf_state = null;
  }

  panel(panel_param);

  bamfCheck();
  return need_bamf;
}
