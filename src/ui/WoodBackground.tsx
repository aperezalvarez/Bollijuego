import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Defs, Line, RadialGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {color} from './theme';

/** Fondo de mesa de madera: degradado radial + vetas, sin imágenes pesadas. */
export function WoodBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <RadialGradient id="w" cx="50%" cy="38%" r="85%">
          <Stop offset="0" stopColor={color.wood700} />
          <Stop offset="0.55" stopColor={color.wood800} />
          <Stop offset="1" stopColor={color.wood900} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#w)" />
      {Array.from({length: 14}, (_, i) => (
        <Line
          key={i}
          x1="0"
          x2="100%"
          y1={`${(i + 1) * 7}%`}
          y2={`${(i + 1) * 7 + (i % 2 ? 0.4 : -0.4)}%`}
          stroke="#000"
          strokeOpacity={0.14}
          strokeWidth={1}
        />
      ))}
    </Svg>
  );
}

/** Contenedor de pantalla: fondo + zonas seguras reales. */
export function Screen({
  children,
  style,
  edges = ['top', 'bottom'],
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Array<'top' | 'bottom'>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        },
        style,
      ]}>
      <WoodBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1, backgroundColor: color.wood900}});
