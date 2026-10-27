import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import type {CaseConfig, GameMode, PublicCase, Submission, SuspectId} from '../domain';

export type Guilt = 'guilty' | 'innocent' | null;
export type Honesty = 'liar' | 'truthful' | null;
export interface Mark {
  guilt: Guilt;
  honesty: Honesty;
}
export interface Stroke {
  color: string;
  width: number;
  pts: number[]; // [x0,y0,x1,y1,…]
}
export type Role = 'solo' | 'host' | 'guest';

export interface FinishedInfo {
  correct: boolean;
  ms: number;
  submission: Submission;
}
export interface ActiveGame {
  id: string;
  mode: GameMode;
  role: Role;
  pub: PublicCase;
  /** Solución si este dispositivo la conoce (solo, Cooperativo, anfitrión). En Versus-invitado es null. */
  solution: Submission | null;
  config: CaseConfig;
  accumulatedMs: number;
  resumedAt: number;
  paused: boolean;
  dayKey?: string;
  practice?: boolean;
  finished: FinishedInfo | null;
}

export interface Stats {
  played: number;
  won: number;
  bestMs: number | null;
  totalWonMs: number;
  byMode: Record<string, {played: number; won: number}>;
  daily: Record<string, {won: boolean; ms: number}>;
}
export interface Settings {
  haptics: boolean;
  sound: boolean;
  assisted: boolean;
  name: string;
  clientId: string;
}

