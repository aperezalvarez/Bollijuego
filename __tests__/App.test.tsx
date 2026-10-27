import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {useStore} from '../src/state/store';

it('la app arranca y muestra la portada con «Solitario» y «Multijugador local»', async () => {
  const App = require('../App').default;
  await useStore.persist.rehydrate();
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<App />);
  });
  const labels = tree.root
    .findAll(n => typeof n.props.accessibilityLabel === 'string')
    .map(n => n.props.accessibilityLabel);
  expect(labels).toEqual(expect.arrayContaining(['Solitario', 'Multijugador local', 'Tutorial / Reglas']));
  tree.unmount();
});
