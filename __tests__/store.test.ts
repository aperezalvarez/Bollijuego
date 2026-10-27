/** @jest-environment node */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PRESETS, generateCase, toPublic, type GameCase} from '../src/domain';
import {canContinue, elapsedOf, useStore} from '../src/state/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mk = (): GameCase => {
  const r = generateCase(PRESETS.normal, 11);
  if (!r.ok) {
    throw new Error('gen');
  }
  return r.value;
};
const start = (mode: 'solo' | 'versus' = 'solo') => {
  const g = mk();
  useStore.getState().startGame({
    mode,
    role: mode === 'solo' ? 'solo' : 'host',
    pub: toPublic(g),
    solution: g.solution,
    config: PRESETS.normal,
  });
  return g;
};

beforeEach(async () => {
  jest.useRealTimers();
  useStore.getState().endGame();
  useStore.getState().resetStats();
  await AsyncStorage.clear();
});

it('marcas: asesino/mentiroso/descartado alternan y son independientes', () => {
  start();
  const s = useStore.getState();
  s.toggleGuilt('Pork', 'guilty');
  s.toggleLiar('Pork');
  expect(useStore.getState().marks.Pork).toEqual({guilt: 'guilty', honesty: 'liar'});
  s.toggleGuilt('Pork', 'innocent');
  expect(useStore.getState().marks.Pork?.guilt).toBe('innocent');
  s.toggleGuilt('Pork', 'innocent');
  expect(useStore.getState().marks.Pork?.guilt).toBeNull();
});

it('el reloj se pausa en segundo plano y no cuenta el tiempo pausado', () => {
  const now = jest.spyOn(Date, 'now');
  now.mockReturnValue(1_000);
  start();
  now.mockReturnValue(6_000);
  useStore.getState().pauseClock();
  now.mockReturnValue(100_000);
  expect(elapsedOf(useStore.getState().game!)).toBe(5_000);
  useStore.getState().resumeClock();
  now.mockReturnValue(103_000);
  expect(elapsedOf(useStore.getState().game!)).toBe(8_000);
  now.mockRestore();
});

it('borrador: trazos, deshacer y goma real', () => {
  start();
  const s = useStore.getState();
  s.addStroke({color: '#000', width: 3, pts: [10, 10, 20, 20]});
  s.addStroke({color: '#000', width: 3, pts: [200, 200, 220, 220]});
  s.eraseAt(12, 12, 8);
  expect(useStore.getState().strokes).toHaveLength(1);
  s.undoStroke();
  expect(useStore.getState().strokes).toHaveLength(0);
});

it('finishGame actualiza estadísticas una sola vez y la práctica no cuenta', () => {
  const g = start();
  useStore.getState().finishGame({correct: true, ms: 42_000, submission: g.solution});
  useStore.getState().finishGame({correct: false, ms: 1, submission: g.solution});
  const st = useStore.getState().stats;
  expect(st).toMatchObject({played: 1, won: 1, bestMs: 42_000});
  const g2 = mk();
  useStore.getState().startGame({
    mode: 'solo',
    role: 'solo',
    pub: toPublic(g2),
    solution: g2.solution,
    config: PRESETS.normal,
    practice: true,
  });
  useStore.getState().finishGame({correct: true, ms: 1, submission: g2.solution});
  expect(useStore.getState().stats.played).toBe(1);
});

it('CONTINUAR PARTIDA: tras cerrar la app se restauran caso, reloj, marcas y notas', async () => {
  const g = start();
  const s = useStore.getState();
  s.reveal('Tavio');
  s.toggleGuilt('Lolo', 'guilty');
  s.addStroke({color: '#8e2a22', width: 4, pts: [1, 2, 3, 4]});
  const now = jest.spyOn(Date, 'now');
  now.mockReturnValue(Date.now() + 90_000);
  useStore.getState().pauseClock(); // lo que ocurre al pasar a segundo plano
  now.mockRestore();
  await new Promise(r => setTimeout(r, 20));

  // «Android mata el proceso»: lo que hay en disco es lo último escrito; la memoria se pierde…
  const onDisk = await AsyncStorage.getItem('quien-mato-a-la-gallina.v2');
  expect(onDisk).toContain(String(g.seed));
  useStore.setState({game: null, revealed: {}, marks: {}, strokes: []});
  await new Promise(r => setTimeout(r, 20));
  await AsyncStorage.setItem('quien-mato-a-la-gallina.v2', onDisk as string); // (el setState anterior solo vació la memoria simulada)
  // …y al reabrir se rehidrata desde disco
  await useStore.persist.rehydrate();
  const r = useStore.getState();
  expect(canContinue(r.game)).toBe(true);
  expect(r.game?.pub.seed).toBe(g.seed);
  expect(r.game?.solution).toEqual(g.solution);
  expect(r.game?.paused).toBe(true);
  expect(elapsedOf(r.game!)).toBeGreaterThanOrEqual(89_000);
  expect(r.revealed.Tavio).toBe(true);
  expect(r.marks.Lolo?.guilt).toBe('guilty');
  expect(r.strokes).toHaveLength(1);
});

it('las partidas Versus no se restauran (la sesión de red ya no existe)', async () => {
  start('versus');
  await new Promise(r => setTimeout(r, 20));
  expect(await AsyncStorage.getItem('quien-mato-a-la-gallina.v2')).toContain('"game":null');
});
