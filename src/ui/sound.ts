import Sound from 'react-native-sound';

export type Sfx = 'flip' | 'stamp' | 'tick' | 'go' | 'win' | 'lose';
const ALL: readonly Sfx[] = ['flip', 'stamp', 'tick', 'go', 'win', 'lose'];

interface Slot {
  sound: Sound;
  ready: boolean;
  /** Se pidió reproducir mientras aún cargaba: suena en cuanto esté listo. */
  pending: boolean;
}

let enabled = true;
const slots: Partial<Record<Sfx, Slot>> = {};
try {
  Sound.setCategory('Ambient', true); // respeta el modo silencio y no corta la música ajena
} catch {
  // sin módulo nativo
}

const playNow = (s: Sound) => {
  // stop() solo responde si el sonido está cargado, por eso nunca se encadena el play a su callback.
  try {
    s.stop();
    s.play();
  } catch {
    // sin audio disponible
  }
};

/** Carga el efecto en memoria (res/raw en Android). Si falla, no se cachea y se reintenta. */
function load(name: Sfx): Slot | undefined {
  const existing = slots[name];
  if (existing) {
    return existing;
  }
  try {
    const slot = {pending: false, ready: false} as Slot;
    slot.sound = new Sound(name, Sound.MAIN_BUNDLE, err => {
      if (err) {
        if (slots[name] === slot) {
          delete slots[name];
        }
        return;
      }
      slot.ready = true;
      if (slot.pending) {
        slot.pending = false;
        if (enabled) {
          playNow(slot.sound);
        }
      }
    });
    slots[name] = slot;
    return slot;
  } catch {
    return undefined;
  }
}

/** Precarga todos los efectos al arrancar para que el primer sonido no llegue tarde ni se pierda. */
export function preloadSfx(): void {
  ALL.forEach(load);
}

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
  if (v) {
    preloadSfx();
  } else {
    ALL.forEach(n => {
      const s = slots[n];
      if (s) {
        s.pending = false;
        try {
          s.sound.stop();
        } catch {
          // ignorar
        }
      }
    });
  }
};

/** Efectos cortos. Nunca lanza: el sonido es opcional. */
export function sfx(name: Sfx): void {
  if (!enabled) {
    return;
  }
  const slot = load(name);
  if (!slot) {
    return;
  }
  if (slot.ready) {
    playNow(slot.sound);
  } else {
    slot.pending = true;
  }
}
