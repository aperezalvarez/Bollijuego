/** @jest-environment node */
import * as D from '../src/domain';

describe('dominio: AST y render', () => {
  const ids = D.SUSPECTS.map(s => s.id);
  it('el pool reproduce los 464 textos y segmentsEs coincide con renderEs', () => {
    let n = 0;
    for (const s of ids) {
      for (const st of D.poolFor(s, ids)) {
        n++;
        expect(
          D.segmentsEs(st)
            .map(x => x.text)
            .join(''),
        ).toBe(D.renderEs(st));
      }
    }
    expect(n).toBe(464);
  });
  it('readAs: Croqueta convierte «miente» en «inocente»', () => {
    expect(D.readAs({kind: 'LIAR', target: 'Pork'}, new Set(['Croqueta Batista']))).toEqual({
      kind: 'CLEAR',
      target: 'Pork',
    });
    expect(D.readAs({kind: 'TRUTHFUL', target: 'Pork'}, new Set(['Croqueta Batista']))).toEqual({
      kind: 'ACCUSE',
      target: 'Pork',
    });
  });
  it('Mr. Red y La Vicente no se encadenan', () => {
    const both = new Set<D.WitnessId>(['Mr. Red', 'La Vicente']);
    expect(D.readAs({kind: 'TRAIT', q: 'SOME', level: 1}, both)).toEqual({
      kind: 'TRAIT',
      q: 'SOME',
      level: 2,
    });
    expect(D.readAs({kind: 'TRAIT', q: 'SOME', level: 2}, both)).toEqual({
      kind: 'TRAIT',
      q: 'SOME',
      level: 1,
    });
    expect(D.readAs({kind: 'COMPARE', q: 'SOME', dir: 'MORE', axis: 'COLD'}, both).kind).toBe('COMPARE');
  });
});

describe('generador', () => {
  it('config inválida devuelve error tipado, nunca un caso vacío', () => {
    const r = D.generateCase({suspects: 2, killers: 1, liars: 1, witnesses: 0}, 1);
    expect(r.ok).toBe(false);
  });
  it('todas las configuraciones de la UI generan casos con exactamente un modelo', () => {
    let count = 0;
    for (let s = 3; s <= 8; s++) {
      for (let a = 1; a <= D.maxKillers(s); a++) {
        for (let m = 1; m <= D.maxLiars(s); m++) {
          for (let w = 0; w <= D.maxWitnesses(s); w++) {
            const r = D.generateCase(
              {suspects: s, killers: a, liars: m, witnesses: w},
              100 + s * 7 + a * 3 + m + w,
            );
            expect(r.ok).toBe(true);
            if (!r.ok) {
              return;
            }
            const models = D.findModels(r.value.slots, new Set(r.value.witnesses), a, m, 3);
            expect(models).toHaveLength(1);
            expect(
              D.isCorrect(r.value, {killers: r.value.solution.killers, liars: r.value.solution.liars}),
            ).toBe(true);
            count++;
          }
        }
      }
    }
    expect(count).toBe(157);
  });
  it('es reproducible por semilla y coincide con solvePublic', () => {
    const cfg = D.PRESETS.normal;
    const a = D.generateCase(cfg, 20261027),
      b = D.generateCase(cfg, 20261027);
    expect(a).toEqual(b);
    if (!a.ok) {
      throw new Error('x');
    }
    const solved = D.solvePublic(D.toPublic(a.value));
    expect(solved?.solution).toEqual(a.value.solution);
  });
  it('explain es coherente: mentiroso ⇔ afirmación falsa', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const r = D.generateCase(D.PRESETS.dificil, seed);
      if (!r.ok) {
        throw new Error('gen');
      }
      for (const e of D.explain(r.value)) {
        expect(e.isLiar).toBe(!e.holdsInTruth);
      }
    }
  });
  it('reto diario: misma semilla el mismo día, distinta otro día', () => {
    const d1 = new Date(2026, 9, 27),
      d2 = new Date(2026, 9, 28);
    expect(D.dailySeed(d1)).toBe(D.dailySeed(new Date(2026, 9, 27, 23)));
    expect(D.dailySeed(d1)).not.toBe(D.dailySeed(d2));
  });
});

describe('ENG-1: ciclos de «X miente»', () => {
  it('un ciclo impar no tiene ningún modelo y el solver lo rechaza', () => {
    const slots: D.Slot[] = [
      {speaker: 'Tavio', statement: {kind: 'LIAR', target: 'Charls'}},
      {speaker: 'Reisy', statement: {kind: 'LIAR', target: 'Tavio'}},
      {speaker: 'Charls', statement: {kind: 'LIAR', target: 'Reisy'}},
      {speaker: 'Pork', statement: {kind: 'TRAIT', q: 'NONE', level: 1}},
    ];
    expect(D.findModels(slots, new Set(), 1, 1, 5)).toHaveLength(0);
  });
});
