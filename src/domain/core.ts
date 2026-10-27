/* eslint-disable no-bitwise -- PRNG, hash FNV y aritmética de IPv4 */
// domain/ — TypeScript puro (sin imports de react-native). Prototipo verificado de la propuesta.
export type SuspectId = 'Tavio' | 'Pili' | 'Pork' | 'Charlot' | 'Lolo' | 'Luisa' | 'Charls' | 'Reisy';
export type Gender = 'M' | 'F';
export type Level = 0 | 1 | 2 | 3; // 0 Muy arisco · 1 Arisco · 2 Cariñoso · 3 Muy cariñoso
export interface Suspect {
  readonly id: SuspectId;
  readonly gender: Gender;
  readonly level: Level;
}

export const SUSPECTS: readonly Suspect[] = [
  {id: 'Tavio', gender: 'M', level: 0},
  {id: 'Pili', gender: 'F', level: 0},
  {id: 'Pork', gender: 'M', level: 1},
  {id: 'Charlot', gender: 'F', level: 1},
  {id: 'Lolo', gender: 'M', level: 2},
  {id: 'Luisa', gender: 'F', level: 2},
  {id: 'Charls', gender: 'M', level: 3},
  {id: 'Reisy', gender: 'F', level: 3},
];
export const WITNESSES = ['Thomas', 'Mr. Red', 'La Vicente', 'Croqueta Batista'] as const;
export type WitnessId = (typeof WITNESSES)[number];

// #region types
export type Quant = 'SOME' | 'NONE'; // "Al menos un" | "Ningún"
export type Dir = 'MORE' | 'LESS';
export type Axis = 'WARM' | 'COLD'; // cariñoso | arisco

export type Statement =
  | {kind: 'SELF_GUILTY'}
  | {kind: 'SELF_INNOCENT'}
  | {kind: 'ACCUSE'; target: SuspectId}
  | {kind: 'CLEAR'; target: SuspectId}
  | {kind: 'LIAR'; target: SuspectId}
  | {kind: 'TRUTHFUL'; target: SuspectId}
  | {kind: 'GENDER'; q: Quant; gender: Gender}
  | {kind: 'TRAIT'; q: Quant; level: Level}
  | {kind: 'COMPARE'; q: Quant; dir: Dir; axis: Axis}
  | {kind: 'GENDER_COMPARE'; gender: Gender; dir: Dir; axis: Axis};

const assertNever = (x: never): never => {
  throw new Error(`Statement no contemplado: ${JSON.stringify(x)}`);
};
// #endregion

// #region readas
/** Lo que la carta DICE → lo que SIGNIFICA con los testigos activos (sustitución simultánea, sin encadenar). */
export function readAs(s: Statement, active: ReadonlySet<WitnessId>): Statement {
  const flipG = (g: Gender): Gender => (active.has('Thomas') ? (g === 'M' ? 'F' : 'M') : g);
  const mapLevel = (l: Level): Level =>
    active.has('Mr. Red') && l <= 1
      ? ((3 - l) as Level)
      : active.has('La Vicente') && l >= 2
      ? ((3 - l) as Level)
      : l;
  const mapAxis = (a: Axis): Axis =>
    active.has('Mr. Red') && a === 'COLD' ? 'WARM' : active.has('La Vicente') && a === 'WARM' ? 'COLD' : a;
  switch (s.kind) {
    case 'LIAR':
      return active.has('Croqueta Batista') ? {kind: 'CLEAR', target: s.target} : s;
    case 'TRUTHFUL':
      return active.has('Croqueta Batista') ? {kind: 'ACCUSE', target: s.target} : s;
    case 'GENDER':
      return {...s, gender: flipG(s.gender)};
    case 'TRAIT':
      return {...s, level: mapLevel(s.level)};
    case 'COMPARE':
      return {...s, axis: mapAxis(s.axis)};
    case 'GENDER_COMPARE':
      return {...s, gender: flipG(s.gender), axis: mapAxis(s.axis)};
    case 'SELF_GUILTY':
    case 'SELF_INNOCENT':
    case 'ACCUSE':
    case 'CLEAR':
      return s;
    default:
      return assertNever(s);
  }
}
// #endregion

