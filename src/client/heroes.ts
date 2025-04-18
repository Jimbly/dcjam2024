import assert from 'assert';
import { TSMap } from 'glov/common/types';
import { AttackDef, AttackType } from './encounters';
import { AbilityDef, Hero, HeroClassDef, HeroClassTier } from './entity_demo_client';
import { GENDER, NAMEPAIR, NAMES_BY_GENDER } from './names';

const { floor, random } = Math;

function randomName(gender: GENDER): NAMEPAIR {
  let v = floor(random() * NAMES_BY_GENDER[gender].length);
  return NAMES_BY_GENDER[gender][v];
}

export const DICE_SLOTS = [
  [1, 2],
  [1, 2],
  [3, 4],
  [3, 4],
  [5, 6],
  [5, 6],
];

const front_tier_data: [HeroClassTier, HeroClassTier, HeroClassTier] = [{
  hp: 8,
  shield: 1,
}, {
  hp: 10,
  shield: 3,
}, {
  hp: 12,
  shield: 4,
}];
const mid_tier_data: [HeroClassTier, HeroClassTier, HeroClassTier] = [{
  hp: 6,
  shield: 0,
}, {
  hp: 8,
  shield: 1,
}, {
  hp: 10,
  shield: 2,
}];
const back_tier_data: [HeroClassTier, HeroClassTier, HeroClassTier] = [{
  hp: 5,
  shield: 0,
}, {
  hp: 6,
  shield: 1,
}, {
  hp: 7,
  shield: 2,
}];

export const CLASSES: TSMap<HeroClassDef> = {
  front1: {
    tier: front_tier_data,
    abilities: ['attack_heavy', 'attack_light'],
    faces: [['a', 'capedeagle'], ['a', 'nebulan2'], ['m', 'cyclops3']],
  },
  front2: {
    tier: front_tier_data,
    abilities: ['shield_aggro', 'shield_slow'],
    faces: [['m', 'yanfly'], ['m', 'redmonster']],
  },
  front3: {
    tier: front_tier_data,
    abilities: ['shield_slow', 'attack_lighter'],
    faces: [['a', 'steelslime'], ['m', 'ifrit']],
  },
  front4: {
    tier: front_tier_data,
    abilities: ['attack_poison_light', 'shield_aggro'],
    faces: [['m', 'sawserpent'], ['a', 'turtle2']],
  },

  mid1: {
    tier: mid_tier_data,
    abilities: ['attack_back', 'poison'],
    faces: [['m', 'thief'], ['a', 'slug'], ['m', 'sahagin']],
  },
  mid2: {
    tier: mid_tier_data,
    abilities: ['attack_area_med', 'attack_area_light'],
    faces: [['f', 'icelady'], ['a', 'phoenix'], ['a', 'mageslime2']],
  },
  mid3: {
    tier: mid_tier_data,
    abilities: ['attack_back_light', 'attack_back'],
    faces: [['a', 'treegolem'], ['f', 'spiderlady']],
  },
  mid4: {
    tier: mid_tier_data,
    abilities: ['poison', 'attack_area_med'],
    faces: [['m', 'littlesahagin'], ['a', 'brownkobold']],
  },

  back1: {
    tier: back_tier_data,
    abilities: ['heal_all_light', 'heal_med'],
    faces: [['a', 'healer2'], ['f', 'succubus'], ['a', 'nebulan']],
  },
  back2: {
    tier: back_tier_data,
    abilities: ['shield_other1', 'shield_other2'],
    faces: [['m', 'reddemonblue'], ['m', 'purpledemon']],
  },
  back3: {
    tier: back_tier_data,
    abilities: ['heal_shield_all', 'attack_area_light2'],
    faces: [['a', 'wizardblack'], ['a', 'stonegolem']],
  },
  back4: {
    tier: back_tier_data,
    abilities: ['shield_other2', 'heal_light'],
    faces: [['m', 'calm'], ['f', 'pinkslimev2']],
  },
};

const CLASS_BY_POS: string[][] = [[], [], [], [], [], []];
for (let key in CLASSES) {
  if (key.startsWith('front')) {
    CLASS_BY_POS[0].push(key);
    CLASS_BY_POS[1].push(key);
  } else if (key.startsWith('mid')) {
    CLASS_BY_POS[2].push(key);
    CLASS_BY_POS[3].push(key);
  } else if (key.startsWith('back')) {
    CLASS_BY_POS[4].push(key);
    CLASS_BY_POS[5].push(key);
  } else {
    assert(false);
  }
}

