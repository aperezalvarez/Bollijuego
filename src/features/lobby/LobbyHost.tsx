import Clipboard from '@react-native-clipboard/clipboard';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect} from 'react';
import {Alert, ScrollView, Share, StyleSheet, Text, View} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import {MODE_LABEL, configOf, toPublic} from '../../domain';
import {NET_MESSAGES} from '../../net/errors';
import {sessions, useHost, useHostSnapshot} from '../../net/registry';
import {formatCode} from '../../net/roomCode';
import {useAndroidBack} from '../../platform/lifecycle';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Header, Plate} from '../../ui/Controls';
import {Screen} from '../../ui/WoodBackground';
import {color, type as T} from '../../ui/theme';
import {Roster} from './Roster';

export function LobbyHost({navigation}: NativeStackScreenProps<RootStackParamList, 'LobbyHost'>) {
  const host = useHost();
  const snap = useHostSnapshot(host);
  const goHome = useCallback(() => {
    sessions.closeAll();
    useStore.getState().endGame();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);

  const confirmClose = useCallback(() => {
    Alert.alert('Cerrar la sala', 'Los jugadores conectados serán expulsados.', [
      {text: 'Seguir aquí', style: 'cancel'},
      {text: 'Cerrar sala', style: 'destructive', onPress: goHome},
    ]);
    return true;
  }, [goHome]);
  useAndroidBack(confirmClose);

  useEffect(() => {
    if (!host) {
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    }
  }, [host, navigation]);

  useEffect(() => {
    if (host && snap?.phase === 'started') {
      const pub = toPublic(host.game);
      useStore
        .getState()
        .startGame({mode: host.mode, role: 'host', pub, solution: host.game.solution, config: configOf(pub)});
      navigation.replace('Board');
    }
  }, [host, snap?.phase, navigation]);

  if (!host || !snap) {
    return (
      <Screen>
        <View />
      </Screen>
    );
  }
  const connected = snap.roster.filter(p => p.link === 'ok' || p.link === 'degraded').length;
  const code = formatCode(host.roomCode);

  return (
    <Screen>
      <Header title={`Sala ${MODE_LABEL[host.mode]}`} onBack={confirmClose} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Plate title="Código de la sala">
          <Text
            style={styles.code}
            accessibilityLabel={`Código de la sala: ${host.roomCode.split('').join(' ')}`}
            selectable>
            {code}
          </Text>
          <Text style={styles.hint}>
            Los demás lo introducen en «Unirme a una sala». El código lleva tu dirección y nunca se envía por
            la red.
          </Text>
          <View style={styles.row}>
            <Button
              compact
              icon="copy"
              label="Copiar"
              style={styles.flex}
              onPress={() => Clipboard.setString(host.roomCode)}
            />
            <Button
              compact
              icon="share"
              label="Compartir"
              style={styles.flex}
              onPress={() =>
                Share.share({message: `Únete a mi sala de «¿Quién mató a la gallina?» con el código ${code}`})
              }
            />
          </View>
        </Plate>
        <Plate title={`Jugadores · ${connected}`}>
          <Roster players={snap.roster} />
          {snap.error ? <Text style={styles.err}>{NET_MESSAGES[snap.error]}</Text> : null}
        </Plate>
        <Button
          variant="confirm"
          icon="play"
          label={connected < 2 ? 'Esperando jugadores…' : 'Iniciar partida · 3-2-1'}
          disabled={connected < 2}
          onPress={() => host.startGame()}
          hint="Cuenta atrás sincronizada para todos"
        />
        <Button variant="ghost" label="Cerrar sala" onPress={confirmClose} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14},
  code: {
    color: color.gold,
    fontFamily: 'serif',
    fontWeight: '800',
    fontSize: 44,
    letterSpacing: 6,
    textAlign: 'center',
  },
  hint: {...T.small, color: color.textMuted, textAlign: 'center'},
  row: {flexDirection: 'row', gap: 8},
  flex: {flex: 1},
  err: {color: '#f08d7b', fontWeight: '700'},
});