// #region affected
/** Qué testigos pueden alterar la lectura de una carta (sustituye a los `tags` string del motor actual). */
export function affectedBy(s: Statement): WitnessId[] {
  switch (s.kind) {
    case 'LIAR':
    case 'TRUTHFUL':
      return ['Croqueta Batista'];
    case 'GENDER':
      return ['Thomas'];
    case 'TRAIT':
      return [s.level <= 1 ? 'Mr. Red' : 'La Vicente'];
    case 'COMPARE':
      return [s.axis === 'COLD' ? 'Mr. Red' : 'La Vicente'];
    case 'GENDER_COMPARE':
      return ['Thomas', s.axis === 'COLD' ? 'Mr. Red' : 'La Vicente'];
    default:
      return [];
  }
}
// #endregion

// #region holds
export interface World {
  readonly killers: ReadonlySet<SuspectId>;
  readonly liars: ReadonlySet<SuspectId>;
}
const byId = new Map<SuspectId, Suspect>(SUSPECTS.map(s => [s.id, s]));

/** ¿Es verdadera la afirmación (ya "leída") en este mundo? Función pura y total. */
export function holds(s: Statement, speaker: SuspectId, w: World): boolean {
  const me = byId.get(speaker)!;
  const K = [...w.killers].map(id => byId.get(id)!);
  const q = (quant: Quant, f: (k: Suspect) => boolean) => (quant === 'SOME' ? K.some(f) : !K.some(f));
  const cmp = (dir: Dir, axis: Axis, k: Suspect) =>
    (dir === 'MORE') === (axis === 'WARM') ? k.level > me.level : k.level < me.level;
  switch (s.kind) {
    case 'SELF_GUILTY':
      return w.killers.has(speaker);
    case 'SELF_INNOCENT':
      return !w.killers.has(speaker);
    case 'ACCUSE':
      return w.killers.has(s.target);
    case 'CLEAR':
      return !w.killers.has(s.target);
    case 'LIAR':
      return w.liars.has(s.target);
    case 'TRUTHFUL':
      return !w.liars.has(s.target);
    case 'GENDER':
      return q(s.q, k => k.gender === s.gender);
    case 'TRAIT':
      return q(s.q, k => k.level === s.level);
    case 'COMPARE':
      return q(s.q, k => cmp(s.dir, s.axis, k));
    case 'GENDER_COMPARE':
      return K.some(k => k.gender === s.gender && cmp(s.dir, s.axis, k));
    default:
      return assertNever(s);
  }
}
// #endregion

// #region findmodels
export interface Slot {
  readonly speaker: SuspectId;
  readonly statement: Statement;
}

export function combos<T>(arr: readonly T[], k: number): T[][] {
  const out: T[][] = [];
  const go = (start: number, acc: T[]) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      acc.push(arr[i]);
      go(i + 1, acc);
      acc.pop();
    }
  };
  go(0, []);
  return out;
}

/**
 * Solver FIEL: un mundo es modelo ⇔ para todo hablante p: (p ∈ mentirosos) ⇔ su afirmación (leída) es falsa en ese mundo.
 * Enumera (asesinos × mentirosos) y corta en `limit` (2 basta para comprobar unicidad).
 */
export function findModels(
  slots: readonly Slot[],
  witnesses: ReadonlySet<WitnessId>,
  nKillers: number,
  nLiars: number,
  limit = 2,
): World[] {
  const ids = slots.map(s => s.speaker);
  const read = slots.map(s => readAs(s.statement, witnesses));
  const found: World[] = [];
  const liarSets = combos(ids, nLiars).map(l => new Set(l));
  for (const K of combos(ids, nKillers)) {
    const killers = new Set(K);
    for (const liars of liarSets) {
      const w: World = {killers, liars};
      if (slots.every((sl, i) => liars.has(sl.speaker) === !holds(read[i], sl.speaker, w))) {
        found.push(w);
        if (found.length >= limit) {
          return found;
        }
      }
    }
  }
  return found;
}
// #endregion

