/* eslint-disable no-bitwise -- PRNG, hash FNV y aritmética de IPv4 */
/** @jest-environment node */
// Paridad: el dominio nuevo debe dar el MISMO valor de verdad que el motor antiguo congelado en fixtures.
import {evaluarTestimonio, generarPool, PERSONAJES} from './fixtures/legacyMotor';
import * as D from '../src/domain';

function parse(texto: string): D.Statement {
  let m: RegExpMatchArray | null;
  const Q = (s: string): D.Quant => (s === 'Ningún' ? 'NONE' : 'SOME');
  const G = (s: string): D.Gender => (s.includes('chico') ? 'M' : 'F');
  if (texto === 'He sido yo.') {
    return {kind: 'SELF_GUILTY'};
  }
  if (texto === 'Yo no he sido.') {
    return {kind: 'SELF_INNOCENT'};
  }
  if ((m = texto.match(/^Ha sido (.+)\.$/))) {
    return {kind: 'ACCUSE', target: m[1] as D.SuspectId};
  }
  if ((m = texto.match(/^No ha sido (.+)\.$/))) {
    return {kind: 'CLEAR', target: m[1] as D.SuspectId};
  }
  if ((m = texto.match(/^(.+) miente\.$/))) {
    return {kind: 'LIAR', target: m[1] as D.SuspectId};
  }
  if ((m = texto.match(/^(.+) dice la verdad\.$/))) {
    return {kind: 'TRUTHFUL', target: m[1] as D.SuspectId};
  }
  if ((m = texto.match(/^(Al menos un|Ningún) asesino es (un chico|una chica)\.$/))) {
    return {kind: 'GENDER', q: Q(m[1]), gender: G(m[2])};
  }
  if ((m = texto.match(/^(Al menos un|Ningún) asesino es (Muy Arisco|Arisco|Cariñoso|Muy Cariñoso)\.$/))) {
    return {
      kind: 'TRAIT',
      q: Q(m[1]),
      level: ['Muy Arisco', 'Arisco', 'Cariñoso', 'Muy Cariñoso'].indexOf(m[2]) as D.Level,
    };
  }
  if ((m = texto.match(/^(Al menos un|Ningún) asesino es (más|menos) (cariñoso|arisco) que yo\.$/))) {
    return {
      kind: 'COMPARE',
      q: Q(m[1]),
      dir: m[2] === 'más' ? 'MORE' : 'LESS',
      axis: m[3] === 'cariñoso' ? 'WARM' : 'COLD',
    };
  }
  if (
    (m = texto.match(
      /^Al menos un asesino es (un chico|una chica) y (más|menos) (cariñoso|arisco) que yo\.$/,
    ))
  ) {
    return {
      kind: 'GENDER_COMPARE',
      gender: G(m[1]),
      dir: m[2] === 'más' ? 'MORE' : 'LESS',
      axis: m[3] === 'cariñoso' ? 'WARM' : 'COLD',
    };
  }
  throw new Error('texto no reconocido: ' + texto);
}

const pool = generarPool(PERSONAJES);

test('mismo pool: 464 textos, ida y vuelta y mismas etiquetas de testigo', () => {
  expect(pool).toHaveLength(464);
  for (const t of pool) {
    const st = parse(t.texto);
    expect(D.renderEs(st)).toBe(t.texto);
    expect([...t.tags].sort()).toEqual(D.affectedBy(st).sort());
  }
});

test('misma verdad en 1 057 536 evaluaciones (16 testigos × asesinos × afirmaciones)', () => {
  const dict: Record<string, unknown> = {};
  PERSONAJES.forEach(
    (p: {nombre: string}) =>
      (dict[p.nombre] = {
        personaje: p,
        testimonio: pool.find((t: {speaker: string}) => t.speaker === p.nombre),
      }),
  );
  let n = 0;
  for (let mask = 0; mask < 16; mask++) {
    const W = new Set(D.WITNESSES.filter((_, i) => mask & (1 << i)));
    for (let k = 1; k <= 4; k++) {
      for (const A of D.combos(PERSONAJES as {nombre: string}[], k)) {
        const world: D.World = {killers: new Set(A.map(p => p.nombre as D.SuspectId)), liars: new Set()};
        for (const t of pool) {
          const st = parse(t.texto);
          if ((st.kind === 'LIAR' || st.kind === 'TRUTHFUL') && !W.has('Croqueta Batista')) {
            continue;
          }
          const sp = PERSONAJES.find((p: {nombre: string}) => p.nombre === t.speaker)!;
          const legacy = evaluarTestimonio(sp, t, A as never, dict as never, [...W]);
          if (legacy !== D.holds(D.readAs(st, W), t.speaker as D.SuspectId, world)) {
            throw new Error(`difiere: ${t.texto}`);
          }
          n++;
        }
      }
    }
  }
  expect(n).toBe(1057536);
});
