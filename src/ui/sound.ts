import Sound from 'react-native-sound';

export type Sfx = 'flip' | 'stamp' | 'tick' | 'go' | 'win' | 'lose';
let enabled = true;
const cache: Partial<Record<Sfx, Sound>> = {};
Sound.setCategory('Ambient', true); // respeta el modo silencio

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
};

/** Efectos cortos desde res/raw (Android). Nunca lanza: el sonido es opcional. */
export function sfx(name: Sfx): void {
  if (!enabled) {
    return;
  }
  try {
    let s = cache[name];
    if (!s) {
      s = new Sound(name, Sound.MAIN_BUNDLE, err => {
        if (!err) {
          s?.play();
        }
      });
      cache[name] = s;
      return;
    }
    s.stop(() => s?.play());
  } catch {
    // sin audio disponible
  }
}
