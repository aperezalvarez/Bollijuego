import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type {LinkState} from '../net/protocol';
import {color} from './theme';

const TONE: Record<LinkState, {c: string; label: string}> = {
  connecting: {c: color.textMuted, label: 'Conectando'},
  ok: {c: '#7fae62', label: 'Conectado'},
  degraded: {c: color.gold, label: 'Conexión inestable'},
  reconnecting: {c: '#d9674f', label: 'Reconectando'},
  left: {c: '#6b5a44', label: 'Se fue'},
};

/** Punto de estado del enlace (verde / ámbar / rojo pulsante) con etiqueta accesible. */
export function ConnectionDot({
  link,
  rttMs,
  showLabel,
}: {
  link: LinkState;
  rttMs?: number;
  showLabel?: boolean;
}) {
  const pulse = useSharedValue(1);
  const t = TONE[link];
  useEffect(() => {
    if (link === 'reconnecting' || link === 'connecting') {
      pulse.value = withRepeat(withTiming(0.25, {duration: 600}), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
  }, [link, pulse]);
  const dot = useAnimatedStyle(() => ({opacity: pulse.value}));
  const text = `${t.label}${rttMs !== undefined && link === 'ok' ? ` · ${rttMs} ms` : ''}`;
  return (
    <View style={styles.row} accessible accessibilityLabel={text}>
      <Animated.View style={[styles.dot, {backgroundColor: t.c}, dot]} />
      {showLabel ? <Text style={[styles.text, {color: t.c}]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 11, height: 11, borderRadius: 6},
  text: {fontSize: 12, fontWeight: '700'},
});
