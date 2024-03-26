import { clone } from 'glov/common/util';
import {
  CrawlerScriptAPI,
  CrawlerScriptWhen,
  crawlerScriptRegisterEvent,
} from '../common/crawler_script';
import { CrawlerCell } from '../common/crawler_state';
import { crawlerEntFactory } from './crawler_entity_client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { dialog } from './dialog_system';
import { EntityDemoClient, StatsData } from './entity_demo_client';
import { autosave } from './play';
import { statusPush } from './status';

export function statusShort(text: string): void {
  statusPush(text).counter = 3000;
}

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
      autosave();
    }
  },
});

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
