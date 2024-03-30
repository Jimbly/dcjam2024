import assert from 'assert';
import { DataObject, TSMap } from 'glov/common/types';
import { clone } from 'glov/common/util';

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
  sound?: string;
};

const SFX: TSMap<string> = {
  armor1: 'monster_orange_attack_2', // doesn't exist
  aoe1: 'monster_attack_all',
  balanced1: 'monster_orange_attack_2',
  boss1: 'monster_orange_attack_1',
  damage1: 'monster_pink_attack_1',
  sponge1: 'monster_pink_attack_2',
  aoe2: 'monster_attack_all',
  armor2: 'monster_orange_attack_2',
  balanced2: 'monster_orange_attack_2',
  boss2: 'monster_orange_attack_1',
  damage2: 'monster_pink_attack_1',
  sponge2: 'monster_pink_attack_2',
  aoe3: 'monster_attack_all',
  armor3: 'monster_orange_attack_2',
  balanced3: 'monster_orange_attack_2',
  boss3: 'monster_orange_attack_1',
  damage3: 'monster_pink_attack_1',
  sponge3: 'monster_pink_attack_2',
  aoe4: 'monster_attack_all',
  armor4: 'monster_orange_attack_2',
  balanced4: 'monster_orange_attack_2',
  boss4: 'monster_orange_attack_1',
  damage4: 'monster_pink_attack_1',
  sponge4: 'monster_pink_attack_2',
  aoe5: 'monster_attack_all',
  armor5: 'monster_orange_attack_2',
  balanced5: 'monster_orange_attack_2',
  boss5: 'monster_orange_attack_1',
  damage5: 'monster_pink_attack_1',
  sponge5: 'monster_pink_attack_2',
  boss6: 'monster_orange_attack_1',
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
    sound: 'monster_attack_all',
    hp: 4,
    shield: 0,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.ALL,
      base_amount: 1,
    }],
  },
  armor1: { // not used, just for templating
    name: 'ArmorAuto',
    enttype: 'enemy2',
    hp: 5,
    shield: 1,
    tier: 0,
    level: 0,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 2,
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

  boss6: { // ?
    name: 'The End',
    enttype: 'l6boss',
    hp: 42,
    shield: 5,
    tier: 2,
    level: 2,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 4,
    }],
  },
};

const MAPPING = [{
  tier: 0,
  level: 2,
}, {
  tier: 1,
  level: 1,
}, {
  tier: 1,
  level: 2,
}, {
  tier: 2,
  level: 1,
}];
const OVERRIDE: TSMap<DataObject> = {
  aoe2: {
    damage: 0, // - 1
  },
  aoe3: {
    damage: 0, // - 1
  },
  armor3: {
    hp: 3,
    shield: 3,
  },
  aoe4: {
    damage: 0, // - 1
  },
  armor4: {
    hp: 3,
    shield: 4,
  },
  damage4: {
    hp: 6,
    damage: 5, // +1 = 8
  },
  sponge4: {
    hp: 12,
  },
  balanced4: {
    damage: 4, // +1 = 7
  },
  damage5: {
    damage: 7,
  },
  balanced5: {
    damage: 5,
  },
  sponge5: {
    hp: 15,
    damage: 3,
  },
  armor5: {
    hp: 4,
    shield: 4,
    damage: 3,
  },
  boss5: {
    hp: 99,
    damage: 4,
    shield: 0,
  },
};
const NAMES: TSMap<string> = {
  aoe2: 'Creep Eye',
  balanced2: 'Cyclops Worm',
  boss2: 'Skitter Bot',
  damage2: 'Wild Growth',
  armor2: 'Centislide',
  sponge2: 'Flayer',
  aoe3: 'Sickum',
  balanced3: 'Smoke Eye',
  boss3: 'Metal Crab',
  damage3: 'GlowBug',
  armor3: 'BeeOhm',
  sponge3: 'Flayer',
  aoe4: 'Green Beholder',
  balanced4: 'Chaos Orb',
  boss4: 'Alien Explorer',
  damage4: 'GlowBug',
  armor4: 'Shell Shy',
  sponge4: 'Flayer',
  aoe5: 'Virus',
  balanced5: 'Spider',
  boss5: 'Giant Garbage Can',
  damage5: 'Snake',
  armor5: 'Turtle',
  sponge5: 'Squirrel',
  boss6: 'Octopot',
};
Object.keys(ENEMIES).forEach((enemy_id: string) => {
  if (!enemy_id.endsWith('1')) {
    return;
  }
  for (let floor = 2; floor <= 5; ++floor) {
    let new_name = `${enemy_id.slice(0, -1)}${floor}`;
    if (ENEMIES[new_name]) {
      continue;
    }
    let new_enemy = clone(ENEMIES[enemy_id]!);
    let name = NAMES[new_name];
    assert(name, new_name);
    new_enemy.name = name;
    new_enemy.hp += floor - 1;
    new_enemy.shield *= floor;
    new_enemy.shield += [0,0,0,1,1,1][floor];
    new_enemy.enttype = `l${floor}${enemy_id.slice(0, -1)}`;
    let over = OVERRIDE[new_name];
    if (over) {
      for (let key in over) {
        if (key === 'damage') {
          // console.log(`${new_name}.${key}: ${new_enemy.effects[0].base_amount} -> ${over[key]}`);
          new_enemy.effects[0].base_amount = over[key] as number;
        } else {
          // console.log(`${new_name}.${key}: ${(new_enemy as DataObject)[key]} -> ${over[key]}`);
          (new_enemy as DataObject)[key] = over[key];
        }
      }
    }
    new_enemy.level = MAPPING[floor-2].level;
    new_enemy.tier = MAPPING[floor-2].tier;
    ENEMIES[new_name] = new_enemy;
  }
});

