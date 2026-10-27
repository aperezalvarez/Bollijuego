import React, {useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {ART, WITNESS_ART} from '../../../assets/cards';
import {RULES_TEXT, SUSPECTS, WITNESS_INFO, WITNESS_NOTE, traitLabel} from '../../../domain';
import {useStore} from '../../../state/store';
import {Chips} from '../../../ui/Controls';
import {Sheet} from '../../../ui/Sheet';
import {cardHeight} from '../../../ui/cards';
import {color, radius, type as T} from '../../../ui/theme';

type Tab = 'sosp' | 'test' | 'reglas';

/** Hoja de referencia: la matriz de rasgos y los efectos de los testigos, siempre a mano en la partida. */
export function ReferenceSheet() {
  const [tab, setTab] = useState<Tab>('sosp');
  const {width} = useWindowDimensions();
  const active = useStore(s => s.game?.pub.witnesses ?? []);
  const w = Math.min(width - 32, 360);
  return (
    <Sheet title="Hoja de referencia" tall>
      <Chips<Tab>
        options={[
          {id: 'sosp', label: 'Sospechosos'},
          {id: 'test', label: 'Testigos'},
          {id: 'reglas', label: 'Reglas'},
        ]}
        value={tab}
        onChange={setTab}
      />
      <ScrollView contentContainerStyle={styles.col} showsVerticalScrollIndicator={false}>
        {tab === 'sosp' ? (
          <>
            <Image
              source={ART.sospechosos}
              style={{width: w, height: cardHeight(w), alignSelf: 'center', borderRadius: radius.card}}
              resizeMode="contain"
              accessibilityLabel="Tabla de sospechosos: nombre, género y nivel de afecto"
            />
            <Text style={styles.h}>De menos a más cariñoso</Text>
            {[0, 1, 2, 3].map(l => {
              const [m, f] = SUSPECTS.filter(s => s.level === l);
              return (
                <Text key={l} style={styles.body}>
                  <Text style={styles.strong}>
                    {l + 1}. {traitLabel('M', l as 0)}/
                    {
                      traitLabel('F', l as 0)
                        .split(' ')
                        .slice(-1)[0]
                    }
                    :{' '}
                  </Text>
                  {m.id} (♂) y {f.id} (♀)
                </Text>
              );
            })}
          </>
        ) : null}
        {tab === 'test' ? (
          <>
            {active.length > 0 ? <Text style={styles.h}>En esta mesa</Text> : null}
            {active.map(id => (
              <View key={id} style={styles.wRow}>
                <Image
                  source={WITNESS_ART[id]}
                  style={{width: 64, height: cardHeight(64), borderRadius: 6}}
                />
                <View style={{flex: 1}}>
                  <Text style={styles.strong}>
                    {WITNESS_INFO[id].title} · {WITNESS_INFO[id].short}
                  </Text>
                  <Text style={styles.body}>{WITNESS_INFO[id].effect}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.note}>{WITNESS_NOTE}</Text>
            <Image
              source={ART.testigos}
              style={{width: w, height: cardHeight(w), alignSelf: 'center', borderRadius: radius.card}}
              resizeMode="contain"
              accessibilityLabel="Carta de testigos y sus efectos"
            />
          </>
        ) : null}
        {tab === 'reglas'
          ? RULES_TEXT.map(r => (
              <View key={r.title} style={{gap: 2}}>
                <Text style={styles.h}>{r.title}</Text>
                <Text style={styles.body}>{r.body}</Text>
              </View>
            ))
          : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  col: {gap: 12, paddingVertical: 12},
  h: {...T.h3, color: color.gold},
  body: {...T.body, color: color.textOnDark},
  strong: {color: color.gold, fontWeight: '800', fontSize: 15},
  note: {...T.small, color: color.textMuted},
  wRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    padding: 10,
  },
});
