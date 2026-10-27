import {useCallback} from 'react';
import {performanceNow} from '../platform/clock';
import {PRESETS, generateCase, randomSeed, sameAnswer, toPublic, type Submission} from '../domain';
import {sessions, useClient, useClientSnapshot, useHost, useHostSnapshot} from '../net/registry';
import {elapsedOf, useStore} from '../state/store';

/** Milisegundos de partida según el rol: reloj local (solo), del anfitrión, o sincronizado (invitado). */
export function elapsedNow(): number {
  const g = useStore.getState().game;
  if (!g) {
    return 0;
  }
  if (g.role === 'solo') {
    return elapsedOf(g);
  }
  if (g.role === 'host') {
    const at = sessions.host()?.state.get().startAtHostMs;
    return at == null ? 0 : performanceNow() - at;
  }
  return sessions.client()?.elapsedMs() ?? 0;
}

export function useRuntime() {
  const game = useStore(s => s.game);
  const host = useHost();
  const client = useClient();
  const hs = useHostSnapshot(host);
  const cs = useClientSnapshot(client);
  const getElapsedMs = useCallback(elapsedNow, []);
  return {game, host, client, hs, cs, getElapsedMs};
}

export type SubmitOutcome = 'finished' | 'sent' | 'error';

/** Entrega la acusación. Cooperativo/solo: se comprueba localmente. Versus: se envía al anfitrión. */
export function submitAnswer(sub: Submission): SubmitOutcome {
  const st = useStore.getState();
  const g = st.game;
  if (!g || g.finished || st.submitted) {
    return 'error';
  }
  const ms = Math.max(0, Math.round(elapsedNow()));
  if (g.mode === 'versus') {
    if (g.role === 'host') {
      sessions.host()?.submitHost(sub, ms);
    } else {
      sessions.client()?.submit(sub, ms);
    }
    st.markSubmitted();
    return 'sent';
  }
  if (!g.solution) {
    return 'error';
  }
  st.finishGame({correct: sameAnswer(sub, g.solution), ms, submission: sub});
  return 'finished';
}

/** Nuevo caso en solitario con la misma configuración (reroll). */
export function rerollSolo(): boolean {
  const st = useStore.getState();
  const g = st.game;
  if (!g || g.mode !== 'solo') {
    return false;
  }
  const r = generateCase(g.config ?? PRESETS.normal, randomSeed());
  if (!r.ok) {
    return false;
  }
  st.startGame({
    mode: 'solo',
    role: 'solo',
    pub: toPublic(r.value),
    solution: r.value.solution,
    config: g.config,
  });
  return true;
}
