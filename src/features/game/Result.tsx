import Clipboard from '@react-native-clipboard/clipboard';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import Animated, {ZoomIn} from 'react-native-reanimated';
import type {RootStackParamList} from '../../app/types';
import {MODE_LABEL, suspectOf, type GameCase, type Submission} from '../../domain';
import {sessions, useClient, useClientSnapshot, useHost, useHostSnapshot} from '../../net/registry';
import type {BoardRow} from '../../net/protocol';
import {useAndroidBack} from '../../platform/lifecycle';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Header, Plate} from '../../ui/Controls';
import {Icon} from '../../ui/Icon';
import {fmtTime} from '../../ui/Stopwatch';
import {Screen} from '../../ui/WoodBackground';
import {GenderBadge} from '../../ui/cards';
import {haptic} from '../../ui/haptics';
import {sfx} from '../../ui/sound';
import {color, radius, type as T} from '../../ui/theme';
import {rerollSolo} from '../runtime';
import {ExplainList} from './ExplainList';

interface View_ {
  correct: boolean;
  ms: number;
  truth: Submission;
  board: BoardRow[] | null;
  winnerId: string | null;
  youId: string;
}

export function Result({navigation}: NativeStackScreenProps<RootStackParamList, 'Result'>) {
  const game = useStore(s => s.game);
  const host = useHost();
  const client = useClient();
  const hs = useHostSnapshot(host);
  const cs = useClientSnapshot(client);
  const [why, setWhy] = useState(false);

  const home = useCallback(() => {
    sessions.closeAll();
    useStore.getState().endGame();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);
  useAndroidBack(() => {
    home();
    return true;
  });

  const v: View_ | null = useMemo(() => {
    if (!game) {
      return null;
    }
    if (game.finished && game.solution) {
      return {
        correct: game.finished.correct,
        ms: game.finished.ms,
        truth: game.solution,
        board: null,
        winnerId: null,
        youId: 'me',
      };
    }
    const res = hs?.result ?? cs?.result;
    if (!res) {
      return null;
    }
    const you = game.role === 'host' ? 'host' : cs?.youId ?? '';
    const mine = res.board.find(r => r.id === you);
    return {
      correct: !!mine?.correct,
      ms: mine?.elapsedMs ?? 0,
      truth: res.truth,
      board: res.board,
      winnerId: res.winnerId,
      youId: you,
    };
  }, [game, hs?.result, cs?.result, cs?.youId]);

  useEffect(() => {
    if (!v || !game) {
      return;
    }
    if (game.mode === 'versus' && !game.finished) {
      useStore.getState().finishGame({correct: v.correct, ms: v.ms, submission: {killers: [], liars: []}});
    }
    sfx(v.correct ? 'win' : 'lose');
    haptic(v.correct ? 'success' : 'error');
  }, [v?.correct]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game || !v) {
    return (
      <Screen>
        <Header title="Veredicto" />
        <View style={styles.center}>
          <Text style={styles.body}>Esperando el veredicto del anfitrión…</Text>
          <Button variant="ghost" label="Volver al inicio" onPress={home} />
        </View>
      </Screen>
    );
  }
  const gc: GameCase = {
    seed: game.pub.seed,
    rulesVersion: game.pub.rulesVersion,
    witnesses: game.pub.witnesses,
    slots: game.pub.slots,
    solution: v.truth,
  };
  const iWon = v.board ? v.winnerId === v.youId : v.correct;
  const title = v.board
    ? v.winnerId === null
      ? 'Nadie acertó'
      : iWon
      ? '¡HAS GANADO!'
      : 'HAS PERDIDO LA CARRERA'
    : v.correct
    ? '¡CASO RESUELTO!'
    : '¡HAS FALLADO!';
  const msg = v.board
    ? v.winnerId === null
      ? 'Ningún jugador dio con la solución.'
      : iWon
      ? '¡Suuuu! Eres el más rápido en acertar.'
      : `Ganó ${v.board.find(r => r.id === v.winnerId)?.name ?? 'otro jugador'}.`
    : v.correct
    ? '¡Suuuu! Has conseguido atrapar a los sapos traidores.'
    : 'Te babaste. Mira abajo por qué.';

  return (
    <Screen>
      <Header title={`${MODE_LABEL[game.mode]}${game.practice ? ' · práctica' : ''}`} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={ZoomIn.duration(380)} style={styles.verdict}>
          <Icon
            name={iWon || (!v.board && v.correct) ? 'trophy' : 'mask'}
            size={46}
            color={v.correct ? color.gold : '#f08d7b'}
          />
          <Text
            style={[styles.title, {color: v.correct ? color.gold : '#f08d7b'}]}
            accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.body}>{msg}</Text>
          <Text style={styles.time}>Tu tiempo · {fmtTime(v.ms)}</Text>
        </Animated.View>

        {v.board ? (
          <Plate title="Clasificación">
            {v.board.map((r, i) => (
              <View key={r.id} style={[styles.rank, r.id === v.winnerId && styles.winner]}>
                <Text style={styles.pos}>{i + 1}</Text>
                <Text style={styles.rname} numberOfLines={1}>
                  {r.name}
                  {r.id === v.youId ? ' (tú)' : ''}
                </Text>
                <Icon
                  name={r.correct ? 'check' : 'close'}
                  size={20}
                  color={r.correct ? '#9bd17f' : '#f08d7b'}
                />
                <Text style={styles.rtime}>{fmtTime(r.elapsedMs)}</Text>
                {r.id === v.winnerId ? <Icon name="trophy" size={18} color={color.gold} /> : null}
              </View>
            ))}
          </Plate>
        ) : null}

        <Plate title="La verdad era">
          <View style={{gap: 6}}>
            {gc.slots.map(sl => (
              <View key={sl.speaker} style={styles.truthRow}>
                <GenderBadge gender={suspectOf(sl.speaker).gender} size={24} />
                <Text style={styles.rname}>{sl.speaker}</Text>
                <View style={{flex: 1}} />
                {v.truth.killers.includes(sl.speaker) ? (
                  <Icon name="knife" size={20} color="#f08d7b" />
                ) : null}
                {v.truth.liars.includes(sl.speaker) ? (
                  <Icon name="mask" size={20} color={color.gold} />
                ) : null}
              </View>
            ))}
          </View>
        </Plate>

        <Button
          icon="search"
          variant={why ? 'neutral' : 'primary'}
          label={why ? 'Ocultar el desglose' : '¿Por qué esta es la solución?'}
          onPress={() => setWhy(w => !w)}
        />
        {why ? <ExplainList game={gc} /> : null}

        <Plate title="Semilla del caso">
          <Text style={styles.body}>
            {game.pub.seed} · se puede jugar de nuevo con la misma configuración.
          </Text>
          <Button
            compact
            icon="copy"
            label="Copiar semilla"
            onPress={() => Clipboard.setString(String(game.pub.seed))}
          />
        </Plate>

        {game.mode === 'solo' ? (
          <Button
            icon="dice"
            label="Otro caso (misma configuración)"
            onPress={() => {
              if (rerollSolo()) {
                navigation.reset({index: 1, routes: [{name: 'Home'}, {name: 'Board'}]});
              }
            }}
          />
        ) : null}
        <Button
          variant={game.mode === 'solo' ? 'ghost' : 'primary'}
          icon="exit"
          label="Volver al inicio"
          onPress={home}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14, paddingBottom: 40},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24},
  verdict: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(43,28,18,0.92)',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: color.brass,
    padding: 20,
  },
  title: {...T.title, textAlign: 'center'},
  body: {...T.body, color: color.textOnDark, textAlign: 'center'},
  time: {color: color.gold, fontWeight: '800', fontSize: 18, fontVariant: ['tabular-nums']},
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  winner: {borderWidth: 1.5, borderColor: color.gold},
  pos: {color: color.gold, fontWeight: '800', fontSize: 18, width: 22},
  rname: {color: color.textOnDark, fontFamily: 'serif', fontWeight: '800', fontSize: 16, flexShrink: 1},
  rtime: {color: color.textOnDark, fontVariant: ['tabular-nums'], fontWeight: '700'},
  truthRow: {flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40},
});
