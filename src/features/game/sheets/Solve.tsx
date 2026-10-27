import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNav} from '../../../app/nav';
import type {SuspectId} from '../../../domain';
import {useStore} from '../../../state/store';
import {Icon} from '../../../ui/Icon';
import {HoldToConfirm} from '../../../ui/HoldToConfirm';
import {Sheet} from '../../../ui/Sheet';
import {GenderBadge} from '../../../ui/cards';
import {suspectOf} from '../../../domain';
import {haptic} from '../../../ui/haptics';
import {color, hit, radius, type as T} from '../../../ui/theme';
import {submitAnswer} from '../../runtime';
import {Pressable} from 'react-native';

export function SolveSheet() {
  const nav = useNav();
  const game = useStore(s => s.game);
  const marks = useStore(s => s.marks);
  const speakers = game?.pub.slots.map(s => s.speaker) ?? [];
  // se parte de lo que el jugador ya marcó en el tablero
  const [killers, setKillers] = useState<SuspectId[]>(() =>
    speakers.filter(id => marks[id]?.guilt === 'guilty'),
  );
  const [liars, setLiars] = useState<SuspectId[]>(() => speakers.filter(id => marks[id]?.honesty === 'liar'));
  if (!game) {
    return (
      <Sheet title="Resolver">
        <View />
      </Sheet>
    );
  }
  const nK = game.pub.killers;
  const nL = game.pub.liars;
  const toggle = (list: SuspectId[], set: (v: SuspectId[]) => void, id: SuspectId) => {
    haptic('select');
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };
  const okCount = killers.length === nK && liars.length === nL;

  return (
    <Sheet title="Entregar solución" tall>
      <Text style={styles.goal}>
        Objetivo: <Text style={styles.num}>{nK}</Text> {nK === 1 ? 'asesino' : 'asesinos'} y{' '}
        <Text style={styles.num}>{nL}</Text> {nL === 1 ? 'mentiroso' : 'mentirosos'}
      </Text>
      <Text style={styles.warn}>
        Sólo tienes UNA entrega. Un sospechoso puede ser asesino y mentiroso a la vez.
      </Text>
      <View style={styles.head}>
        <Text style={[styles.col, {flex: 1.2}]} />
        <Text style={styles.col}>Asesino</Text>
        <Text style={styles.col}>Mentiroso</Text>
      </View>
      <ScrollView style={{flexShrink: 1}} contentContainerStyle={{gap: 8, paddingBottom: 8}}>
        {speakers.map(id => (
          <View key={id} style={styles.row}>
            <View style={styles.who}>
              <GenderBadge gender={suspectOf(id).gender} size={26} />
              <Text style={styles.name} numberOfLines={1}>
                {id}
              </Text>
            </View>
            <Toggle
              on={killers.includes(id)}
              icon="knife"
              label={`${id} es asesino`}
              onPress={() => toggle(killers, setKillers, id)}
            />
            <Toggle
              on={liars.includes(id)}
              icon="mask"
              label={`${id} es mentiroso`}
              onPress={() => toggle(liars, setLiars, id)}
            />
          </View>
        ))}
      </ScrollView>
      <Text style={[styles.count, !okCount && {color: color.textMuted}]} accessibilityLiveRegion="polite">
        {killers.length}/{nK} asesinos · {liars.length}/{nL} mentirosos
      </Text>
      <HoldToConfirm
        label={okCount ? 'Mantén pulsado para entregar' : 'Completa la selección'}
        disabled={!okCount}
        onConfirm={() => {
          const out = submitAnswer({killers, liars});
          if (out === 'sent') {
            nav.goBack();
          }
        }}
      />
    </Sheet>
  );
}

function Toggle({
  on,
  icon,
  label,
  onPress,
}: {
  on: boolean;
  icon: 'knife' | 'mask';
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{checked: on}}
        onPress={onPress}
        style={[styles.toggle, on && styles.toggleOn]}>
        <Icon name={icon} size={24} color={on ? color.textOnDark : color.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  goal: {...T.body, color: color.textOnDark, textAlign: 'center', marginVertical: 4},
  num: {color: color.gold, fontWeight: '800', fontSize: 20},
  warn: {...T.small, color: color.textMuted, textAlign: 'center', marginBottom: 8},
  head: {flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderColor: color.brass},
  col: {
    flex: 1,
    color: color.gold,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    paddingHorizontal: 8,
  },
  who: {flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8},
  name: {color: color.textOnDark, fontWeight: '800', fontSize: 15, fontFamily: 'serif', flexShrink: 1},
  toggle: {
    width: hit.min + 8,
    height: hit.min + 8,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: color.brass,
    backgroundColor: color.wood800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOn: {backgroundColor: color.blood, borderColor: color.textOnDark},
  count: {color: color.gold, fontWeight: '800', textAlign: 'center', marginVertical: 8, fontSize: 15},
});
