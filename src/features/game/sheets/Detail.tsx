import type {RouteProp} from '@react-navigation/native';
import {useRoute} from '@react-navigation/native';
import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {WITNESS_ART} from '../../../assets/cards';
import type {RootStackParamList} from '../../../app/types';
import {
  WITNESS_INFO,
  WITNESS_NOTE,
  hintFor,
  renderEs,
  suspectOf,
  traitLabel,
  type Statement,
  type SuspectId,
} from '../../../domain';
import {useMark, useRevealed, useStore} from '../../../state/store';
import {Icon} from '../../../ui/Icon';
import {Sheet} from '../../../ui/Sheet';
import {CardImage, RichStatement, SuspectCard} from '../../../ui/cards';
import {color, radius, type as T} from '../../../ui/theme';

export function DetailSheet() {
  const {params} = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const game = useStore(s => s.game);
  const assisted = useStore(s => s.settings.assisted);
  if (params.kind === 'witness') {
    const info = WITNESS_INFO[params.id];
    return (
      <Sheet title={info.title}>
        <ScrollView contentContainerStyle={styles.col}>
          <View style={styles.center}>
            <CardImage source={WITNESS_ART[params.id]} width={150} borderColor={color.brass} />
            <Text style={styles.big}>{info.short}</Text>
          </View>
          <Text style={styles.body}>{info.effect}</Text>
          <Text style={styles.note}>{WITNESS_NOTE}</Text>
        </ScrollView>
      </Sheet>
    );
  }
  const id = params.id;
  const slot = game?.pub.slots.find(x => x.speaker === id);
  if (params.kind === 'testimony' && slot) {
    const hints = game ? hintFor(slot.statement, game.pub.witnesses) : [];
    return (
      <Sheet title={`Testimonio de ${id}`}>
        <ScrollView contentContainerStyle={styles.col}>
          <View style={styles.paper} accessible accessibilityLabel={renderEs(slot.statement)}>
            <RichStatement st={slot.statement} size={24} lines={8} />
          </View>
          {game && game.pub.witnesses.length > 0 ? (
            <Text style={styles.note}>
              Recuerda: con {game.pub.witnesses.join(' y ')} en mesa, algunas palabras se leen distinto. Toca
              un testigo en el tablero para ver cómo.
              {hints.length > 0 && assisted
                ? `\nPista del modo asistido: este testimonio está afectado por ${hints.join(' y ')}.`
                : ''}
            </Text>
          ) : null}
          <Text style={styles.note}>Un mentiroso dice lo contrario de lo que significa su carta.</Text>
        </ScrollView>
      </Sheet>
    );
  }
  return (
    <Sheet title={id}>
      <SuspectBody id={id} statement={slot?.statement} />
    </Sheet>
  );
}

function SuspectBody({id, statement}: {id: SuspectId; statement?: Statement}) {
  const s = suspectOf(id);
  const revealed = useRevealed(id);
  const mark = useMark(id);
  return (
    <ScrollView contentContainerStyle={styles.col}>
      <View style={styles.center}>
        <SuspectCard id={id} width={180} mark={mark} />
      </View>
      <View style={styles.info}>
        <Row icon={s.gender === 'M' ? 'male' : 'female'} text={s.gender === 'M' ? 'Chico' : 'Chica'} />
        <Row icon="heart" text={`${traitLabel(s.gender, s.level)} (nivel ${s.level + 1} de 4)`} />
      </View>
      {statement && revealed ? (
        <View style={styles.paper}>
          <RichStatement st={statement} size={20} lines={8} />
        </View>
      ) : (
        <Text style={styles.note}>Su testimonio sigue boca abajo. Voltéalo en el tablero.</Text>
      )}
    </ScrollView>
  );
}

function Row({icon, text}: {icon: 'male' | 'female' | 'heart'; text: string}) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={color.gold} filled={icon === 'heart'} />
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {gap: 14, paddingBottom: 12},
  center: {alignItems: 'center', gap: 10},
  big: {...T.h2, color: color.gold},
  body: {...T.body, color: color.textOnDark},
  note: {...T.small, color: color.textMuted},
  info: {gap: 8, backgroundColor: color.wood900, borderRadius: radius.md, padding: 12},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  paper: {
    backgroundColor: '#e3cfa6',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: color.brass,
    padding: 16,
  },
});
