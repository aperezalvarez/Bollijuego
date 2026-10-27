import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import {MODE_LABEL, dayKey} from '../../domain';
import {useStore} from '../../state/store';
import {Header, Plate} from '../../ui/Controls';
import {Icon} from '../../ui/Icon';
import {fmtTime} from '../../ui/Stopwatch';
import {Screen} from '../../ui/WoodBackground';
import {color, radius, type as T} from '../../ui/theme';

export function Stats({navigation}: NativeStackScreenProps<RootStackParamList, 'Stats'>) {
  const st = useStore(s => s.stats);
  const rate = st.played ? Math.round((st.won / st.played) * 100) : 0;
  const avg = st.won ? st.totalWonMs / st.won : null;
  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return {k, label: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()], r: st.daily[k]};
  });
  return (
    <Screen>
      <Header title="Estadísticas" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          <Tile label="Partidas" value={String(st.played)} />
          <Tile label="Aciertos" value={String(st.won)} />
          <Tile label="% acierto" value={`${rate}%`} />
          <Tile label="Mejor tiempo" value={st.bestMs === null ? '—' : fmtTime(st.bestMs)} />
          <Tile label="Tiempo medio" value={avg === null ? '—' : fmtTime(avg)} />
        </View>
        <Plate title="Por modo">
          {Object.keys(MODE_LABEL).map(m => {
            const x = st.byMode[m] ?? {played: 0, won: 0};
            return (
              <View key={m} style={styles.row}>
                <Text style={styles.body}>{MODE_LABEL[m as keyof typeof MODE_LABEL]}</Text>
                <Text style={styles.val}>
                  {x.won}/{x.played}
                </Text>
              </View>
            );
          })}
        </Plate>
        <Plate title="Reto diario · últimos 7 días">
          <View style={styles.days}>
            {days.map(d => (
              <View
                key={d.k}
                style={styles.day}
                accessible
                accessibilityLabel={`${d.k}: ${d.r ? (d.r.won ? 'acertado' : 'fallado') : 'sin jugar'}`}>
                <Text style={styles.dl}>{d.label}</Text>
                <View style={[styles.dot, d.r && {backgroundColor: d.r.won ? color.sage : color.blood}]}>
                  {d.r ? (
                    <Icon name={d.r.won ? 'check' : 'close'} size={16} color={color.textOnDark} />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Plate>
      </ScrollView>
    </Screen>
  );
}

const Tile = ({label, value}: {label: string; value: string}) => (
  <View style={styles.tile}>
    <Text style={styles.tv}>{value}</Text>
    <Text style={styles.tl}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14, paddingBottom: 40},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: 'rgba(43,28,18,0.92)',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.brass,
    padding: 14,
    alignItems: 'center',
  },
  tv: {
    color: color.gold,
    fontFamily: 'serif',
    fontWeight: '800',
    fontSize: 26,
    fontVariant: ['tabular-nums'],
  },
  tl: {color: color.textMuted, fontSize: 12, fontWeight: '700'},
  row: {flexDirection: 'row', justifyContent: 'space-between', minHeight: 36, alignItems: 'center'},
  body: {...T.body, color: color.textOnDark},
  val: {color: color.gold, fontWeight: '800', fontSize: 16},
  days: {flexDirection: 'row', justifyContent: 'space-between'},
  day: {alignItems: 'center', gap: 6},
  dl: {color: color.textMuted, fontWeight: '800', fontSize: 12},
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.wood900,
    borderWidth: 1.5,
    borderColor: color.wood700,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
