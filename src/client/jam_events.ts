import { clamp, clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  crawlerScriptRegisterEvent,
  crawlerScriptRegisterFunc,
  CrawlerScriptWhen,
} from '../common/crawler_script';
import { CrawlerCell, DirTypeOrCell } from '../common/crawler_state';
import { bamfAddRandom, bamfCheck } from './bamf';
import { crawlerEntFactory } from './crawler_entity_client';
import { crawlerScriptAPI } from './crawler_play';
import { doSolitudeLeave } from './dialog_data';
import { dialog, dialogPush } from './dialog_system';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, myEnt, myEntOptional } from './play';
import { statusPush } from './status';

const { random } = Math;

export function statusShort(text: string): void {
  statusPush(text).counter = 3000;
}

const JOIN_MSGS = `
NAME wishes to join you in search of answers to deep questions.
NAME just wants to prove they're awesome.
From planet Eart, NAME joins you.
NAME just hopes to forget everything that's come before.
NAME is looking for adventure.
NAME has lost it all and hopes to gain it all back.
NAME silently joins your group.
NAME is ready to party!
NAME is looking for a thrill.
`.trim().split('\n');

type Entity = EntityDemoClient;

let last_solitude: boolean | null = null;

crawlerScriptRegisterEvent({
  key: 'solitude',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let is_solitude = cell.desc.id.startsWith('solitude');
    if (last_solitude === null) {
      last_solitude = is_solitude;
      let me = myEntOptional();
      let events_done = me ? me.data.events_done = me.data.events_done || {} : {};
      let key = `solitude_upgrade_${api.getFloor()}`;
      if (events_done[key]) {
        dialog('sign', (
          'Slumped against the tree, NAME seems to be asleep. You think it best' +
          ' not to disturb them.'
        ).replace('NAME', `[c=3]${events_done[key]}[/c]`));
      }
    } else {
      if (myEnt().data.sanity_max - myEnt().data.sanity >= 20) {
        dialog('party', 'We should rest before leaving here.');
      }
      if (last_solitude !== is_solitude) {
        last_solitude = is_solitude;
        //autosave();
      }
    }
    autosave();

  },
});

crawlerScriptRegisterEvent({
  key: 'autosave',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    autosave();
  },
});

crawlerScriptRegisterEvent({
  key: 'party_add',
  when: CrawlerScriptWhen.PRE,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let idx = Number(param) || 6;
    if (myEnt().data.heroes.length < idx) {
      bamfAddRandom();
      let tail_idx = myEnt().data.heroes.length - 1;
      let tail = myEnt().data.heroes[tail_idx];
      dialogPush({
        name: '',
        text: JOIN_MSGS[tail_idx-1].replace('NAME', tail.name),
        transient: true,
        transient_long: true,
      });
    }
  },
});

export function onetimeEventForPos(x: number, y: number, query_only?: boolean): boolean {
  let me = myEntOptional();
  let events_done = me ? me.data.events_done = me.data.events_done || {} : {};
  let pos_key = `${crawlerScriptAPI().getFloor()},${x},${y}`;
  if (events_done[pos_key]) {
    return false;
  }
  if (!query_only) {
    events_done[pos_key] = true;
  }
  return true;
}

export function onetimeEvent(query_only?: boolean): boolean {
  let pos = crawlerScriptAPI().pos;
  return onetimeEventForPos(pos[0], pos[1], query_only);
}

let last_upgrade = Date.now();
crawlerScriptRegisterEvent({
  key: 'solitude_upgrade',
  when: CrawlerScriptWhen.POST,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let { heroes, xp } = myEnt().data;
    xp = xp || 0;
    let candidate = -1;
    let num_at_tier = [0,0,0];
    for (let ii = 1; ii < heroes.length; ++ii) {
      num_at_tier[heroes[ii].tier]++;
    }
    num_at_tier[1] += num_at_tier[2];
    for (let ii = 1; ii < heroes.length; ++ii) {
      let hero = heroes[ii];
      if (hero.tier !== 2 && hero.levels[0] === 2 && hero.levels[1] === 2) {
        if (num_at_tier[hero.tier+1] < 2 && (hero.tier === 0 && xp < 6 ||
          hero.tier === 1 && xp < 10)
        ) {
          // not enough xp to skill them up afterwards
          continue;
        }
        if (candidate === -1 || random() < 0.5) {
          candidate = ii;
        }
      }
    }
    let me = myEntOptional();
    let events_done = me ? me.data.events_done = me.data.events_done || {} : {};
    let key = `solitude_upgrade_${api.getFloor()}`;
    if (candidate !== -1 && (!events_done[key] || Date.now() - last_upgrade > 15*1000 || true)) {
      let hero = heroes[candidate];
      hero.left = true;
      hero.dead = true;
      if (!events_done[key]) {
        events_done[key] = hero.name as unknown as true;
      }
      last_upgrade = Date.now();
      doSolitudeLeave(clamp(api.getFloor() - 21, 0, 4), hero);
      bamfCheck();
    }
  },
});

crawlerScriptRegisterFunc('ONETIMEDONE', function (
  script_api: CrawlerScriptAPI, cell: CrawlerCell, dir: DirTypeOrCell
): boolean {
  return !onetimeEventForPos(cell.x, cell.y, true);
});

export function jamTraitsReset(): void {
  last_solitude = null;
}

export function jamTraitsStartup(): void {
  let ent_factory = crawlerEntFactory<Entity>();
  ent_factory.registerTrait<StatsData, undefined>('stats_default', {
    default_opts: {
      hp: 1,
      encounter: 'l1sponge',
    },
    alloc_state: function (opts: StatsData, ent: Entity) {
      if (!ent.data.stats) {
        ent.data.stats = clone(opts);
      }
      return undefined;
    }
  });

  // ent_factory.extendTrait<DrawableSpriteOpts, DrawableSpriteState>('drawable_sprite', {
  //   default_opts: {
  //     hybrid: true,
  //   }
  // });

  // ent_factory.extendTrait('enemy', {
  //   properties: {
  //     respawns: true,
  //   },
  // });

  // ent_factory.extendTrait('patrol', {
  //   properties: {
  //     danger_dist: 2,
  //     respawns: false,
  //   },
  // });
}
