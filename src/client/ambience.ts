import {
  getFrameDt,
  getFrameIndex,
} from 'glov/client/engine';
import {
  GlovSoundSetUp,
  soundPlay,
} from 'glov/client/sound';

const { abs, cos, max, min } = Math;

let hb_frame = 0;
let hb_factor_want = 0;

export function ambienceSetHeartbeat(factor: number): void {
  hb_frame = getFrameIndex();
  hb_factor_want = factor;
}

let hb_factor = 0;
let hb_sound: GlovSoundSetUp | null = null;
let hb_sound_play_at = 0;
export function ambienceTick(): void {
  let frame = getFrameIndex();
  let blend = getFrameDt() * 0.005;
  if (hb_frame !== frame) {
    hb_factor_want = 0;
  }
  let hb_factor_was = hb_factor;
  if (hb_factor !== hb_factor_want) {
    if (hb_factor_want > hb_factor) {
      hb_factor = max(hb_factor - blend, hb_factor_want);
    } else {
      hb_factor = min(hb_factor + blend, hb_factor_want);
    }
  }

  if (hb_factor && !hb_sound) {
    hb_sound = soundPlay('heartbeat', hb_factor, false);
    hb_sound_play_at = Date.now();
  } else if (!hb_factor && hb_sound) {
    hb_sound.stop();
    hb_sound = null;
  } else if (hb_sound && hb_factor !== hb_factor_was) {
    hb_sound.volume(hb_factor);
  }
}


const HB_TIMES = [33,124,281,362].map((a) => a/1000);
const SUBTLE_TIME = 20 * 0.750;
export function ambienceHeartbeatPulse(): number {
  let time_since_start = (Date.now() - hb_sound_play_at)/1000;
  let loc = time_since_start % 0.750;
  if (time_since_start > SUBTLE_TIME) {
    return 0.4 * max(0, (1 - 2 * abs(cos((time_since_start - SUBTLE_TIME) /0.75 * Math.PI))));
    // loc = hb_sound?.location() || 0;
  }
  if (loc < HB_TIMES[0]) {
    return 0;
  } else if (loc < HB_TIMES[1]) {
    return 1 - (loc - HB_TIMES[0]) / (HB_TIMES[1] - HB_TIMES[0]);
  } else if (loc < HB_TIMES[2]) {
    return 0;
  } else if (loc < HB_TIMES[3]) {
    return 1 - (loc - HB_TIMES[2]) / (HB_TIMES[3] - HB_TIMES[2]);
  }
  return 0;
}
