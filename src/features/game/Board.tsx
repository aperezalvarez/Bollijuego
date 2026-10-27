import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Animated, {FadeIn, ZoomIn} from 'react-native-reanimated';
import type {RootStackParamList} from '../../app/types';
import type {WitnessId} from '../../domain';
import {sessions} from '../../net/registry';
import type {PlayerInfo} from '../../net/protocol';
import {useAndroidBack} from '../../platform/lifecycle';
import {useMark, useStore} from '../../state/store';
import {Button, IconButton} from '../../ui/Button';
import {ConnectionDot} from '../../ui/ConnectionDot';
import {Icon} from '../../ui/Icon';
import {Stopwatch} from '../../ui/Stopwatch';
import {Screen} from '../../ui/WoodBackground';
import {BoardSuspect, TestimonyCard, WitnessTile} from '../../ui/cards';
import {haptic} from '../../ui/haptics';
import {sfx} from '../../ui/sound';
import {color, radius, type as T} from '../../ui/theme';
import {useRuntime} from '../runtime';

type Props = NativeStackScreenProps<RootStackParamList, 'Board'>;

export function Board({navigation}: Props) {
  const {game, hs, cs, getElapsedMs} = useRuntime();
  const {width} = useWindowDimensions();
  const multi = !!game && game.role !== 'solo';
  const submitted = useStore(s => s.submitted);

  const leave = useCallback(() => {
    sessions.closeAll();
    useStore.getState().endGame();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);

  const confirmLeave = useCallback(() => {
    Alert.alert(
      'Abandonar el caso',
      multi
        ? 'Saldrás de la partida y perderás tu progreso.'
        : 'Se guardará lo que has hecho hasta ahora si pulsas «Seguir»; si abandonas, se pierde.',
      [
        {text: 'Seguir', style: 'cancel'},
        {text: 'Abandonar', style: 'destructive', onPress: leave},
      ],
    );
    return true;
  }, [leave, multi]);
  useAndroidBack(confirmLeave);

  useEffect(() => {
    if (!game) {
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    } else {
      useStore.getState().resumeClock();
    }
  }, [game?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // fin de partida: solo/Cooperativo (entrega local) o veredicto del anfitrión (Versus)
  const sessionDone = hs?.phase === 'finished' || cs?.phase === 'finished';
  useEffect(() => {
    if (game?.finished || sessionDone) {
      navigation.reset({index: 1, routes: [{name: 'Home'}, {name: 'Result'}]});
    }
  }, [game?.finished, sessionDone, navigation]);

  const startKnown =
    game?.role === 'host'
      ? hs?.startAtHostMs != null
      : game?.role === 'guest'
      ? cs?.startAtLocalMs != null
      : true;
  const secs = useCountdown(getElapsedMs, !!multi && startKnown);

  if (!game) {
    return (
      <Screen>
        <View />
      </Screen>
    );
  }
  const pub = game.pub;
  const gap = 10;
  const two = width >= 600; // tabletas: dos parejas por fila
  const cardW = Math.min(190, two ? (width - 32 - gap * 3) / 4 : (width - 32 - gap) / 2);
  const roster: PlayerInfo[] = hs?.roster ?? cs?.roster ?? [];
  const ownLink =
    game.role === 'guest'
      ? cs?.link === 'ok'
        ? 'ok'
        : cs?.link === 'degraded'
        ? 'degraded'
        : 'reconnecting'
      : 'ok';
  const ready = multi ? secs === null : true;

  return (
    <Screen>
      <View style={styles.hud}>
        <IconButton
          icon="menu"
          label="Opciones de la partida"
          onPress={() => navigation.navigate('Options')}
        />
        <View style={styles.pills}>
          <Pill icon="users" label="Sospechosos" n={pub.slots.length} />
          <Pill icon="knife" label="Asesinos" n={pub.killers} />
          <Pill icon="mask" label="Mentirosos" n={pub.liars} />
        </View>
        <View style={styles.clock}>
          <Icon name="clock" size={16} color={color.gold} />
          <Stopwatch getElapsedMs={getElapsedMs} style={styles.clockText} />
          {multi ? <ConnectionDot link={ownLink} /> : null}
        </View>
      </View>
      {multi && roster.length > 1 ? (
        <View style={styles.players}>
          {roster.map(p => (
            <View
              key={p.id}
              style={styles.playerChip}
              accessible
              accessibilityLabel={`${p.name}${p.submitted ? ', ya ha entregado' : ''}`}>
              <ConnectionDot link={p.link} />
              <Text style={styles.playerName} numberOfLines={1}>
                {p.name}
              </Text>
              {p.submitted ? <Icon name="check" size={14} color="#9bd17f" /> : null}
            </View>
          ))}
        </View>
      ) : null}

      {ready ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {pub.witnesses.length > 0 ? (
            <View style={styles.witnesses}>
              <Text style={styles.sectionLabel}>Testigos en mesa · toca para ver su efecto</Text>
              <View style={styles.wRow}>
                {pub.witnesses.map((w: WitnessId) => (
                  <WitnessTile
                    key={w}
                    id={w}
                    onPress={() => navigation.navigate('Detail', {kind: 'witness', id: w})}
                  />
                ))}
              </View>
            </View>
          ) : null}
          <Text style={styles.sectionLabel}>Sospechosos y testimonios</Text>
          <View style={[styles.pairs, {gap}]}>
            {pub.slots.map(sl => (
              <View key={sl.speaker} style={{width: cardW * 2 + gap, gap: 6}}>
                <View style={{flexDirection: 'row', gap}}>
                  <BoardSuspect
                    id={sl.speaker}
                    width={cardW}
                    onPress={() => navigation.navigate('Detail', {kind: 'suspect', id: sl.speaker})}
                  />
                  <TestimonyCard
                    id={sl.speaker}
                    st={sl.statement}
                    width={cardW}
                    witnesses={pub.witnesses}
                    onZoom={() => navigation.navigate('Detail', {kind: 'testimony', id: sl.speaker})}
                  />
                </View>
                <MarkBar id={sl.speaker} />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{flex: 1}} />
      )}

      <View style={styles.bar}>
        <Button
          compact
          icon="book"
          label="Guía"
          style={styles.barBtn}
          onPress={() => navigation.navigate('Reference')}
        />
        <Button
          compact
          icon="notes"
          label="Notas"
          style={styles.barBtn}
          onPress={() => navigation.navigate('Notes')}
        />
        <Button
          compact
          variant="danger"
          icon="scale"
          label={submitted ? 'Enviada' : 'Resolver'}
          disabled={submitted || !ready}
          style={styles.barBtn}
          onPress={() => navigation.navigate('Solve')}
        />
      </View>

      {submitted && game.mode === 'versus' ? (
        <Animated.View entering={FadeIn} style={styles.wait} accessibilityLiveRegion="polite">
          <Text style={styles.waitText}>
            Entrega enviada · esperando a los rivales ({roster.filter(p => p.submitted).length}/
            {roster.filter(p => p.link !== 'left').length})
          </Text>
          {game.role === 'host' ? (
            <Button
              compact
              variant="neutral"
              label="Cerrar la carrera ya"
              hint="Da el veredicto con las entregas recibidas"
              onPress={() => sessions.host()?.finish()}
            />
          ) : null}
        </Animated.View>
      ) : null}
      {multi && secs !== null ? <CountdownOverlay secs={secs} /> : null}
    </Screen>
  );
}

function Pill({icon, label, n}: {icon: 'users' | 'knife' | 'mask'; label: string; n: number}) {
  return (
    <View style={styles.pill} accessible accessibilityLabel={`${label}: ${n}`}>
      <View style={styles.pillTop}>
        <Icon name={icon} size={15} color={color.gold} />
        <Text style={styles.pillN}>{n}</Text>
      </View>
      <Text style={styles.pillL} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const MARKS = [
  {key: 'k', icon: 'knife', label: 'Asesino', hint: 'posible asesino', on: color.blood},
  {key: 'l', icon: 'mask', label: 'Mentiroso', hint: 'mentiroso', on: '#8a6a1f'},
  {key: 'c', icon: 'shield', label: 'Descartado', hint: 'descartado', on: color.sage},
] as const;

/** Insignias táctiles rápidas bajo cada pareja (objetivos de 44 pt). */
const MarkBar = React.memo(function MarkBar({id}: {id: string}) {
  const m = useMark(id as never);
  const act = (k: string) => {
    haptic('select');
    sfx('stamp');
    const s = useStore.getState();
    if (k === 'k') {
      s.toggleGuilt(id as never, 'guilty');
    } else if (k === 'l') {
      s.toggleLiar(id as never);
    } else {
      s.toggleGuilt(id as never, 'innocent');
    }
  };
  return (
    <View style={styles.marks}>
      {MARKS.map(b => {
        const on =
          b.key === 'k'
            ? m.guilt === 'guilty'
            : b.key === 'l'
            ? m.honesty === 'liar'
            : m.guilt === 'innocent';
        return (
          <View key={b.key} style={{flex: 1}}>
            <MarkButton
              on={on}
              bg={b.on}
              icon={b.icon}
              label={b.label}
              a11y={`Marcar a ${id} como ${b.hint}`}
              onPress={() => act(b.key)}
            />
          </View>
        );
      })}
    </View>
  );
});

function MarkButton({
  on,
  bg,
  icon,
  label,
  a11y,
  onPress,
}: {
  on: boolean;
  bg: string;
  icon: 'knife' | 'mask' | 'shield';
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{selected: on}}
      onPress={onPress}
      style={({pressed}) => [
        styles.mark,
        on && {backgroundColor: bg, borderColor: color.textOnDark},
        pressed && {opacity: 0.8},
      ]}>
      <Icon name={icon} size={15} color={on ? color.textOnDark : color.textMuted} />
      <Text style={[styles.markText, on && {color: color.textOnDark}]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function useCountdown(getElapsedMs: () => number, enabled: boolean): number | null {
  const [secs, setSecs] = useState<number | null>(enabled ? 3 : null);
  useEffect(() => {
    if (!enabled) {
      return setSecs(null);
    }
    let last = -1;
    const id = setInterval(() => {
      const e = getElapsedMs();
      const s = e < 0 ? Math.ceil(-e / 1000) : null;
      if (s !== last) {
        last = s ?? 0;
        if (s === null) {
          sfx('go');
          haptic('heavy');
        } else {
          sfx('tick');
          haptic('tap');
        }
      }
      setSecs(s);
    }, 80);
    return () => clearInterval(id);
  }, [enabled, getElapsedMs]);
  return secs;
}

function CountdownOverlay({secs}: {secs: number}) {
  return (
    <View
      style={styles.countdown}
      accessibilityLiveRegion="assertive"
      accessible
      accessibilityLabel={`Empieza en ${secs}`}>
      <Text style={styles.cdLabel}>¡Prepárate!</Text>
      <Animated.Text key={secs} entering={ZoomIn.duration(260)} style={styles.cdNum}>
        {secs}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderColor: color.brass,
    backgroundColor: 'rgba(27,18,12,0.85)',
  },
  pills: {flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center'},
  pillTop: {flexDirection: 'row', alignItems: 'center', gap: 4},
  pill: {
    alignItems: 'center',
    flexShrink: 1,
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.brass,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pillN: {color: color.gold, fontWeight: '800', fontSize: 16},
  pillL: {color: color.textMuted, fontWeight: '700', fontSize: 10},
  clock: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 6},
  clockText: {color: color.textOnDark, fontWeight: '800', fontSize: 16},
  players: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingVertical: 6},
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.wood900,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: color.wood700,
    maxWidth: 150,
  },
  playerName: {color: color.textOnDark, fontSize: 12, fontWeight: '700', flexShrink: 1},
  scroll: {padding: 16, gap: 12, paddingBottom: 24},
  sectionLabel: {...T.label, color: color.gold, textAlign: 'center'},
  witnesses: {gap: 8, alignItems: 'center'},
  wRow: {flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center'},
  pairs: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'},
  marks: {flexDirection: 'row', gap: 6},
  mark: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: color.wood700,
    backgroundColor: color.wood900,
  },
  markText: {color: color.textMuted, fontWeight: '800', fontSize: 11},
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderColor: color.brass,
    backgroundColor: 'rgba(27,18,12,0.92)',
  },
  barBtn: {flex: 1, paddingHorizontal: 6},
  wait: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 86,
    backgroundColor: color.wood800,
    borderColor: color.gold,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: 12,
  },
  waitText: {color: color.textOnDark, fontWeight: '700', textAlign: 'center'},
  countdown: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.wood900,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cdLabel: {...T.h2, color: color.textMuted},
  cdNum: {color: color.gold, fontFamily: 'serif', fontWeight: '800', fontSize: 140},
});
