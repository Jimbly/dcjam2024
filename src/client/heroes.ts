import assert from 'assert';
import { TSMap } from 'glov/common/types';
import { AttackType } from './encounters';
import { AbilityDef, Hero, HeroClassDef } from './entity_demo_client';
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

export const CLASSES: TSMap<HeroClassDef> = {
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
    faces: [['a', 'capedeagle'], ['a', 'turtle2'], ['m', 'sawserpent'], ['a', 'nebulan2']],
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
    faces: [['m', 'ifrit'], ['m', 'yanfly'], ['a', 'steelslime'], ['m', 'redmonster']],
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
    abilities: ['attack_back', 'poison'],
    faces: [['a', 'brownkobold'], ['m', 'thief'], ['a', 'slug'], ['m', 'sahagin'], ['m', 'littlesahagin']],
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
    faces: [['f', 'icelady'], ['a', 'treegolem'], ['f', 'spiderlady'], ['a', 'phoenix'], ['a', 'mageslime2']],
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
    abilities: ['heal_med', 'heal_all_light'],
    faces: [['a', 'healer2'], ['a', 'wizardblack'], ['f', 'succubus'], ['f', 'pinkslimev2'], ['a', 'nebulan']],
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
    faces: [['m', 'calm'], ['a', 'stonegolem'], ['m', 'reddemonblue'], ['m', 'purpledemon']],
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
  attack_back: {
    aggro: 2,
    effects: [{
      type: AttackType.BACK,
      amount: 2,
    }],
    icon: 'ability_back1',
  },
  shield_aggro: {
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_SELF,
      amount: 2,
    }],
    icon: 'ability_shield2',
  },
  shield_slow: {
    aggro: 1,
    effects: [{
      type: AttackType.SHIELD_SELF,
      amount: 3,
    }],
    icon: 'ability_shield1',
  },
  poison: {
    aggro: 1,
    effects: [{
      type: AttackType.POISON,
      amount: 1,
    }],
    icon: 'ability_poison2',
  },
  area_light: {
    aggro: 2,
    effects: [{
      type: AttackType.ALL,
      amount: 1,
    }],
    icon: 'ability_ranged_all2',
  },
  area_med: {
    aggro: 3,
    effects: [{
      type: AttackType.ALL,
      amount: 2,
    }],
    icon: 'ability_ranged_all1',
  },
  heal_all_light: {
    aggro: 1,
    effects: [{
      type: AttackType.HEAL_ALL,
      amount: 1,
    }],
    icon: 'ability_heal_all',
  },
  heal_med: {
    aggro: 2,
    effects: [{
      type: AttackType.HEAL,
      amount: 3,
    }],
    icon: 'ability_heal',
  },
  shield_other1: {
    aggro: 3,
    effects: [{
      type: AttackType.SHIELD_ALL,
      amount: 1,
    }],
    icon: 'ability_shield_all',
  },
  shield_other2: {
    aggro: 2,
    effects: [{
      type: AttackType.SHIELD_ALL,
      amount: 2,
    }],
    icon: 'ability_shield_all',
  },
  hide: {
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
  idx: number, tier: number, heroes: Hero[], no_dup_class: boolean,
  ignore_names?: string[],
): Hero {
  let options = CLASS_BY_POS[idx];
  let class_id: string;
  do {
    class_id = options[floor(random() * options.length)];
  // eslint-disable-next-line no-unmodified-loop-condition
  } while (no_dup_class && classUsed(heroes, class_id));

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
    face,
    ...name,
  };
}
