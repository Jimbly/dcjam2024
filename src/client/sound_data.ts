import { UISoundID } from 'glov/client/ui';

export const SOUND_DATA: Partial<Record<string, UISoundID | string | string[] | UISoundID[]>> = {
  // online multiplayer sounds, ignore these
  user_join: 'user_join',
  user_leave: 'user_leave',
  msg_in: 'msg_in',
  msg_err: 'msg_err',
  msg_out_err: 'msg_out_err',
  msg_out: 'msg_out',

  // UI sounds
  button_click: 'button_click', // menus/general/etc
  button_click2: 'button_click2', // movement controls
  rollover: { file: 'rollover', volume: 0.25 },

  // Game sounds - done
  dice: ['dice1', 'dice2'],
  monster_block: { file: 'monster_block', volume: 1 },
  monster_attack: { file: 'monster_attack', volume: 1 }, // could be used for hunter_seen
  ability_ranged_all1: { file: 'ability_ranged_all1', volume: 1 },
  ability_ranged_all2: { file: 'ability_ranged_all2', volume: 1 },
  // Game sounds - TODO
  ability_gun1: { file: 'ability_gun1', volume: 1 },
  ability_gun2: { file: 'ability_gun2', volume: 1 },
  ability_back1: { file: 'ability_back1', volume: 1 },
  ability_back2: { file: 'ability_back2', volume: 1 },
  ability_shield2: { file: 'ability_shield2', volume: 1 },
  ability_shield1: { file: 'ability_shield1', volume: 1 },
  ability_poison1: { file: 'ability_poison2', volume: 1 },
  ability_poison2: { file: 'ability_poison2', volume: 1 },
  ability_heal_all: { file: 'ability_heal_all', volume: 1 },
  ability_heal: { file: 'ability_heal', volume: 1 },
  ability_shield_all: { file: 'ability_shield_all', volume: 1 },

  hero_death: { file: 'hero_death', volume: 1 },
  monster_death: { file: 'monster_death', volume: 1 },
  shield_block: { file: 'shield_block', volume: 1 },
  monster_attack_all: { file: 'monster_attack_all', volume: 1 },

  hunter_seen: { file: 'hunter_seen', volume: 1 },
  hunter_lost: { file: 'hunter_lost', volume: 1 },

  victory: { file: 'victory', volume: 1 },
  level_up: { file: 'level_up', volume: 1 },
  heartbeat: { file: 'heartbeat', volume: 1, opts: { loop: true } },

  footstep: [{
    file: 'footstep/footstep1',
    volume: 0.25,
  }, {
    file: 'footstep/footstep2',
    volume: 1,
  }, {
    file: 'footstep/footstep3',
    volume: 1,
  }, {
    file: 'footstep/footstep4',
    volume: 0.5,
  }],
  footstep_cosmic: [
    { file: 'footstep/footstep_cosmic', volume: 0.125 },
    { file: 'footstep/footstep_cosmic2', volume: 0.08 },
  ]
};
