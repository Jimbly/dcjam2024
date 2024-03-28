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
export const AttackTypeToMDHeroes: Record<AttackType, string> = {
  [AttackType.FRONT]: '[img=attack_front]',
  [AttackType.BACK]: '[img=attack_back]',
  [AttackType.ALL]: '[img=attack_all]',
  [AttackType.SHIELD_SELF]: '[img=shield]',
  [AttackType.SHIELD_ALL]: '[img=shield_all]',
  [AttackType.POISON]: '[img=poison]',
  [AttackType.HEAL]: '[img=heal]',
  [AttackType.HEAL_ALL]: '[img=heal_all]',
};
export const AttackTypeToFrameEnemies: Record<AttackType, number> = {
  ...AttackTypeToFrameHeroes,
  [AttackType.FRONT]: icons.FRAME_ATTACK_FRONT_ENEMY,
};

export type AttackDef = {
  type: AttackType;
  base_amount: number;
};

export type EnemyDef = {
  name: string;
  hp: number;
  shield: number;
  effects: AttackDef[];
  enttype: string;
  tier: number;
  level: number;
};

export const ENEMIES: TSMap<EnemyDef> = {
  sponge1: { // L1-sponge-FlayerEvo1
    name: 'Flayer',
    enttype: 'enemy0',
    hp: 7,
    shield: 0,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 1,
    }],
  },
  damage1: { // L1-damage-GlowBug4
    name: 'Glow Bug',
    enttype: 'enemy1',
    hp: 4,
    shield: 0,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 4,
    }],
  },
  balanced1: { // L1-balanced-AngryStar
    name: 'Angry Star',
    enttype: 'enemy2',
    hp: 5,
    shield: 0,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 3,
    }],
  },
  aoe1: { // L1-aoe-NeonWiggler
    name: 'Neon Wiggler',
    enttype: 'enemy3',
    hp: 4,
    shield: 0,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.ALL,
      base_amount: 1,
    }],
  },
  boss1: { // L1-boss-HexBot
    name: 'Hex Bot',
    enttype: 'l1boss',
    hp: 17,
    shield: 1,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 3,
    }],
  },


};

export const ENCOUNTERS: TSMap<Encounter> = {
  l1sponge: {
    enemies: ['sponge1', 'balanced1', 'damage1'],
  },
  l1damage: {
    enemies: ['damage1', 'damage1', 'aoe1'],
  },
  l1aoe: {
    enemies: ['sponge1', 'balanced1', 'aoe1'],
  },
  l1balanced: {
    enemies: ['damage1', 'balanced1', 'balanced1'],
  },
  l1boss: {
    enemies: ['boss1', 'aoe1'],
  },
};