// #region render
// ---- Render ES (reproduce EXACTAMENTE los textos actuales: la narrativa no cambia) ----
const LEVEL_ES = ['Muy Arisco', 'Arisco', 'Cariñoso', 'Muy Cariñoso'] as const;
export function renderEs(s: Statement): string {
  const Q = (q: Quant) => (q === 'SOME' ? 'Al menos un' : 'Ningún');
  const G = (g: Gender) => (g === 'M' ? 'un chico' : 'una chica');
  const D = (d: Dir) => (d === 'MORE' ? 'más' : 'menos');
  const A = (a: Axis) => (a === 'WARM' ? 'cariñoso' : 'arisco');
  switch (s.kind) {
    case 'SELF_GUILTY':
      return 'He sido yo.';
    case 'SELF_INNOCENT':
      return 'Yo no he sido.';
    case 'ACCUSE':
      return `Ha sido ${s.target}.`;
    case 'CLEAR':
      return `No ha sido ${s.target}.`;
    case 'LIAR':
      return `${s.target} miente.`;
    case 'TRUTHFUL':
      return `${s.target} dice la verdad.`;
    case 'GENDER':
      return `${Q(s.q)} asesino es ${G(s.gender)}.`;
    case 'TRAIT':
      return `${Q(s.q)} asesino es ${LEVEL_ES[s.level]}.`;
    case 'COMPARE':
      return `${Q(s.q)} asesino es ${D(s.dir)} ${A(s.axis)} que yo.`;
    case 'GENDER_COMPARE':
      return `Al menos un asesino es ${G(s.gender)} y ${D(s.dir)} ${A(s.axis)} que yo.`;
    default:
      return assertNever(s);
  }
}

/** Pool completo de afirmaciones posibles para un hablante (mismo tamaño que el generarPool actual). */
export function poolFor(speaker: SuspectId, present: readonly SuspectId[]): Statement[] {
  const out: Statement[] = [{kind: 'SELF_GUILTY'}, {kind: 'SELF_INNOCENT'}];
  for (const t of present) {
    if (t !== speaker) {
      out.push(
        {kind: 'ACCUSE', target: t},
        {kind: 'CLEAR', target: t},
        {kind: 'LIAR', target: t},
        {kind: 'TRUTHFUL', target: t},
      );
    }
  }
  for (const q of ['SOME', 'NONE'] as const) {
    for (const g of ['M', 'F'] as const) {
      out.push({kind: 'GENDER', q, gender: g});
    }
    for (const l of [0, 1, 2, 3] as const) {
      out.push({kind: 'TRAIT', q, level: l});
    }
    for (const axis of ['WARM', 'COLD'] as const) {
      for (const dir of ['MORE', 'LESS'] as const) {
        out.push({kind: 'COMPARE', q, dir, axis});
      }
    }
  }
  for (const gender of ['M', 'F'] as const) {
    for (const axis of ['WARM', 'COLD'] as const) {
      for (const dir of ['MORE', 'LESS'] as const) {
        out.push({kind: 'GENDER_COMPARE', gender, dir, axis});
      }
    }
  }
  return out;
}

// ---- RNG con semilla (reproducibilidad: un caso = seed + config) ----
// #endregion

// #region rng
export type Rng = () => number;
export const mulberry32 =
  (seed: number): Rng =>
  () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
export const shuffled = <T>(arr: readonly T[], rnd: Rng): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export interface CaseConfig {
  suspects: number;
  killers: number;
  liars: number;
  witnesses: number;
  pickedSuspects?: SuspectId[];
  pickedWitnesses?: WitnessId[];
}
export interface GameCase {
  seed: number;
  rulesVersion: 1;
  witnesses: WitnessId[];
  slots: Slot[];
  solution: {killers: SuspectId[]; liars: SuspectId[]};
}

