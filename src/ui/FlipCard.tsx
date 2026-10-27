import React, {useEffect} from 'react';
import {Pressable, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {CARD_ASPECT} from './theme';

interface Props {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
  onPress?: () => void;
  onFlipDone?: (flipped: boolean) => void;
  style?: StyleProp<ViewStyle>;
  /** Radio de las caras (por defecto 12). */
  radius?: number;
}

/** Volteo 3D en el hilo UI (worklets): 0 → 1 = dorso → cara. Respeta "reducir movimiento" del sistema. */
export function FlipCard({front, back, flipped, onPress, onFlipDone, style, radius = 12}: Props) {
  const p = useSharedValue(flipped ? 1 : 0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const target = flipped ? 1 : 0;
    if (reduce) {
      p.value = withTiming(target, {duration: 120});
      return;
    }
    p.value = withSpring(target, {damping: 16, stiffness: 140, mass: 0.9}, finished => {
      if (finished && onFlipDone) {
        /* runOnJS(onFlipDone)(flipped) en la app real */
      }
    });
  }, [flipped, reduce, p, onFlipDone]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [{perspective: 900}, {rotateY: `${interpolate(p.value, [0, 1], [0, 180])}deg`}],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{perspective: 900}, {rotateY: `${interpolate(p.value, [0, 1], [180, 360])}deg`}],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={[styles.box, style]}
      accessibilityRole="button"
      accessibilityState={{expanded: flipped}}>
      <Animated.View style={[styles.face, {borderRadius: radius}, backStyle]}>{back}</Animated.View>
      <Animated.View style={[styles.face, {borderRadius: radius}, frontStyle]}>{front}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {aspectRatio: CARD_ASPECT, width: '100%'},
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
});
