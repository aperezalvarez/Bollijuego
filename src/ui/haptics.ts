import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/** Única puerta de entrada a la vibración: cambiar de librería (o desactivarla en Ajustes) = tocar un fichero. */
type Kind = 'tap' | 'select' | 'flip' | 'success' | 'error' | 'heavy';
const MAP = {
  tap: 'impactLight',
  select: 'selection',
  flip: 'impactMedium',
  success: 'notificationSuccess',
  error: 'notificationError',
  heavy: 'impactHeavy',
} as const;

let enabled = true;
export const setHapticsEnabled = (v: boolean) => {
  enabled = v;
};
export const haptic = (k: Kind) => {
  if (enabled) {
    ReactNativeHapticFeedback.trigger(MAP[k], {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }
};
