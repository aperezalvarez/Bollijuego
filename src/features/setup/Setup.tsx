import Clipboard from '@react-native-clipboard/clipboard';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, Share, StyleSheet, Text, View} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import {
  ALL_SUSPECT_IDS,
  ALL_WITNESS_IDS,
  PRESETS,
  generateCase,
  maxKillers,
  maxLiars,
  maxWitnesses,
  randomSeed,
  toPublic,
  type CaseConfig,
  type PresetId,
  type SuspectId,
  type WitnessId,
} from '../../domain';
import {HostSession} from '../../net/host';
import {NetError} from '../../net/errors';
import {sessions} from '../../net/registry';
import {tcpTransport} from '../../net/tcpTransport';
import {getNetEnv} from '../../platform/network';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Chips, Field, Header, Plate, Stepper} from '../../ui/Controls';
import {Icon} from '../../ui/Icon';
import {WitnessTile, SuspectCard} from '../../ui/cards';
import {Screen} from '../../ui/WoodBackground';
import {color, type as T} from '../../ui/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;
const PRESET_OPTIONS: {id: PresetId; label: string}[] = [
  {id: 'facil', label: 'Fácil'},
  {id: 'normal', label: 'Normal'},
  {id: 'dificil', label: 'Difícil'},
  {id: 'personalizado', label: 'Personalizado'},
];
const plural = (n: number, a: string, b: string) => `${n} ${n === 1 ? a : b}`;

