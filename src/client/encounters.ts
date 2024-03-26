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
  [AttackType.BACK]: icons.FRAME_ATTACK_FRONT,
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
  eye: {
    enttype: 'enemy2',
    hp: 5,
    shield: 0,
    effects: [{
      type: AttackType.FRONT,
      amount: 3,
    }],
  },
  blob: {
    enttype: 'enemy0',
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
    enemies: ['eye', 'eye', 'blob'],
  },
};
