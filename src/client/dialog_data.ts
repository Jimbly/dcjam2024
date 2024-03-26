import {
  dialogPush,
  dialogRegister,
} from './dialog_system';
import {
  myEnt,
  sanityDamage,
} from './play';

dialogRegister({
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
});
