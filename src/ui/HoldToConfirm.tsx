import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {color, hit, radius} from './theme';
import {haptic} from './haptics';

/** "Entregar solución" es IRREVERSIBLE (una sola entrega): exige mantener pulsado ~0,7 s con barra de progreso. */
export function HoldToConfirm({
  label,
  disabled,
  onConfirm,
}: {
  label: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const progress = useSharedValue(0);

  const fire = () => {
    haptic('success');
    onConfirm();
  };
  const press = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(700)
    .maxDistance(24)
    .onBegin(() => {
      progress.value = withTiming(1, {duration: 700, easing: Easing.linear});
      runOnJS(haptic)('tap');
    })
    .onStart(() => {
      runOnJS(fire)();
    })
    .onFinalize(() => {
      cancelAnimation(progress);
      progress.value = withTiming(0, {duration: 160});
    });

  const bar = useAnimatedStyle(() => ({width: `${progress.value * 100}%`}));
  return (
    <GestureDetector gesture={press}>
      <Animated.View
        style={[styles.btn, disabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityHint="Mantén pulsado para entregar"
        accessibilityState={{disabled}}>
        <Animated.View style={[styles.fill, bar]} />
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: hit.min + 8,
    borderRadius: radius.md,
    backgroundColor: color.wood700,
    borderWidth: 2,
    borderColor: color.gold,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: color.sage},
  disabled: {opacity: 0.45},
  label: {color: color.textOnDark, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase'},
});
