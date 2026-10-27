import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {explain, type GameCase} from '../../domain';
import {Icon} from '../../ui/Icon';
import {GenderBadge} from '../../ui/cards';
import {suspectOf} from '../../domain';
import {color, radius} from '../../ui/theme';

/** «¿Por qué esta es la solución?»: qué dijo cada uno, cómo lo leyeron los testigos y por qué era verdad o mentira. */
export function ExplainList({game}: {game: GameCase}) {
  const rows = explain(game);
  return (
    <View style={{gap: 10}}>
      {rows.map(e => {
        const killer = game.solution.killers.includes(e.speaker);
        return (
          <View
            key={e.speaker}
            style={styles.card}
            accessible
            accessibilityLabel={`${e.speaker}${killer ? ', asesino' : ''}${
              e.isLiar ? ', mentiroso' : ''
            }. Dijo: ${e.said}. ${e.readDiffers ? `Se lee: ${e.read}. ` : ''}${
              e.holdsInTruth ? 'Es verdad' : 'Es mentira'
            }.`}>
            <View style={styles.head}>
              <GenderBadge gender={suspectOf(e.speaker).gender} size={24} />
              <Text style={styles.name}>{e.speaker}</Text>
              <View style={{flex: 1}} />
              {killer ? <Tag icon="knife" label="Asesino" bg={color.blood} /> : null}
              {e.isLiar ? <Tag icon="mask" label="Mentiroso" bg="#8a6a1f" /> : null}
            </View>
            <Text style={styles.said}>Dijo: «{e.said}»</Text>
            {e.readDiffers ? <Text style={styles.read}>Con los testigos se lee: «{e.read}»</Text> : null}
            <Text style={[styles.verdict, {color: e.holdsInTruth ? '#9bd17f' : '#f08d7b'}]}>
              {e.holdsInTruth ? 'Es VERDAD → dice la verdad' : 'Es MENTIRA → es mentiroso'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const Tag = ({icon, label, bg}: {icon: 'knife' | 'mask'; label: string; bg: string}) => (
  <View style={[styles.tag, {backgroundColor: bg}]}>
    <Icon name={icon} size={13} color={color.textOnDark} />
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: color.wood700,
  },
  head: {flexDirection: 'row', alignItems: 'center', gap: 8},
  name: {color: color.gold, fontFamily: 'serif', fontWeight: '800', fontSize: 17},
  said: {color: color.textOnDark, fontSize: 14, lineHeight: 20},
  read: {color: '#e7c982', fontSize: 14, lineHeight: 20, fontStyle: 'italic'},
  verdict: {fontWeight: '800', fontSize: 13, marginTop: 2},
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {color: color.textOnDark, fontSize: 11, fontWeight: '800'},
});
