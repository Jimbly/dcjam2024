import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  CrawlerScriptWhen,
  crawlerScriptRegisterEvent,
  crawlerScriptRegisterFunc,
} from '../common/crawler_script';
import { CrawlerCell, DirTypeOrCell } from '../common/crawler_state';
import { bamfAddRandom } from './bamf';
import { crawlerEntFactory } from './crawler_entity_client';
import { crawlerScriptAPI } from './crawler_play';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dialog, dialogPush } from './dialog_system';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, myEnt, myEntOptional } from './play';
import { statusPush } from './status';

export function statusShort(text: string): void {
  statusPush(text).counter = 3000;
}

const JOIN_MSGS = `
NAME is looking for adventure.
NAME just wants to prove they're awesome.
NAME silently joins your group.
From planet Eart, NAME joins you.
NAME is ready to party!
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
    } else if (last_solitude !== is_solitude) {
      last_solitude = is_solitude;
      //autosave();
    }
    autosave();
  },
});

crawlerScriptRegisterEvent({
  key: 'party_add',
  when: CrawlerScriptWhen.POST,
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
      });
    }
  },
});

function onetimeEventForPos(x: number, y: number, query_only?: boolean): boolean {
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
