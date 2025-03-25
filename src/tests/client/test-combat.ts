/* eslint import/order:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
import 'glov/client/test'; // Must be first

import assert from 'assert';
import { empty } from 'glov/common/util';
import { combatStateInit } from '../../client/combat';
import {
  ENCOUNTERS,
} from '../../client/encounters';
import { Hero } from '../../client/entity_demo_client';
import { randomHero } from '../../client/heroes';

const { floor, max, random } = Math;

function perc(v: number, force_prec?: boolean): string {
  let r = (v * 100).toFixed(0);
  if (v && r === '0' || force_prec) {
    return `${(v * 100).toFixed(2)}%`;
  }
  if (v !== 1 && r === '100') {
    return '99%';
  }
  return `${r}%`;
}


function printHisto(total: number, histo: Record<number, number>): void {
  let keys = Object.keys(histo).map((a) => Number(a));
  keys.sort((a, b) => b - a);
  let output = [];
  for (let ii = 0; ii < keys.length; ++ii) {
    output.push(`${keys[ii]}:${histo[keys[ii]]}`);
  }
  console.log(output.join('   '));
}

function printHistoDeaths(total: number, histo: Record<number, number>): string {
  let output = [];
  for (let ii = 0; ii <= 6; ++ii) {
    output.push(`${ii}=${perc((histo[ii] || 0)/total)}`);
  }
  return output.join('   ');
}

function median(total: number, histo: Record<number, number>): number {
  let cutoff = total * 0.5;
  let keys = Object.keys(histo).map((a) => Number(a));
  keys.sort((a, b) => a - b);
  for (let ii = 0; ii < keys.length; ++ii) {
    cutoff -= histo[keys[ii]];
    if (cutoff <= 0) {
      return Number(keys[ii]);
    }
  }
  assert(false);
}

function pad(str: string): string {
  return (`${str}     `).slice(0, 10);
}
function pad2(v: number): string {
  return ` ${v}`.slice(-2);
}

let stats_base = {
  total: 0,
  wins: 0,
  dead: 0,
  dead_histo: {} as Record<number, number>,
  turns: 0,
  turns_histo: {} as Record<number, number>,
};
let stats: typeof stats_base;
let last_label = '';
function printStats(label: string): void {
  if (last_label && last_label.slice(0,2) !== label.slice(0,2)) {
    console.log('');
  }
  last_label = label;
  if (stats) {
    let loss = stats.total - stats.wins;
    let zerodead = (stats.dead_histo[0]||0);
    let onetwodead = (stats.dead_histo[1]||0) + (stats.dead_histo[2]||0);
    let turns_median = median(stats.total, stats.turns_histo);
    let analysis = (zerodead/stats.total > 0.4) ? 'EASY' : '';
    if (loss/stats.total > 0.02 || zerodead/stats.total<0.2) {
      analysis += 'HARD';
    }
    console.log(`# ${pad(label).toUpperCase()}  ${pad2(turns_median)}T  -  Wipe=${perc(loss/stats.total, true)}` +
      `  -  0D=${perc(zerodead/stats.total)}  -  1-2D=${perc(onetwodead/stats.total)}  ${analysis}`);
    //console.log(`Deaths: Avg=${(stats.dead/stats.total).toFixed(2)}/enc  ${printHistoDeaths(stats.total, stats.dead_histo)}`);
    // console.log(`Turns: Avg=${(stats.turns/stats.total).toFixed(2)}/enc  Median=${turns_median}`);
    // printHisto(stats.total, stats.turns_histo);
  }
  stats = {
    ...stats_base,
    dead_histo: {},
    turns_histo: {},
  };
}
printStats('');

function doCombat(encounter_id: string, tier: number, level: number): void {
  let encounter = ENCOUNTERS[encounter_id]!;
  let hero_defs: Hero[] = [];
  for (let ii = 0; ii < 6; ++ii) {
    let hero = randomHero(ii, max(tier, (ii === 0) ? 1 : 0), hero_defs, 0, false);
    hero.levels[0] = hero.levels[1] = level;
    hero_defs.push(hero);
  }
  let combat_state = combatStateInit(hero_defs, encounter);
  let { heroes } = combat_state;

  let combat_over: false | 'died' | 'won' = false;

  function livingEnemies(): boolean {
    for (let ii = 0; ii < combat_state.enemies.length; ++ii) {
      let enemy = combat_state.enemies[ii];
      if (enemy.hp > 0) {
        return true;
      }
    }
    return false;
  }
  function livingPlayers(): boolean {
    for (let ii = 0; ii < heroes.length; ++ii) {
      if (heroes[ii].hp) {
        return true;
      }
    }
    return false;
  }

  function doPlayerTurn(): void {
    combat_state.roll();
    while (true) {
      if (!livingEnemies()) {
        combat_over = 'won';
        break;
      }
      let avail = combat_state.getDiceAvail();
      if (empty(avail)) {
        break;
      }
      let options = [];
      for (let die_key in avail) {
        let die = Number(die_key);
        let slot = floor((die - 1)/2);
        for (let jj = 0; jj < 2; ++jj) {
          let hero_idx = slot * 2 + jj;
          let hero = heroes[hero_idx];
          if (hero.hp) {
            options.push([hero_idx, 1 - (die % 2)]);
          }
        }
      }
      if (!options.length) {
        // bad roll, no living hero has an option
        break;
      }
      let choice = floor(random() * options.length);
      combat_state.activateAbility(options[choice][0], options[choice][1]);
    }
  }

  function doTurn(): void {
    doPlayerTurn();
    if (combat_over) {
      return;
    }
    combat_state.doEnemyTurn();
    if (!livingEnemies()) {
      combat_over = 'won';
      return;
    }
    if (!livingPlayers()) {
      combat_over = 'died';
    }
  }
  let turns = 0;
  while (!combat_over && turns < 100) {
    ++turns;
    doTurn();
    // if (turns > 20 && !combat_over) {
    //   console.log('!!!!!', encounter_id, heroes, combat_state);
    // }
  }
  let dead = 0;
  for (let ii = 0; ii < heroes.length; ++ii) {
    if (!heroes[ii].hp) {
      dead++;
    }
  }
  if (!combat_over) {
    console.log('!!!!!', encounter_id, heroes, combat_state.enemies);
  }

  assert(combat_over);
  stats.total++;
  if (combat_over === 'won') {
    stats.wins++;
  } else {
    assert.equal(dead, 6);
  }
  stats.dead += dead;
  stats.dead_histo[dead] = (stats.dead_histo[dead] || 0) + 1;
  stats.turns += turns;
  stats.turns_histo[turns] = (stats.turns_histo[turns] || 0) + 1;
}

// const TESTS = 1000;
// for (let encounter_id in ENCOUNTERS) {
//   for (let ii = 0; ii < TESTS; ++ii) {
//     doCombat(encounter_id, 0, 1);
//   }
//   printStats(encounter_id);
// }
