import {useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect} from 'react';
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {IconButton} from './Button';
import {color, overlay, type as T} from './theme';

/**
 * Hoja modal real: es una RUTA de la pila de navegación (el botón «Atrás» de Android la cierra),
 * con entrada animada, scrim, gesto de arrastre para cerrar y zonas seguras.
 */
export function Sheet({title, children, tall}: {title: string; children: React.ReactNode; tall?: boolean}) {
  const nav = useNavigation();
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(height);
  const scrim = useSharedValue(0);

  useEffect(() => {
    y.value = withTiming(0, {duration: 260, easing: Easing.out(Easing.cubic)});
    scrim.value = withTiming(1, {duration: 220});
  }, [y, scrim]);

  const close = useCallback(() => {
    if (nav.canGoBack()) {
      nav.goBack();
    }
  }, [nav]);
  const animateClose = useCallback(() => {
    scrim.value = withTiming(0, {duration: 180});
    y.value = withTiming(height, {duration: 200}, done => {
      if (done) {
        runOnJS(close)();
      }
    });
  }, [height, scrim, y, close]);

  const drag = Gesture.Pan()
    .onUpdate(e => {
      y.value = Math.max(0, e.translationY);
    })
    .onEnd(e => {
      if (e.translationY > 110 || e.velocityY > 900) {
        runOnJS(animateClose)();
      } else {
        y.value = withTiming(0, {duration: 160});
      }
    });

  const panel = useAnimatedStyle(() => ({transform: [{translateY: y.value}]}));
  const back = useAnimatedStyle(() => ({opacity: scrim.value}));

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, {backgroundColor: overlay}, back]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={animateClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.panel,
          tall && styles.tall,
          {paddingBottom: Math.max(insets.bottom, 12), maxHeight: height - insets.top - 12},
          panel,
        ]}>
        <GestureDetector gesture={drag}>
          <View>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              <IconButton icon="close" label="Cerrar" onPress={animateClose} />
            </View>
          </View>
        </GestureDetector>
        <View style={tall ? styles.bodyTall : styles.body}>{children}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  panel: {
    backgroundColor: color.wood800,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 2,
    borderColor: color.brass,
    paddingHorizontal: 16,
    minHeight: 220,
  },
  tall: {height: '92%'},
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.brass,
    marginTop: 8,
    opacity: 0.8,
  },
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6},
  title: {...T.h2, color: color.gold, flex: 1},
  body: {flexShrink: 1},
  bodyTall: {flex: 1},
});
