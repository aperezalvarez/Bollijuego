/* eslint-disable no-bitwise -- PRNG, hash FNV y aritmética de IPv4 */
import {
  SUSPECTS,
  WITNESSES,
  findModels,
  generateOnce,
  type CaseConfig,
  type GameCase,
  type SuspectId,
  type WitnessId,
} from './core';

export type Result<T, E> = {ok: true; value: T} | {ok: false; error: E};
export type GenError = {code: 'BAD_CONFIG' | 'EXHAUSTED'; message: string};

export type GameMode = 'solo' | 'daily' | 'cooperativo' | 'versus';

export const LIMITS = {minSuspects: 3, maxSuspects: 8} as const;
export const maxKillers = (s: number) => Math.ceil(s / 2);
export const maxLiars = (s: number) => Math.ceil(s / 2);
export const maxWitnesses = (s: number) => (s <= 5 ? 1 : 2);

export type PresetId = 'facil' | 'normal' | 'dificil' | 'personalizado';
export const PRESETS: Record<Exclude<PresetId, 'personalizado'>, CaseConfig> = {
  facil: {suspects: 4, killers: 1, liars: 1, witnesses: 0},
  normal: {suspects: 6, killers: 2, liars: 2, witnesses: 1},
  dificil: {suspects: 8, killers: 3, liars: 3, witnesses: 2},
};

export function validateConfig(cfg: CaseConfig): GenError | null {
  const s = cfg.pickedSuspects ? cfg.pickedSuspects.length : cfg.suspects;
  if (s < LIMITS.minSuspects || s > LIMITS.maxSuspects) {
    return {code: 'BAD_CONFIG', message: 'Entre 3 y 8 sospechosos.'};
  }
  if (cfg.killers < 1 || cfg.killers > maxKillers(s)) {
    return {code: 'BAD_CONFIG', message: 'Número de asesinos fuera de rango.'};
  }
  if (cfg.liars < 1 || cfg.liars > maxLiars(s)) {
    return {code: 'BAD_CONFIG', message: 'Número de mentirosos fuera de rango.'};
  }
  const w = cfg.pickedWitnesses ? cfg.pickedWitnesses.length : cfg.witnesses;
  if (w < 0 || w > maxWitnesses(s)) {
    return {code: 'BAD_CONFIG', message: 'Número de testigos fuera de rango.'};
  }
  if (cfg.pickedSuspects && cfg.pickedSuspects.length !== cfg.suspects) {
    return {code: 'BAD_CONFIG', message: 'La selección manual no coincide con el total.'};
  }
  return null;
}

/** Generación segura: nunca devuelve un caso «vacío válido» (ENG-4). */
export function generateCase(cfg: CaseConfig, seed: number): Result<GameCase, GenError> {
  const bad = validateConfig(cfg);
  if (bad) {
    return {ok: false, error: bad};
  }
  const c = generateOnce(cfg, seed);
  if (!c) {
    return {
      ok: false,
      error: {
        code: 'EXHAUSTED',
        message: 'No se pudo generar un caso válido con esta configuración. Prueba otra semilla.',
      },
    };
  }
  return {ok: true, value: c};
}

export const randomSeed = (): number => Math.floor(Math.random() * 999_999) + 1;

/** Reto diario: la misma semilla para todos el mismo día (fecha local AAAA-MM-DD). */
export function dailySeed(date: Date): number {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 999_999) + 1;
}
export const DAILY_CONFIG: CaseConfig = PRESETS.normal;
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface Submission {
  killers: SuspectId[];
  liars: SuspectId[];
}

/** Una entrega es correcta si coincide EXACTAMENTE con la solución. */
export function sameAnswer(a: Submission, b: Submission): boolean {
  const same = (x: readonly string[], y: readonly string[]) =>
    x.length === y.length && x.every(v => y.includes(v));
  return same(a.killers, b.killers) && same(a.liars, b.liars);
}
export const isCorrect = (c: GameCase, s: Submission): boolean => sameAnswer(s, c.solution);

/** Caso sin solución (lo que viaja al invitado en Versus). */
export interface PublicCase {
  seed: number;
  rulesVersion: 1;
  witnesses: WitnessId[];
  slots: GameCase['slots'];
  killers: number;
  liars: number;
}
export const toPublic = (c: GameCase): PublicCase => ({
  seed: c.seed,
  rulesVersion: c.rulesVersion,
  witnesses: c.witnesses,
  slots: c.slots,
  killers: c.solution.killers.length,
  liars: c.solution.liars.length,
});

/** Reconstruye un GameCase completo en el cliente (Cooperativo: la solución viaja). */
export function configOf(c: PublicCase): CaseConfig {
  return {suspects: c.slots.length, killers: c.killers, liars: c.liars, witnesses: c.witnesses.length};
}

/** Resuelve la solución de un caso público (única por construcción). */
export function solvePublic(c: PublicCase): GameCase | null {
  const m = findModels(c.slots, new Set(c.witnesses), c.killers, c.liars, 2);
  if (m.length !== 1) {
    return null;
  }
  return {
    seed: c.seed,
    rulesVersion: c.rulesVersion,
    witnesses: c.witnesses,
    slots: c.slots,
    solution: {killers: [...m[0].killers], liars: [...m[0].liars]},
  };
}

export const ALL_SUSPECT_IDS: SuspectId[] = SUSPECTS.map(s => s.id);
export const ALL_WITNESS_IDS: WitnessId[] = [...WITNESSES];
