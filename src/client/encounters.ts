import { TSMap } from 'glov/common/types';

export type Encounter = {
  enemies: string[];
};

export enum AttackType {
  FRONT,
  BACK,
  ALL,
}

export type EnemyDef = {
  hp: number;
  shield: number;
  damage: number;
  attack_type: AttackType;
  tex: string;
};

export const ENEMIES: TSMap<EnemyDef> = {
  eye: {
    hp: 15,
    damage: 5,
    shield: 0,
    attack_type: AttackType.FRONT,
    tex: 'AngryStar',
  },
  blob: {
    hp: 12,
    damage: 2,
    shield: 0,
    attack_type: AttackType.ALL,
    tex: 'FlayerEvo4',
  },
};

export const ENCOUNTERS: TSMap<Encounter> = {
  demo: {
    enemies: ['eye', 'eye', 'blob'],
  },
};
