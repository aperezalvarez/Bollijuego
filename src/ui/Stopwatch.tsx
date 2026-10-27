import React, {memo, useEffect, useState} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** El cronómetro vive en SU componente: el tic de 1 s re-renderiza una etiqueta, no el tablero (PERF-1). */
export const Stopwatch = memo(function Stopwatch({
  getElapsedMs,
  style,
}: {
  getElapsedMs: () => number;
  style?: StyleProp<TextStyle>;
}) {
  const [ms, setMs] = useState(() => getElapsedMs());
  useEffect(() => {
    const id = setInterval(() => setMs(getElapsedMs()), 500);
    return () => clearInterval(id);
  }, [getElapsedMs]);
  return (
    <Text accessibilityRole="timer" style={[{fontVariant: ['tabular-nums']}, style]}>
      {fmtTime(ms)}
    </Text>
  );
});
