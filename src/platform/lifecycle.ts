import {useEffect} from 'react';
import {AppState, BackHandler, type AppStateStatus} from 'react-native';

/** Un único sitio decide qué hacer al pasar a segundo plano / volver (guardar, pausar reloj, reconectar). */
export function useAppLifecycle(h: {onBackground(): void; onForeground(): void}) {
  useEffect(() => {
    let prev: AppStateStatus = AppState.currentState;
    const sub = AppState.addEventListener('change', next => {
      if (prev === 'active' && next !== 'active') {
        h.onBackground();
      }
      if (prev !== 'active' && next === 'active') {
        h.onForeground();
      }
      prev = next;
    });
    return () => sub.remove();
  }, [h]);
}

/** Botón «atrás» de Android: devuelve true si ya lo gestionaste. */
export function useAndroidBack(handler: () => boolean, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [handler, enabled]);
}
