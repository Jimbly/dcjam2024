export const SOUND_DATA: Partial<Record<string, {
  file: string;
  volume: number;
} | string | string[]>> = {
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

  // Game sounds
  dice: ['dice1', 'dice2'],
  ability_gun1: { file: 'ability_gun1', volume: 1 },
  ability_gun2: { file: 'ability_gun2', volume: 1 },
  ability_shield2: { file: 'ability_shield2', volume: 1 },
  ability_shield1: { file: 'ability_shield1', volume: 1 },
  ability_poison2: { file: 'ability_poison2', volume: 1 },
  ability_ranged_all2: { file: 'ability_ranged_all2', volume: 1 },
  ability_ranged_all1: { file: 'ability_ranged_all1', volume: 1 },
  ability_heal_all: { file: 'ability_heal_all', volume: 1 },
  ability_heal: { file: 'ability_heal', volume: 1 },
  ability_shield_all: { file: 'ability_shield_all', volume: 1 },

  hero_death: { file: 'hero_death', volume: 1 },
  monster_death: { file: 'monster_death', volume: 1 },
  shield_block: { file: 'shield_block', volume: 1 },
  monster_attack: { file: 'monster_attack', volume: 1 },
  monster_attack_all: { file: 'monster_attack_all', volume: 1 },
};