import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  CrawlerScriptWhen,
  crawlerScriptRegisterEvent,
} from '../common/crawler_script';
import { CrawlerCell } from '../common/crawler_state';
import { bamfAddRandom } from './bamf';
import { crawlerEntFactory } from './crawler_entity_client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dialog, dialogPush } from './dialog_system';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave, myEnt } from './play';
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

export function onetimeEvent(query_only?: boolean): boolean {
  let me = myEnt();
  let events_done = me.data.events_done = me.data.events_done || {};
  let pos_key = me.data.pos.slice(0, 2).join(',');
  if (events_done[pos_key]) {
    return false;
  }
  if (!query_only) {
    events_done[pos_key] = true;
  }
  return true;
}

export function jamTraitsReset(): void {
  last_solitude = null;
}

export function jamTraitsStartup(): void {
  let ent_factory = crawlerEntFactory<Entity>();
  ent_factory.registerTrait<StatsData, undefined>('stats_default', {
    default_opts: {
      hp: 1,
      encounter: 'demo',
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