export const ABILITIES: TSMap<AbilityDef> = {
  attack_heavy: {
    name: 'Laser Pistol',
    aggro: 3,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 3,
    }],
    icon: 'ability_gun2',
  },
  attack_light: {
    name: 'Sidearm',
    aggro: 2,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 2,
    }],
    icon: 'ability_gun1',
  },

  shield_aggro: {
    name: 'Taunt',
    aggro: 4,
    effects: [{
      type: AttackType.SHIELD_SELF,
      base_amount: 2,
    }],
    icon: 'ability_shield2',
  },
  shield_slow: {
    name: 'Provoke',
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_SELF,
      base_amount: 3,
    }],
    icon: 'ability_shield1',
  },

  attack_lighter: {
    name: 'Lighter Attack',
    aggro: 1,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 2,
    }],
    icon: 'ability_gun1',
  },

  attack_poison_light: {
    name: 'Poisoned Blade',
    aggro: 3,
    effects: [{
      type: AttackType.FRONT,
      base_amount: 2,
    }, {
      type: AttackType.POISON,
      base_amount: 1,
    }],
    icon: 'ability_poison1',
  },

  attack_back: {
    name: 'Snipe',
    aggro: 3,
    effects: [{
      type: AttackType.BACK,
      base_amount: 4,
    }],
    icon: 'ability_back1',
  },
  poison: {
    name: 'Poisonous Curse',
    aggro: 1,
    effects: [{
      type: AttackType.POISON,
      base_amount: 1,
    }],
    icon: 'ability_poison2',
  },

  attack_area_light: {
    name: 'Rapid Assault',
    aggro: 2,
    effects: [{
      type: AttackType.ALL,
      base_amount: 1,
    }],
    icon: 'ability_ranged_all2',
  },
  attack_area_light2: {
    name: 'Rapid Assault',
    aggro: 3,
    effects: [{
      type: AttackType.ALL,
      base_amount: 1,
    }],
    icon: 'ability_ranged_all2',
  },
  attack_area_med: {
    name: 'Heavy Assault',
    aggro: 3,
    effects: [{
      type: AttackType.ALL,
      base_amount: 2,
    }],
    icon: 'ability_ranged_all1',
  },

  attack_back_light: {
    name: 'Distracting Shot',
    aggro: 1,
    effects: [{
      type: AttackType.BACK,
      base_amount: 3,
    }, {
      type: AttackType.SHIELD_SELF,
      base_amount: 1,
    }],
    icon: 'ability_back2',
  },

  heal_shield_all: {
    name: 'Mighty Guard',
    aggro: 2,
    effects: [{
      type: AttackType.HEAL_ALL,
      base_amount: 1,
    }, {
      type: AttackType.SHIELD_ALL,
      base_amount: 1,
    }],
    icon: 'ability_heal_and_shield',
  },
  heal_med: {
    name: 'Medkit',
    aggro: 2,
    effects: [{
      type: AttackType.HEAL,
      base_amount: 5,
    }],
    icon: 'ability_heal',
  },
  heal_all_light: {
    name: 'Take \'em If Ya Got \'em',
    aggro: 1,
    effects: [{
      type: AttackType.HEAL_ALL,
      base_amount: 2,
    }],
    icon: 'ability_heal_all',
  },
  heal_light: {
    name: 'Medic!',
    aggro: 4,
    effects: [{
      type: AttackType.HEAL,
      base_amount: 4,
    }, {
      type: AttackType.SHIELD_SELF,
      base_amount: 3,
    }],
    icon: 'ability_heal_other_shield_self',
  },
  shield_other1: {
    name: 'Guard',
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_ALL,
      base_amount: 1,
    }],
    icon: 'ability_shield_all',
  },
  shield_other2: {
    name: 'Defend',
    aggro: 2,
    effects: [{
      type: AttackType.SHIELD_ALL,
      base_amount: 2,
    }],
    icon: 'ability_shield_all',
  },
  hide: {
    name: 'Hide',
    aggro: -5,
    effects: [],
    icon: 'ability_demo',
  },
};

function nameUsed(heroes: Hero[], name: string): boolean {
  for (let ii = 0; ii < heroes.length; ++ii) {
    if (heroes[ii].name === name) {
      return true;
    }
  }
  return false;
}

function classUsed(heroes: Hero[], class_id: string): boolean {
  for (let ii = 0; ii < heroes.length; ++ii) {
    if (heroes[ii].class_id === class_id) {
      return true;
    }
  }
  return false;
}

function faceUsed(heroes: Hero[], face_name: string): boolean {
  for (let ii = 0; ii < heroes.length; ++ii) {
    let hero = heroes[ii];
    let class_def = CLASSES[hero.class_id]!;
    if (class_def.faces[hero.face || 0][1] === face_name) {
      return true;
    }
  }
  return false;
}

export function randomHero(
  idx: number, tier: number, heroes: Hero[], no_dup_class_tail: number,
  is_bootstrap: boolean,
  ignore_names?: string[],
): Hero {
  let options = CLASS_BY_POS[idx];
  let class_id: string;
  let heroes_to_check = [];
  for (let ii = 0; ii < no_dup_class_tail; ++ii) {
    heroes_to_check.push(heroes[heroes.length - 1 - ii]);
  }
  do {
    class_id = options[floor(random() * options.length)];
  } while (classUsed(heroes_to_check, class_id));
  if (is_bootstrap) {
    class_id = 'front1';
  }

  let class_def = CLASSES[class_id]!;
  let face: number;
  do {
    face = floor(random() * class_def.faces.length);
  } while (faceUsed(heroes, class_def.faces[face][1]));
  let gender: GENDER = class_def.faces[face][0];

  let name: NAMEPAIR;
  do {
    // note: this may narrow gender=a -> name.gender=f/m
    name = randomName(gender);
  // eslint-disable-next-line no-unmodified-loop-condition
  } while (nameUsed(heroes, name.name) || ignore_names && ignore_names.includes(name.name));

  return {
    class_id,
    tier,
    levels: [0,0],
    face,
    ...name,
  };
}

export function effectGetValue(effect: AttackDef, tier: number, level: number): number {
  return effect.base_amount + tier + level;
}
