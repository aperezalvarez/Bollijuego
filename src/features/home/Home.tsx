import React from 'react';
import {Image, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {ART} from '../../assets/cards';
import {DAILY_CONFIG, dailySeed, dayKey, generateCase, toPublic, MODE_LABEL} from '../../domain';
import {useNav} from '../../app/nav';
import {canContinue, elapsedOf, useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {fmtTime} from '../../ui/Stopwatch';
import {Screen} from '../../ui/WoodBackground';
import {CARD_ASPECT, color, type as T} from '../../ui/theme';

export function Home() {
  const nav = useNav();
  const {width, height} = useWindowDimensions();
  const game = useStore(s => s.game);
  const stats = useStore(s => s.stats);
  const today = dayKey(new Date());
  const doneToday = stats.daily[today];
  const artW = Math.min(width * 0.62, height * 0.36 * CARD_ASPECT, 260);

  const startDaily = () => {
    const seed = dailySeed(new Date());
    const r = generateCase(DAILY_CONFIG, seed);
    if (!r.ok) {
      return;
    }
    useStore.getState().startGame({
      mode: 'daily',
      role: 'solo',
      pub: toPublic(r.value),
      solution: r.value.solution,
      config: DAILY_CONFIG,
      dayKey: today,
      practice: !!doneToday,
    });
    nav.navigate('Board');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.art, {width: artW, height: artW / CARD_ASPECT}]}>
          <Image
            source={ART.portada}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            accessibilityLabel="¿Quién mató a la gallina?"
          />
        </View>
        <View style={styles.menu}>
          {canContinue(game) ? (
            <Button
              variant="primary"
              icon="play"
              label={`Continuar · ${MODE_LABEL[game.mode]} · ${fmtTime(elapsedOf(game))}`}
              hint="Recupera tu partida exactamente donde la dejaste"
              onPress={() => nav.navigate('Board')}
            />
          ) : null}
          <Button
            icon="search"
            label="Solitario"
            variant={canContinue(game) ? 'neutral' : 'primary'}
            onPress={() => nav.navigate('Setup', {mode: 'solo'})}
          />
          <Button icon="users" label="Multijugador local" onPress={() => nav.navigate('Multi')} />
          <Button
            icon="dice"
            label={doneToday ? 'Reto diario · completado hoy' : 'Reto diario'}
            onPress={startDaily}
            hint="El mismo caso para todos los jugadores del día"
          />
          <Button icon="book" label="Tutorial / Reglas" onPress={() => nav.navigate('Rules')} />
          <View style={styles.row}>
            <Button
              compact
              icon="chart"
              label="Estadísticas"
              style={styles.half}
              onPress={() => nav.navigate('Stats')}
            />
            <Button
              compact
              icon="gear"
              label="Ajustes"
              style={styles.half}
              onPress={() => nav.navigate('Settings')}
            />
          </View>
        </View>
        <Text style={styles.foot}>Deducción, mentiras y una gallina muy muerta</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 18,
    flexGrow: 1,
    justifyContent: 'center',
  },
  art: {
    borderRadius: 6,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 8},
  },
  menu: {width: '100%', maxWidth: 380, gap: 10},
  row: {flexDirection: 'row', gap: 10},
  half: {flex: 1},
  foot: {...T.small, color: color.textMuted, fontStyle: 'italic'},
});
