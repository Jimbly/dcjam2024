import { fontStyle } from 'glov/client/font';
import { randSimpleSpatial } from 'glov/client/rand_fast';
import { sprites as ui_sprites } from 'glov/client/ui';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
} from '../common/crawler_script';
import {
  dialogPush,
  dialogRegister,
} from './dialog_system';
import { onetimeEvent } from './jam_events';
import {
  giveXP,
  myEnt,
  sanityDamage,
} from './play';

const { min, floor } = Math;

const style_terminal = fontStyle(null, {
  color: 0x59c135ff,
  outline_color: 0x59c13520,
  outline_width: 2,
});

const style_note = fontStyle(null, {
  color: 0x141013ff,
});

dialogIconsRegister({
  terminal: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN;
  },
  note: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN;
  },
  medkit: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    if (onetimeEvent(true)) {
      return CrawlerScriptEventMapIcon.NOTE + 2;
    }
    return CrawlerScriptEventMapIcon.NOTE_SEEN + 2;
  },
});
dialogRegister({
  terminal: function (param: string) {
    if (onetimeEvent()) {
      giveXP('terminal');
    }
    dialogPush({
      name: '',
      text: param,
      font_style: style_terminal,
      transient: true,
    });
  },
  note: function (param: string) {
    if (onetimeEvent()) {
      giveXP('note');
    }
    let me = myEnt();
    let { pos, heroes } = me.data;
    let rnd = randSimpleSpatial(pos[0], pos[1], 0);
    let name = heroes[floor(rnd * heroes.length)].name;
    dialogPush({
      name: '',
      text: `*NAME finds a little piece of paper on the ground.*\n\n${param}`.replace('NAME', name),
      font_style: style_note,
      transient: true,
      instant: true,
      panel_sprite: ui_sprites.panel_note,
    });
  },
  sanity_restore: function (param: string) {
    let me = myEnt();
    let delta = me.data.sanity_max - me.data.sanity;
    if (delta) {
      sanityDamage(0, -delta, 1000, true);
      dialogPush({
        name: '',
        text: 'You take a moment in solitude to regain some [c=sanity]sanity[/c]...',
        transient: true,
      });
    } else {
      dialogPush({
        name: '',
        text: 'You feel fine now, but know that if you come back, you can refresh your [c=sanity]sanity[/c]...',
        transient: true,
      });
    }
  },
  medkit: function () {
    if (!onetimeEvent(true)) {
      return;
    }
    let me = myEnt();
    let delta = min(15, 100 - me.data.sanity_max);
    if (!delta) {
      dialogPush({
        name: '',
        text: 'This medical station may be useful later...\n(Restores up to [c=sanity]15 MAX Sanity[/c])',
        transient: true,
      });
    } else {
      dialogPush({
        name: 'Medical Station',
        text: 'You rummage through the drawers and see some pills... take them?\n' +
          '(Restores up to [c=sanity]15 MAX Sanity[/c])',
        buttons: [{
          label: 'What\'s the worst that could happen?',
          cb: 'pills',
        }, {
          label: 'No, maybe later...',
        }],
      });
    }
  },
  pills: function () {
    let me = myEnt();
    let delta = min(15, 100 - me.data.sanity_max);
    if (!delta) {
      return;
    }
    if (!onetimeEvent()) {
      return;
    }
    sanityDamage(-delta, -delta, 1000, true);
    dialogPush({
      name: '',
      text: 'You mind feels more at ease.  Let\'s not worry about the side effects...',
      transient: true,
    });
  },
});