Object.keys(ENEMIES).forEach((enemy_id: string) => {
  let enemy_def = ENEMIES[enemy_id]!;
  assert(SFX[enemy_id], enemy_id);
  enemy_def.sound = SFX[enemy_id];
});

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

  l2armor: {
    enemies: ['armor2', 'armor2', 'balanced2'],
  },
  l2sponge: {
    enemies: ['sponge2', 'balanced2', 'damage2'],
  },
  l2damage: {
    enemies: ['damage2', 'damage2', 'aoe2'],
  },
  l2aoe: {
    enemies: ['balanced2', 'sponge2', 'aoe2'],
  },
  l2balanced: {
    enemies: ['damage2', 'balanced2', 'balanced2'],
  },
  l2boss: {
    enemies: ['damage2', 'damage2', 'boss2'],
  },

  l3armor: {
    enemies: ['armor3', 'armor3', 'balanced3'],
  },
  l3sponge: {
    enemies: ['sponge3', 'balanced3', 'damage3'],
  },
  l3damage: {
    enemies: ['damage3', 'damage3', 'aoe3'],
  },
  l3aoe: {
    enemies: ['balanced3', 'sponge3', 'aoe3'],
  },
  l3balanced: {
    enemies: ['damage3', 'balanced3', 'balanced3'],
  },
  l3boss: {
    enemies: ['balanced3', 'boss3', 'balanced3'],
  },

  l4armor: {
    enemies: ['balanced4', 'armor4', 'armor4'],
  },
  l4sponge: {
    enemies: ['sponge4', 'damage4', 'sponge4'],
  },
  l4damage: {
    enemies: ['damage4', 'damage4', 'aoe4'],
  },
  l4aoe: {
    enemies: ['balanced4', 'sponge4', 'aoe4'],
  },
  l4balanced: {
    enemies: ['damage4', 'balanced4', 'balanced4'],
  },
  l4boss: {
    enemies: ['sponge4', 'boss4', 'sponge4'],
  },

  l5armor: {
    enemies: ['balanced5', 'armor5', 'armor5'],
  },
  l5sponge: {
    enemies: ['sponge5', 'damage5', 'sponge5'],
  },
  l5damage: {
    enemies: ['damage5', 'damage5', 'aoe5'],
  },
  l5aoe: {
    enemies: ['balanced5', 'sponge5', 'aoe5'],
  },
  l5balanced: {
    enemies: ['damage5', 'balanced5', 'balanced5'],
  },
  l5boss: {
    enemies: ['armor5', 'boss5', 'aoe5'],
  },

  l6boss: {
    enemies: ['boss6'],
  },
};
