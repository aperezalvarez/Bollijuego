import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import {MODE_LABEL} from '../../domain';
import {ClientSession} from '../../net/client';
import {NET_MESSAGES, NetError} from '../../net/errors';
import {sessions, useClient, useClientSnapshot} from '../../net/registry';
import {parseCode} from '../../net/roomCode';
import {tcpTransport} from '../../net/tcpTransport';
import {useAndroidBack} from '../../platform/lifecycle';
import {getNetEnv} from '../../platform/network';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Field, Header, Plate} from '../../ui/Controls';
import {Screen} from '../../ui/WoodBackground';
import {color, type as T} from '../../ui/theme';
import {Roster} from './Roster';

export function LobbyJoin({navigation, route}: NativeStackScreenProps<RootStackParamList, 'LobbyJoin'>) {
  const mode = route.params.mode;
  const client = useClient();
  const snap = useClientSnapshot(client);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const goHome = useCallback(() => {
    sessions.closeAll();
    useStore.getState().endGame();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  }, [navigation]);

  const back = useCallback(() => {
    if (busy) {
      client?.cancel(); // «Cancelar» aborta de verdad los sockets en vuelo
      return true;
    }
    if (client && snap?.link !== 'failed' && snap?.link !== 'closed') {
      Alert.alert('Salir de la sala', '¿Quieres abandonar la sala?', [
        {text: 'Quedarme', style: 'cancel'},
        {text: 'Salir', style: 'destructive', onPress: goHome},
      ]);
      return true;
    }
    navigation.goBack();
    return true;
  }, [busy, client, snap?.link, goHome, navigation]);
  useAndroidBack(back);

  const parsed = parseCode(text);

  const join = async () => {
    setError(null);
    const st = useStore.getState();
    const env = await getNetEnv();
    const c = new ClientSession({
      transport: tcpTransport,
      env,
      code: text,
      name: st.settings.name.trim() || 'Jugador',
      mode,
      clientId: st.settings.clientId,
    });
    sessions.setClient(c);
    setBusy(true);
    try {
      await c.join();
    } catch (e) {
      const code = e instanceof NetError ? e.code : 'NOT_FOUND';
      if (code !== 'CANCELLED') {
        setError(e instanceof NetError ? e.message : NET_MESSAGES.NOT_FOUND);
      }
      sessions.setClient(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (client && snap?.phase === 'started' && snap.caseDto) {
      const d = snap.caseDto;
      const pub = {
        seed: d.seed,
        rulesVersion: d.rulesVersion,
        witnesses: d.witnesses,
        slots: d.slots,
        killers: d.killers,
        liars: d.liars,
      };
      useStore.getState().startGame({
        mode,
        role: 'guest',
        pub,
        solution: d.solution ?? null,
        config: {
          suspects: d.slots.length,
          killers: d.killers,
          liars: d.liars,
          witnesses: d.witnesses.length,
        },
      });
      navigation.replace('Board');
    }
  }, [client, snap?.phase, snap?.caseDto, mode, navigation]);

  const joined = !!snap && (snap.link === 'ok' || snap.link === 'degraded' || snap.link === 'reconnecting');

  return (
    <Screen>
      <Header title={`Unirme · ${MODE_LABEL[mode]}`} onBack={back} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!joined ? (
          <>
            <Plate title="Código de la sala">
              <Field
                label="Código de 7 caracteres"
                value={text}
                onChangeText={t =>
                  setText(
                    t
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, '')
                      .slice(0, 8),
                  )
                }
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="XXXX-XXX"
                maxLength={8}
                editable={!busy}
                style={styles.codeInput}
              />
              <Text style={styles.hint}>
                Te lo da el anfitrión en su pantalla. Las letras confusas (0, O, 1, I, L) no se usan.
              </Text>
            </Plate>
            {busy ? (
              <Plate>
                <View style={styles.searching}>
                  <ActivityIndicator color={color.gold} />
                  <Text style={styles.body}>
                    {snap && snap.scanTotal > 0
                      ? `Buscando en tu red… ${snap.scanned}/${snap.scanTotal}`
                      : 'Buscando la sala…'}
                  </Text>
                </View>
              </Plate>
            ) : null}
            {error ? (
              <Text style={styles.err} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
            {busy ? (
              <Button
                variant="danger"
                icon="close"
                label="Cancelar búsqueda"
                onPress={() => client?.cancel()}
              />
            ) : (
              <Button variant="primary" icon="search" label="Buscar sala" disabled={!parsed} onPress={join} />
            )}
          </>
        ) : (
          <>
            <Plate title="En la sala">
              <Roster players={snap.roster} youId={snap.youId} />
              {snap.link === 'reconnecting' ? (
                <Text style={styles.body}>
                  Reconectando con el anfitrión… tu plaza se conserva durante 60 s.
                </Text>
              ) : (
                <Text style={styles.body}>Esperando a que el anfitrión inicie la partida.</Text>
              )}
            </Plate>
            <Button
              variant={ready ? 'neutral' : 'confirm'}
              icon="check"
              label={ready ? 'Quitar «listo»' : 'Estoy listo'}
              onPress={() => {
                client?.setReady(!ready);
                setReady(!ready);
              }}
            />
            <Button variant="ghost" label="Salir de la sala" onPress={back} />
          </>
        )}
        {snap?.link === 'failed' && snap.error ? (
          <Text style={styles.err}>{NET_MESSAGES[snap.error]}</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14},
  codeInput: {
    fontSize: 28,
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: 'serif',
    fontWeight: '800',
    color: color.gold,
  },
  hint: {...T.small, color: color.textMuted},
  body: {...T.body, color: color.textOnDark},
  err: {color: '#f08d7b', fontWeight: '700', fontSize: 14},
  searching: {flexDirection: 'row', alignItems: 'center', gap: 12},
});
