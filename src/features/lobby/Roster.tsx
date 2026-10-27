import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {PlayerInfo} from '../../net/protocol';
import {ConnectionDot} from '../../ui/ConnectionDot';
import {Icon} from '../../ui/Icon';
import {color, radius} from '../../ui/theme';

/** Jugadores de la sala con el estado de conexión de cada uno, en tiempo real. */
export function Roster({
  players,
  youId,
  showReady = true,
}: {
  players: PlayerInfo[];
  youId?: string | null;
  showReady?: boolean;
}) {
  return (
    <View style={{gap: 8}}>
      {players.map(p => (
        <View
          key={p.id}
          style={styles.row}
          accessible
          accessibilityLabel={`${p.name}${p.isHost ? ', anfitrión' : ''}${p.id === youId ? ', tú' : ''}, ${
            p.link === 'ok'
              ? 'conectado'
              : p.link === 'degraded'
              ? 'conexión inestable'
              : p.link === 'reconnecting'
              ? 'reconectando'
              : 'conectando'
          }${p.ready ? ', listo' : ''}`}>
          <ConnectionDot link={p.link} rttMs={p.rttMs} />
          <View style={{flex: 1}}>
            <Text style={styles.name} numberOfLines={1}>
              {p.name}
              {p.id === youId ? ' (tú)' : ''}
            </Text>
            <Text style={styles.sub}>
              {p.isHost ? 'Anfitrión · ' : ''}
              {p.link === 'ok'
                ? p.rttMs !== undefined
                  ? `${p.rttMs} ms`
                  : 'Conectado'
                : p.link === 'degraded'
                ? 'Conexión inestable'
                : p.link === 'reconnecting'
                ? 'Reconectando…'
                : 'Conectando…'}
            </Text>
          </View>
          {p.submitted ? (
            <Icon name="check" size={20} color="#9bd17f" />
          ) : showReady && p.ready ? (
            <Text style={styles.ready}>LISTO</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.wood900,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: color.wood700,
    minHeight: 56,
  },
  name: {color: color.textOnDark, fontWeight: '800', fontSize: 16},
  sub: {color: color.textMuted, fontSize: 12},
  ready: {color: '#9bd17f', fontWeight: '800', fontSize: 12, letterSpacing: 1},
});