export function Setup({navigation, route}: Props) {
  const mode = route.params.mode;
  const multi = mode !== 'solo';
  const [preset, setPreset] = useState<PresetId>('normal');
  const [cfg, setCfg] = useState<CaseConfig>(PRESETS.normal);
  const [manual, setManual] = useState(false);
  const [pickedS, setPickedS] = useState<SuspectId[]>([]);
  const [pickedW, setPickedW] = useState<WitnessId[]>([]);
  const [seedText, setSeedText] = useState('');
  const [players, setPlayers] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const edit = (p: Partial<CaseConfig>) => {
    const next = {...cfg, ...p};
    next.killers = Math.min(next.killers, maxKillers(next.suspects));
    next.liars = Math.min(next.liars, maxLiars(next.suspects));
    next.witnesses = Math.min(next.witnesses, maxWitnesses(next.suspects));
    setCfg(next);
    setPickedS(a => a.slice(0, next.suspects));
    setPickedW(a => a.slice(0, next.witnesses));
    setPreset('personalizado');
  };
  const choosePreset = (id: PresetId) => {
    setPreset(id);
    if (id !== 'personalizado') {
      setCfg(PRESETS[id]);
      setManual(false);
    }
  };

  const manualOk = !manual || (pickedS.length === cfg.suspects && pickedW.length === cfg.witnesses);
  const seedNum = seedText.trim() === '' ? null : Number(seedText);
  const seedBad = seedNum !== null && (!Number.isInteger(seedNum) || seedNum < 1 || seedNum > 999999);
  const summary = useMemo(
    () =>
      `${plural(cfg.suspects, 'sospechoso', 'sospechosos')} · ${plural(
        cfg.killers,
        'asesino',
        'asesinos',
      )} · ${plural(cfg.liars, 'mentiroso', 'mentirosos')} · ${plural(cfg.witnesses, 'testigo', 'testigos')}`,
    [cfg],
  );

  const toggleS = (id: SuspectId) =>
    setPickedS(a => (a.includes(id) ? a.filter(x => x !== id) : a.length < cfg.suspects ? [...a, id] : a));
  const toggleW = (id: WitnessId) =>
    setPickedW(a => (a.includes(id) ? a.filter(x => x !== id) : a.length < cfg.witnesses ? [...a, id] : a));

  const create = async () => {
    setError(null);
    const full: CaseConfig = manual ? {...cfg, pickedSuspects: pickedS, pickedWitnesses: pickedW} : cfg;
    const seed = seedNum ?? randomSeed();
    const r = generateCase(full, seed);
    if (!r.ok) {
      return setError(r.error.message);
    }
    const g = r.value;
    const st = useStore.getState();
    if (!multi) {
      st.startGame({mode: 'solo', role: 'solo', pub: toPublic(g), solution: g.solution, config: full});
      return navigation.replace('Board');
    }
    setBusy(true);
    try {
      const env = await getNetEnv();
      if (!env.ip) {
        throw new NetError('NO_WIFI');
      }
      const host = new HostSession({
        transport: tcpTransport,
        localIp: env.ip,
        name: st.settings.name.trim() || 'Anfitrión',
        mode: mode as 'cooperativo' | 'versus',
        game: g,
        maxPlayers: players,
      });
      await host.open();
      sessions.setHost(host);
      navigation.replace('LobbyHost');
    } catch (e) {
      setError(e instanceof NetError ? e.message : 'No se pudo abrir la sala.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header
        title={mode === 'solo' ? 'Nuevo caso' : mode === 'versus' ? 'Sala Versus' : 'Sala Cooperativa'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Plate title="Dificultad">
          <Chips options={PRESET_OPTIONS} value={preset} onChange={choosePreset} />
          <Text style={styles.summary}>{summary}</Text>
        </Plate>

        {preset === 'personalizado' ? (
          <Plate title="Personalizar">
            <Stepper
              label="Sospechosos"
              value={cfg.suspects}
              min={3}
              max={8}
              onChange={v => edit({suspects: v})}
            />
            <Stepper
              label="Asesinos"
              value={cfg.killers}
              min={1}
              max={maxKillers(cfg.suspects)}
              onChange={v => edit({killers: v})}
            />
            <Stepper
              label="Mentirosos"
              value={cfg.liars}
              min={1}
              max={maxLiars(cfg.suspects)}
              onChange={v => edit({liars: v})}
            />
            <Stepper
              label="Testigos"
              value={cfg.witnesses}
              min={0}
              max={maxWitnesses(cfg.suspects)}
              onChange={v => edit({witnesses: v})}
            />
            <Chips
              options={[
                {id: 'azar', label: 'Cartas al azar'},
                {id: 'manual', label: 'Elegir cartas'},
              ]}
              value={manual ? 'manual' : 'azar'}
              onChange={v => setManual(v === 'manual')}
            />
            {manual ? (
              <View style={{gap: 10}}>
                <Text style={styles.sub}>
                  Sospechosos ({pickedS.length}/{cfg.suspects})
                </Text>
                <View style={styles.grid}>
                  {ALL_SUSPECT_IDS.map(id => (
                    <Pressable
                      key={id}
                      onPress={() => toggleS(id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={id}
                      accessibilityState={{checked: pickedS.includes(id)}}
                      style={{opacity: pickedS.includes(id) ? 1 : 0.5}}>
                      <SuspectCard id={id} width={74} />
                      {pickedS.includes(id) ? (
                        <View style={styles.tick}>
                          <Icon name="check" size={16} color={color.ink} />
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
                {cfg.witnesses > 0 ? (
                  <>
                    <Text style={styles.sub}>
                      Testigos ({pickedW.length}/{cfg.witnesses})
                    </Text>
                    <View style={styles.grid}>
                      {ALL_WITNESS_IDS.map(id => (
                        <View key={id} style={{opacity: pickedW.includes(id) ? 1 : 0.5}}>
                          <WitnessTile id={id} onPress={() => toggleW(id)} />
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
          </Plate>
        ) : null}

        {multi ? (
          <Plate title="Jugadores">
            <Stepper
              label="Máximo de jugadores"
              value={players}
              min={2}
              max={4}
              onChange={setPlayers}
              hint="Contándote a ti"
            />
          </Plate>
        ) : null}

        <Plate title="Semilla (opcional)">
          <Field
            label="Semilla del caso"
            value={seedText}
            onChangeText={t => setSeedText(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="Aleatoria"
          />
          {seedBad ? <Text style={styles.err}>La semilla debe estar entre 1 y 999999.</Text> : null}
          <Text style={styles.sub}>
            La misma semilla y configuración generan siempre el mismo caso: compártela para jugar el mismo
            misterio.
          </Text>
          <View style={styles.row}>
            <Button
              compact
              icon="dice"
              label="Aleatoria"
              style={styles.flex}
              onPress={() => setSeedText(String(randomSeed()))}
            />
            <Button
              compact
              icon="copy"
              label="Copiar"
              style={styles.flex}
              disabled={!seedText}
              onPress={() => Clipboard.setString(seedText)}
            />
            <Button
              compact
              icon="share"
              label="Compartir"
              style={styles.flex}
              disabled={!seedText}
              onPress={() =>
                Share.share({
                  message: `Juega mi caso de «¿Quién mató a la gallina?»: semilla ${seedText} · ${summary}`,
                })
              }
            />
          </View>
        </Plate>

        {error ? (
          <Text style={styles.err} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <Button
          variant="primary"
          icon={multi ? 'wifi' : 'search'}
          label={busy ? 'Abriendo sala…' : multi ? 'Crear sala' : 'Generar caso'}
          disabled={busy || seedBad || !manualOk}
          onPress={create}
        />
        {!manualOk ? (
          <Text style={styles.sub}>
            Elige exactamente {cfg.suspects} sospechosos y {cfg.witnesses} testigos.
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14, paddingBottom: 40},
  summary: {color: color.textOnDark, fontWeight: '700', fontSize: 14},
  sub: {...T.small, color: color.textMuted},
  err: {color: '#f08d7b', fontWeight: '700', fontSize: 14},
  row: {flexDirection: 'row', gap: 8},
  flex: {flex: 1},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  tick: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