export function generateOnce(cfg: CaseConfig, seed: number, maxAttempts = 15000): GameCase | null {
  const rnd = mulberry32(seed);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const present =
      cfg.pickedSuspects ??
      shuffled(
        SUSPECTS.map(s => s.id),
        rnd,
      ).slice(0, cfg.suspects);
    const wit = cfg.pickedWitnesses ?? shuffled(WITNESSES, rnd).slice(0, cfg.witnesses);
    const active = new Set<WitnessId>(wit);
    let slots: Slot[] | null = null;
    for (let tr = 0; tr < 100 && !slots; tr++) {
      const used = new Set<string>();
      const chosen: Slot[] = [];
      for (const sp of shuffled(present, rnd)) {
        const options = poolFor(sp, present).filter(st => !used.has(renderEs(st)));
        if (!options.length) {
          break;
        }
        const need = new Set(
          wit.filter(w => chosen.filter(c => affectedBy(c.statement).includes(w)).length < 2),
        );
        const prio = options.filter(st => affectedBy(st).some(w => need.has(w)));
        const pool = prio.length > 0 && rnd() < 0.85 ? prio : options;
        const st = pool[Math.floor(rnd() * pool.length)];
        chosen.push({speaker: sp, statement: st});
        used.add(renderEs(st));
      }
      if (
        chosen.length === present.length &&
        wit.every(w => chosen.filter(c => affectedBy(c.statement).includes(w)).length >= 2)
      ) {
        slots = chosen;
      }
    }
    if (!slots) {
      continue;
    }
    const models = findModels(slots, active, cfg.killers, cfg.liars, 2);
    if (models.length === 1) {
      const m = models[0];
      return {
        seed,
        rulesVersion: 1,
        witnesses: wit,
        slots,
        solution: {killers: [...m.killers], liars: [...m.liars]},
      };
    }
  }
  return null;
}
// #endregion

// #region explain
export interface Explanation {
  speaker: SuspectId;
  said: string; // lo que pone en la carta
  read: string; // lo que significa con los testigos activos
  readDiffers: boolean; // ¿algún testigo cambió la lectura?
  holdsInTruth: boolean; // ¿es cierto en la solución real?
  isLiar: boolean;
}

/** Recap post-partida: "dijo X → significaba Y → era verdad/mentira". Sin tocar ninguna regla. */
export function explain(c: GameCase): Explanation[] {
  const active = new Set<WitnessId>(c.witnesses);
  const world: World = {killers: new Set(c.solution.killers), liars: new Set(c.solution.liars)};
  return c.slots.map(sl => {
    const read = readAs(sl.statement, active);
    return {
      speaker: sl.speaker,
      said: renderEs(sl.statement),
      read: renderEs(read),
      readDiffers: renderEs(read) !== renderEs(sl.statement),
      holdsInTruth: holds(read, sl.speaker, world),
      isLiar: world.liars.has(sl.speaker),
    };
  });
}
// #endregion

// #region segments
export type SegKind = 'quant' | 'gender' | 'trait' | 'name' | 'compare' | 'plain';
export interface Seg {
  text: string;
  kind: SegKind;
}

/** Mismo texto que `renderEs`, pero troceado para poder resaltar lo que importa al deducir. */
export function segmentsEs(s: Statement): Seg[] {
  const p = (text: string): Seg => ({text, kind: 'plain'});
  const k = (text: string, kind: SegKind): Seg => ({text, kind});
  const Q = (q: Quant) => k(q === 'SOME' ? 'Al menos un' : 'Ningún', 'quant');
  const G = (g: Gender) => k(g === 'M' ? 'un chico' : 'una chica', 'gender');
  const C = (d: Dir, a: Axis) =>
    k(`${d === 'MORE' ? 'más' : 'menos'} ${a === 'WARM' ? 'cariñoso' : 'arisco'}`, 'compare');
  switch (s.kind) {
    case 'SELF_GUILTY':
      return [p('He sido yo.')];
    case 'SELF_INNOCENT':
      return [p('Yo no he sido.')];
    case 'ACCUSE':
      return [p('Ha sido '), k(s.target, 'name'), p('.')];
    case 'CLEAR':
      return [p('No ha sido '), k(s.target, 'name'), p('.')];
    case 'LIAR':
      return [k(s.target, 'name'), p(' miente.')];
    case 'TRUTHFUL':
      return [k(s.target, 'name'), p(' dice la verdad.')];
    case 'GENDER':
      return [Q(s.q), p(' asesino es '), G(s.gender), p('.')];
    case 'TRAIT':
      return [Q(s.q), p(' asesino es '), k(LEVEL_ES[s.level], 'trait'), p('.')];
    case 'COMPARE':
      return [Q(s.q), p(' asesino es '), C(s.dir, s.axis), p(' que yo.')];
    case 'GENDER_COMPARE':
      return [p('Al menos un asesino es '), G(s.gender), p(' y '), C(s.dir, s.axis), p(' que yo.')];
    default:
      return assertNever(s);
  }
}
// #endregion