const rid = (n = 12) =>
  Array.from({length: n}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join(
    '',
  );
export const elapsedOf = (g: ActiveGame): number =>
  g.accumulatedMs + (g.paused ? 0 : Date.now() - g.resumedAt);

interface State {
  game: ActiveGame | null;
  /** Versus: ya entregué y espero el veredicto (efímero). */
  submitted: boolean;
  markSubmitted(): void;
  revealed: Partial<Record<SuspectId, boolean>>;
  marks: Partial<Record<SuspectId, Mark>>;
  strokes: Stroke[];
  strokeColor: string;
  strokeWidth: number;
  notesTab: 'tabla' | 'dibujo';
  settings: Settings;
  stats: Stats;

  startGame(p: Omit<ActiveGame, 'id' | 'accumulatedMs' | 'resumedAt' | 'paused' | 'finished'>): void;
  endGame(): void;
  pauseClock(): void;
  resumeClock(): void;
  finishGame(f: FinishedInfo): void;
  reveal(id: SuspectId): void;
  toggleGuilt(id: SuspectId, g: 'guilty' | 'innocent'): void;
  toggleLiar(id: SuspectId): void;
  setHonesty(id: SuspectId, h: Honesty): void;
  setGuilt(id: SuspectId, g: Guilt): void;
  addStroke(s: Stroke): void;
  undoStroke(): void;
  clearStrokes(): void;
  eraseAt(x: number, y: number, r: number): void;
  setPen(p: {color?: string; width?: number}): void;
  setNotesTab(t: 'tabla' | 'dibujo'): void;
  setSettings(p: Partial<Settings>): void;
  resetStats(): void;
}

const emptyStats: Stats = {played: 0, won: 0, bestMs: null, totalWonMs: 0, byMode: {}, daily: {}};
const fresh = {revealed: {}, marks: {}, strokes: [] as Stroke[]};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      game: null,
      submitted: false,
      markSubmitted: () => set({submitted: true}),
      ...fresh,
      strokeColor: '#2a1a12',
      strokeWidth: 3,
      notesTab: 'tabla',
      settings: {haptics: true, sound: true, assisted: false, name: '', clientId: rid(16)},
      stats: emptyStats,

      startGame: p =>
        set({
          game: {...p, id: rid(), accumulatedMs: 0, resumedAt: Date.now(), paused: false, finished: null},
          ...fresh,
          submitted: false,
          notesTab: 'tabla',
        }),
      endGame: () => set({game: null, submitted: false, ...fresh}),
      pauseClock: () => {
        const g = get().game;
        if (g && !g.paused && !g.finished) {
          set({game: {...g, accumulatedMs: elapsedOf(g), paused: true}});
        }
      },
      resumeClock: () => {
        const g = get().game;
        if (g && g.paused && !g.finished) {
          set({game: {...g, paused: false, resumedAt: Date.now()}});
        }
      },
      finishGame: f =>
        set(s => {
          const g = s.game;
          if (!g || g.finished) {
            return s;
          }
          const st = s.stats;
          const m = st.byMode[g.mode] ?? {played: 0, won: 0};
          const counts = !g.practice;
          return {
            game: {...g, finished: f, paused: true, accumulatedMs: f.ms},
            stats: counts
              ? {
                  played: st.played + 1,
                  won: st.won + (f.correct ? 1 : 0),
                  bestMs: f.correct ? (st.bestMs === null ? f.ms : Math.min(st.bestMs, f.ms)) : st.bestMs,
                  totalWonMs: st.totalWonMs + (f.correct ? f.ms : 0),
                  byMode: {...st.byMode, [g.mode]: {played: m.played + 1, won: m.won + (f.correct ? 1 : 0)}},
                  daily:
                    g.dayKey && !st.daily[g.dayKey]
                      ? {...st.daily, [g.dayKey]: {won: f.correct, ms: f.ms}}
                      : st.daily,
                }
              : st,
          };
        }),
      reveal: id => set(s => (s.revealed[id] ? s : {revealed: {...s.revealed, [id]: true}})),
      toggleGuilt: (id, g) =>
        set(s => {
          const cur = s.marks[id] ?? {guilt: null, honesty: null};
          return {marks: {...s.marks, [id]: {...cur, guilt: cur.guilt === g ? null : g}}};
        }),
      toggleLiar: id =>
        set(s => {
          const cur = s.marks[id] ?? {guilt: null, honesty: null};
          return {marks: {...s.marks, [id]: {...cur, honesty: cur.honesty === 'liar' ? null : 'liar'}}};
        }),
      setHonesty: (id, h) =>
        set(s => {
          const cur = s.marks[id] ?? {guilt: null, honesty: null};
          return {marks: {...s.marks, [id]: {...cur, honesty: cur.honesty === h ? null : h}}};
        }),
      setGuilt: (id, g) =>
        set(s => {
          const cur = s.marks[id] ?? {guilt: null, honesty: null};
          return {marks: {...s.marks, [id]: {...cur, guilt: cur.guilt === g ? null : g}}};
        }),
      addStroke: st => set(s => ({strokes: [...s.strokes, st]})),
      undoStroke: () => set(s => ({strokes: s.strokes.slice(0, -1)})),
      clearStrokes: () => set({strokes: []}),
      eraseAt: (x, y, r) =>
        set(s => {
          const keep = s.strokes.filter(st => {
            if (!Array.isArray(st?.pts)) {
              return false; // trazo corrupto: se descarta
            }
            for (let i = 0; i + 1 < st.pts.length; i += 2) {
              if (Math.hypot(st.pts[i] - x, st.pts[i + 1] - y) <= r + st.width) {
                return false;
              }
            }
            return true;
          });
          return keep.length === s.strokes.length ? s : {strokes: keep};
        }),
      setPen: p => set(s => ({strokeColor: p.color ?? s.strokeColor, strokeWidth: p.width ?? s.strokeWidth})),
      setNotesTab: t => set({notesTab: t}),
      setSettings: p => set(s => ({settings: {...s.settings, ...p}})),
      resetStats: () => set({stats: emptyStats}),
    }),
    {
      name: 'quien-mato-a-la-gallina.v2',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Las partidas multijugador NO se restauran (la sesión de red ya no existe). La solitaria/diaria sí, con el reloj pausado.
      partialize: s => ({
        game:
          s.game && s.game.mode !== 'versus' && s.game.mode !== 'cooperativo'
            ? {...s.game, accumulatedMs: elapsedOf(s.game), paused: true}
            : null,
        revealed: s.game && (s.game.mode === 'solo' || s.game.mode === 'daily') ? s.revealed : {},
        marks: s.game && (s.game.mode === 'solo' || s.game.mode === 'daily') ? s.marks : {},
        strokes: s.game && (s.game.mode === 'solo' || s.game.mode === 'daily') ? s.strokes : [],
        strokeColor: s.strokeColor,
        strokeWidth: s.strokeWidth,
        notesTab: s.notesTab,
        settings: s.settings,
        stats: s.stats,
      }),
    },
  ),
);

export const useRevealed = (id: SuspectId) => useStore(s => !!s.revealed[id]);
export const useMark = (id: SuspectId): Mark => useStore(s => s.marks[id] ?? NO_MARK);
const NO_MARK: Mark = {guilt: null, honesty: null};

/** ¿Hay una partida que se pueda continuar? (no terminada, solitaria o diaria) */
export const canContinue = (g: ActiveGame | null): g is ActiveGame =>
  !!g && !g.finished && (g.mode === 'solo' || g.mode === 'daily');
