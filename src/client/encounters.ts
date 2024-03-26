import { TSMap } from 'glov/common/types';

export type Encounter = {
  enemies: string[];
};

export enum AttackType {
  FRONT,
  BACK,
  ALL,
  SHIELD_SELF,
  SHIELD_ALL,
  POISON,
  HEAL,
  HEAL_ALL,
  // SHIELD_BREAK,
  // SANITY,
}

const icons = require('./img/icons');
export const AttackTypeToFrameHeroes: Record<AttackType, number> = {
  [AttackType.FRONT]: icons.FRAME_ATTACK_FRONT,
  [AttackType.BACK]: icons.FRAME_ATTACK_BACK,
  [AttackType.ALL]: icons.FRAME_ATTACK_ALL,
  [AttackType.SHIELD_SELF]: icons.FRAME_SHIELD,
  [AttackType.SHIELD_ALL]: icons.FRAME_SHIELD_ALL,
  [AttackType.POISON]: icons.FRAME_POISON,
  [AttackType.HEAL]: icons.FRAME_HEAL,
  [AttackType.HEAL_ALL]: icons.FRAME_HEAL_ALL,
};
export const AttackTypeToFrameEnemies: Record<AttackType, number> = {
  ...AttackTypeToFrameHeroes,
  [AttackType.FRONT]: icons.FRAME_ATTACK_FRONT_ENEMY,
};

export type AttackDef = {
  type: AttackType;
  amount: number;
};

export type EnemyDef = {
  hp: number;
  shield: number;
  effects: AttackDef[];
  enttype: string;
};

export const ENEMIES: TSMap<EnemyDef> = {
  sponge1: {
    enttype: 'enemy0', // flayer
    hp: 7,
    shield: 0,
    effects: [{
      type: AttackType.FRONT,
      amount: 1,
    }],
  },
  damage1: {
    enttype: 'enemy1', // glowbug
    hp: 4,
    shield: 0,
    effects: [{
      type: AttackType.FRONT,
      amount: 4,
    }],
  },
  balanced1: {
    enttype: 'enemy2', // angrystar
    hp: 5,
    shield: 0,
    effects: [{
      type: AttackType.FRONT,
      amount: 3,
    }],
  },
  aoe1: {
    enttype: 'enemy3', // bottomcrawler
    hp: 4,
    shield: 0,
    effects: [{
      type: AttackType.ALL,
      amount: 1,
    }],
  },
};

export const ENCOUNTERS: TSMap<Encounter> = {
  demo: {
    enemies: ['balanced1', 'sponge1', 'damage1'],
  },
  test1: {
    enemies: ['damage1', 'damage1', 'aoe1'],
  },
  test2: {
    enemies: ['sponge1', 'balanced1', 'damage1'],
  },
  test3: {
    enemies: ['sponge1', 'balanced1', 'aoe1'],
  },
  test4: {
    enemies: ['damage1', 'balanced1', 'balanced1'],
  },
};
