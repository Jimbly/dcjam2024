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
  front1: {
    tier: [{
      hp: 8,
      shield: 1,
    }, {
      hp: 9,
      shield: 2,
    }, {
      hp: 10,
      shield: 3,
    }],
    abilities: ['attack_heavy', 'attack_light'],
    faces: ['catears'],
  },
  front2: {
    tier: [{
      hp: 8,
      shield: 1,
    }, {
      hp: 9,
      shield: 2,
    }, {
      hp: 10,
      shield: 3,
    }],
    abilities: ['shield_aggro', 'shield_slow'],
    faces: ['catears'],
  },
  mid1: {
    tier: [{
      hp: 6,
      shield: 0,
    }, {
      hp: 7,
      shield: 0,
    }, {
      hp: 8,
      shield: 1,
    }],
    abilities: ['attack_light', 'poison'],
    faces: ['catears'],
  },
  mid2: {
    tier: [{
      hp: 6,
      shield: 0,
    }, {
      hp: 7,
      shield: 0,
    }, {
      hp: 8,
      shield: 1,
    }],
    abilities: ['area_light', 'area_med'],
    faces: ['catears'],
  },
  back1: {
    tier: [{
      hp: 5,
      shield: 0,
    }, {
      hp: 5,
      shield: 1,
    }, {
      hp: 6,
      shield: 1,
    }],
    abilities: ['heal_med', 'heal_light'],
    faces: ['catears'],
  },
  back2: {
    tier: [{
      hp: 5,
      shield: 0,
    }, {
      hp: 5,
      shield: 1,
    }, {
      hp: 6,
      shield: 1,
    }],
    abilities: ['shield_other1', 'shield_other2'],
    faces: ['catears'],
  },
};

export const ABILITIES: TSMap<AbilityDef> = {
  attack_light: {
    aggro: 2,
    effects: [{
      type: AttackType.FRONT,
      amount: 2,
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
  shield_aggro: {
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_SELF,
      amount: 2,
    }],
    icon: 'ability_demo',
  },
  shield_slow: {
    aggro: 1,
    effects: [{
      type: AttackType.SHIELD_SELF,
      amount: 3,
    }],
    icon: 'ability_demo',
  },
  poison: {
    // TODO!
    aggro: 1,
    effects: [{
      type: AttackType.SHIELD_SELF,
      amount: 3,
    }],
    icon: 'ability_demo',
  },
  area_light: {
    aggro: 2,
    effects: [{
      type: AttackType.ALL,
      amount: 1,
    }],
    icon: 'ability_demo',
  },
  area_med: {
    aggro: 3,
    effects: [{
      type: AttackType.ALL,
      amount: 2,
    }],
    icon: 'ability_demo',
  },
  heal_light: {
    // TODO!
    aggro: 2,
    effects: [{
      type: AttackType.ALL,
      amount: 1,
    }],
    icon: 'ability_demo',
  },
  heal_med: {
    // TODO!
    aggro: 3,
    effects: [{
      type: AttackType.ALL,
      amount: 2,
    }],
    icon: 'ability_demo',
  },
  shield_other1: {
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_ALL,
      amount: 1,
    }],
    icon: 'ability_demo',
  },
  shield_other2: {
    aggro: 2,
    effects: [{
      type: AttackType.SHIELD_ALL,
      amount: 2,
    }],
    icon: 'ability_demo',
  },
};
