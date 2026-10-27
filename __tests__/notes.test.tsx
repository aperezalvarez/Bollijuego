import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {PRESETS, generateCase, toPublic} from '../src/domain';
import {useStore} from '../src/state/store';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({goBack: jest.fn(), navigate: jest.fn(), canGoBack: () => true}),
  useRoute: () => ({params: {}}),
}));

const startGame = () => {
  const r = generateCase(PRESETS.normal, 11);
  if (!r.ok) {
    throw new Error('gen');
  }
  useStore.getState().startGame({
    mode: 'solo',
    role: 'solo',
    pub: toPublic(r.value),
    solution: r.value.solution,
    config: PRESETS.normal,
  });
};

describe('Cuaderno de notas', () => {
  beforeEach(() => startGame());

  it.each(['tabla', 'dibujo'] as const)('abre la pestaña «%s» sin bucles de render', async tab => {
    useStore.getState().setNotesTab(tab);
    const {NotesSheet} = require('../src/features/game/sheets/Notes');
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<NotesSheet />);
    });
    expect(tree.toJSON()).not.toBeNull();
    tree.unmount();
  });

  it('abre sin partida activa (estado nulo)', async () => {
    useStore.getState().endGame();
    const {NotesSheet} = require('../src/features/game/sheets/Notes');
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<NotesSheet />);
    });
    tree.unmount();
  });
});
