import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {WITNESS_ART} from '../../assets/cards';
import type {RootStackParamList} from '../../app/types';
import {
  ALL_WITNESS_IDS,
  PRESETS,
  RULES_TEXT,
  WITNESS_INFO,
  WITNESS_NOTE,
  generateCase,
  toPublic,
} from '../../domain';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Header, Plate} from '../../ui/Controls';
import {Screen} from '../../ui/WoodBackground';
import {CardImage} from '../../ui/cards';
import {color, radius, type as T} from '../../ui/theme';
import {ExplainList} from '../game/ExplainList';

export function Rules({navigation}: NativeStackScreenProps<RootStackParamList, 'Rules'>) {
  // Ejemplo resuelto y reproducible (semilla fija): enseña cómo se leen mentiras y testigos.
  const example = useMemo(() => {
    const r = generateCase({suspects: 5, killers: 2, liars: 2, witnesses: 1}, 20261027);
    return r.ok ? r.value : null;
  }, []);

  const practice = () => {
    const r = generateCase(PRESETS.facil, 7);
    if (!r.ok) {
      return;
    }
    useStore.getState().startGame({
      mode: 'solo',
      role: 'solo',
      pub: toPublic(r.value),
      solution: r.value.solution,
      config: PRESETS.facil,
      practice: true,
    });
    navigation.replace('Board');
  };

  return (
    <Screen>
      <Header title="Tutorial y reglas" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {RULES_TEXT.map(r => (
          <Plate key={r.title} title={r.title}>
            <Text style={styles.body}>{r.body}</Text>
          </Plate>
        ))}
        <Plate title="Los testigos">
          {ALL_WITNESS_IDS.map(id => (
            <View key={id} style={styles.w}>
              <CardImage source={WITNESS_ART[id]} width={56} />
              <View style={{flex: 1}}>
                <Text style={styles.strong}>
                  {WITNESS_INFO[id].title} · {WITNESS_INFO[id].short}
                </Text>
                <Text style={styles.body}>{WITNESS_INFO[id].effect}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.note}>{WITNESS_NOTE}</Text>
        </Plate>
        {example ? (
          <Plate title="Un caso resuelto, paso a paso">
            <Text style={styles.body}>
              Con {example.witnesses.join(' y ')} en mesa, así se lee cada testimonio y por qué la solución es
              única:
            </Text>
            <ExplainList game={example} />
          </Plate>
        ) : null}
        <Button
          variant="primary"
          icon="play"
          label="Practicar un caso fácil"
          hint="No cuenta para tus estadísticas"
          onPress={practice}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14, paddingBottom: 40},
  body: {...T.body, color: color.textOnDark},
  note: {...T.small, color: color.textMuted},
  strong: {color: color.gold, fontWeight: '800', fontSize: 15},
  w: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    padding: 10,
  },
});
