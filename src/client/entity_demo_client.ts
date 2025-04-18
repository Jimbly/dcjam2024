import { getFrameTimestamp } from 'glov/client/engine';
import { EntityBaseClient } from 'glov/client/entity_base_client';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ActionDataAssignments,
} from 'glov/common/entity_base_common';
import {
  DataObject,
  NetErrorCallback,
  TSMap,
} from 'glov/common/types.js';
import type { ROVec2 } from 'glov/common/vmath';
import { EntityCrawlerDataCommon, entSamePos } from '../common/crawler_entity_common';
import type { JSVec3 } from '../common/crawler_state';
import {
  crawlerEntClientDefaultDraw2D,
  crawlerEntClientDefaultOnDelete,
  crawlerEntityManager,
  EntityCrawlerClient,
  EntityDraw2DOpts,
  EntityDrawOpts,
  EntityOnDeleteSubParam,
  Floater,
} from './crawler_entity_client';
import type {
  AttackDef,
} from './encounters';
import { GENDER } from './names';

const { random } = Math;

type Entity = EntityDemoClient;

export function entitiesAt(cem: ClientEntityManagerInterface<Entity>,
  pos: [number, number] | ROVec2,
  floor_id: number,
  skip_fading_out:boolean
): Entity[] {
  return cem.entitiesFind((ent) => entSamePos(ent, pos) && ent.data.floor === floor_id, skip_fading_out);
}

export function entityManager(): ClientEntityManagerInterface<Entity> {
  return crawlerEntityManager() as ClientEntityManagerInterface<Entity>;
}

export type StatsData = {
  hp: number; // ignored
  encounter: string;
};

export type HeroClassTier = {
  hp: number;
  shield: number;
};

export type AbilityDef = {
  name: string;
  aggro: number;
  effects: AttackDef[];
  icon: string;
};

export type HeroClassDef = {
  tier: [HeroClassTier, HeroClassTier, HeroClassTier];
  abilities: [string, string];
  faces: [GENDER, string][];
};

export type Hero = {
  class_id: string;
  tier: number;
  levels: [number, number];
  name: string;
  gender: GENDER;
  face?: number;
  dead?: boolean;
  left?: boolean;
};


export type EntityDataClient = {
  type: string;
  pos: JSVec3;
  state: string;
  floor: number;
  stats: StatsData;
  // Player:
  xp?: number;
  sanity: number;
  sanity_max: number;
  heroes: Hero[];
  events_done?: TSMap<true>;
  score_won?: boolean;
  score_xp_gain?: number;
  score_sanity_loss?: number;
  score_max_floor?: number;
  cheat?: boolean;
} & EntityCrawlerDataCommon;


export class EntityDemoClient extends EntityBaseClient implements EntityCrawlerClient {
  declare entity_manager: ClientEntityManagerInterface<Entity>;
  declare data: EntityDataClient;

  floaters: Floater[];
  delete_reason?: string;

  declare onDelete: (reason: string) => number;
  declare draw2D: (param: EntityDraw2DOpts) => void;
  declare draw?: (param: EntityDrawOpts) => void;
  declare onDeleteSub?: (param: EntityOnDeleteSubParam) => void;
  declare triggerAnimation?: (anim: string) => void;

  // On prototype properties:
  declare type_id: string; // will be constant on the prototype
  declare do_split: boolean;
  declare is_player: boolean;
  declare is_enemy: boolean;
  declare blocks_player: boolean;
  declare ai_move_min_time: number;
  declare ai_move_rand_time: number;

  constructor(data_in: DataObject) {
    super(data_in);
    let data = this.data;

    if (!data.pos) {
      data.pos = [0,0,0];
    }
    while (data.pos.length < 3) {
      data.pos.push(0);
    }
    this.floaters = [];
    this.aiResetMoveTime(true);
  }
  applyAIUpdate(
    action_id: string,
    data_assignments: ActionDataAssignments,
    payload?: unknown,
    resp_func?: NetErrorCallback,
  ): void {
    this.actionSend({
      action_id,
      data_assignments,
      payload,
    }, resp_func);
  }
  aiLastUpdatedBySomeoneElse(): boolean {
    return false;
  }
  ai_next_move_time!: number;
  aiResetMoveTime(initial: boolean): void {
    this.ai_next_move_time = getFrameTimestamp() + this.ai_move_min_time + random() * this.ai_move_rand_time;
  }

  isAlive(ignore_sanity?: boolean): boolean {
    let sane = this.data.sanity === undefined ? true : this.data.sanity > 0;
    if (!sane && !ignore_sanity) {
      return false;
    }
    let { heroes } = this.data;
    if (!heroes) {
      return true;
    }
    if (heroes.length < 6) {
      return true; // bootstrapping
    }
    for (let ii = 0; ii < heroes.length; ++ii) {
      if (!heroes[ii].dead) {
        return true;
      }
    }
    return false;
  }

  isEnemy(): boolean {
    return this.is_enemy;
  }
  isPlayer(): boolean {
    return this.is_player;
  }

  onCreate(is_initial: boolean): number {
    return is_initial ? 0 : 250;
  }
}
EntityDemoClient.prototype.draw2D = crawlerEntClientDefaultDraw2D;
EntityDemoClient.prototype.onDelete = crawlerEntClientDefaultOnDelete;
EntityDemoClient.prototype.do_split = true;
EntityDemoClient.prototype.ai_move_min_time = 500;
EntityDemoClient.prototype.ai_move_rand_time = 500;
