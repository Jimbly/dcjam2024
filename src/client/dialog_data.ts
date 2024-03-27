import { fontStyle } from 'glov/client/font';
import { sprites as ui_sprites } from 'glov/client/ui';
import {
  dialogPush,
  dialogRegister,
} from './dialog_system';
import { onetimeEvent } from './jam_events';
import {
  myEnt,
  sanityDamage,
} from './play';

const { min } = Math;

const style_terminal = fontStyle(null, {
  color: 0x59c135ff,
  outline_color: 0x59c13520,
  outline_width: 2,
});

const style_note = fontStyle(null, {
  color: 0x141013ff,
});

dialogRegister({
  terminal: function (param: string) {
    dialogPush({
      name: '',
      text: param,
      font_style: style_terminal,
      transient: true,
    });
  },
  note: function (param: string) {
    dialogPush({
      name: '',
      text: param,
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
        text: 'You take a moment in solitude to regain some sanity...',
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
        text: 'This medical station may be useful later...',
        transient: true,
      });
    } else {
      dialogPush({
        name: 'Medical Station',
        text: 'You rummage through the drawers and see some pills... take them?',
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
