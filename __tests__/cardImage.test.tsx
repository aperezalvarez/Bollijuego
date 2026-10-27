import React from 'react';
import {Image, StyleSheet} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {ART} from '../src/assets/cards';
import {CardImage, cardHeight} from '../src/ui/cards';
import {CARD_ASPECT} from '../src/ui/theme';

const imageOf = async (el: React.ReactElement) => {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(el);
  });
  return tree.root.findByType(Image);
};

describe('CardImage', () => {
  it('la imagen lleva tamaño explícito con la proporción real de la carta', async () => {
    const img = await imageOf(<CardImage source={ART.dorso} width={180} />);
    const st = StyleSheet.flatten(img.props.style);
    expect(st.width).toBe(180);
    expect(st.height).toBeCloseTo(180 / CARD_ASPECT, 5);
    expect(st.height).toBe(cardHeight(180));
    expect(img.props.resizeMode).toBe('cover');
    expect(img.props.resizeMethod).toBe('resize');
  });

  it('la portada usa contain para verse entera', async () => {
    const img = await imageOf(
      <CardImage source={ART.portada} width={200} height={200 / CARD_ASPECT} fit="contain" />,
    );
    expect(img.props.resizeMode).toBe('contain');
  });
});
