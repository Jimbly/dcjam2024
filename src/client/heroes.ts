import { TSMap } from 'glov/common/types';
import { AttackType } from './encounters';
import { AbilityDef, HeroClassDef } from './entity_demo_client';


export const DICE_SLOTS = [
  [1, 2],
  [1, 2],
  [3, 4],
  [3, 4],
  [5, 6],
  [5, 6],
];

export const CLASSES: TSMap<HeroClassDef> = {
  demo: {
    tier: [{
      hp: 6,
      shield: 0,
    }, {
      hp: 7,
      shield: 1,
    }, {
      hp: 8,
      shield: 2,
    }],
    abilities: ['attack_light', 'attack_heavy'],
    faces: ['catears'],
  },
};

export const ABILITIES: TSMap<AbilityDef> = {
  attack_light: {
    aggro: 1,
    effects: [{
      type: AttackType.FRONT,
      amount: 2,
    }, {
      type: AttackType.SHIELD_SELF,
      amount: 1,
    }],
    icon: 'ability_gun1',
  },
  attack_heavy: {
    aggro: 3,
    effects: [{
      type: AttackType.FRONT,
      amount: 3,
    }],
    icon: 'ability_gun2',
  },
};
