import React, {memo} from 'react';
import type {ImageSourcePropType} from 'react-native';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {ART, SUSPECT_ART, WITNESS_ART} from '../assets/cards';
import {
  WITNESS_INFO,
  hintFor,
  renderEs,
  segmentsEs,
  suspectOf,
  traitLabel,
  type SegKind,
  type Statement,
  type SuspectId,
  type WitnessId,
} from '../domain';
import {useMark, useRevealed, useStore, type Mark} from '../state/store';
import {FlipCard} from './FlipCard';
import {Icon} from './Icon';
import {haptic} from './haptics';
import {sfx} from './sound';
import {CARD_ASPECT, color} from './theme';

export const cardHeight = (w: number) => w / CARD_ASPECT;
/** Radio proporcional y pequeño: el marco ornamental de la ilustración ya trae sus esquinas. */
export const cardRadius = (w: number) => Math.max(3, Math.round(w * 0.032));

/**
 * ÚNICO punto donde se pinta una ilustración. Contenedor Y imagen llevan tamaño numérico explícito
 * (nada de absoluteFill ni tamaño intrínseco), `resizeMethod="resize"` obliga a Android a decodificar
 * al tamaño pedido en vez del bitmap completo escalado por densidad, y el borde va ENCIMA.
 * `height` por defecto respeta CARD_ASPECT; la portada/tablas usan `contain` para verse enteras.
 */
export function CardImage({
  source,
  width,
  height = cardHeight(width),
  fit = 'cover',
  borderColor,
  borderWidth = 2,
  label,
}: {
  source: ImageSourcePropType;
  width: number;
  height?: number;
  fit?: 'cover' | 'contain';
  borderColor?: string;
  borderWidth?: number;
  label?: string;
}) {
  const r = cardRadius(width);
  return (
    <View style={{width, height, borderRadius: r, overflow: 'hidden'}}>
      <Image
        source={source}
        style={{width, height}}
        resizeMode={fit}
        resizeMethod="resize"
        fadeDuration={0}
        accessible={!!label}
        accessibilityLabel={label}
      />
      {borderColor ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {borderRadius: r, borderWidth, borderColor}]}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------- texto enriquecido
const SEG_COLOR: Record<SegKind, string> = {
  plain: color.ink,
  quant: color.ink,
  name: '#7a1f17',
  gender: '#1c3f66',
  trait: '#5c3000',
  compare: '#4a2a63',
};

/** Testimonio con el vocabulario clave resaltado (cuantificador, género, rasgo, comparativa, nombres). */
export function RichStatement({st, size, lines = 9}: {st: Statement; size: number; lines?: number}) {
  return (
    <Text
      accessibilityLabel={renderEs(st)}
      adjustsFontSizeToFit
      minimumFontScale={0.9}
      maxFontSizeMultiplier={1.25}
      numberOfLines={lines}
      style={{
        fontFamily: 'serif',
        fontSize: size,
        lineHeight: size * 1.3,
        textAlign: 'center',
        color: color.ink,
      }}>
      {segmentsEs(st).map((s, i) => (
        <Text
          key={i}
          style={{
            color: SEG_COLOR[s.kind],
            fontWeight: s.kind === 'plain' ? '600' : '800',
            textDecorationLine: s.kind === 'name' ? 'underline' : 'none',
          }}>
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

// ---------------------------------------------------------------- carta de sospechoso
function HeartMeter({level}: {level: number}) {
  return (
    <View style={styles.hearts} accessibilityElementsHidden>
      {[0, 1, 2, 3].map(i => (
        <Icon
          key={i}
          name="heart"
          size={13}
          color={i <= level ? '#e0604e' : 'rgba(241,230,204,0.4)'}
          filled={i <= level}
        />
      ))}
    </View>
  );
}

export const GenderBadge = ({gender, size = 26}: {gender: 'M' | 'F'; size?: number}) => (
  <View style={[styles.roundel, {width: size, height: size, borderRadius: size / 2}]}>
    <Icon name={gender === 'M' ? 'male' : 'female'} size={size * 0.68} color={color.ink} />
  </View>
);

interface SuspectProps {
  id: SuspectId;
  width: number;
  onPress?: () => void;
  mark?: Mark;
  showStamps?: boolean;
}

export const SuspectCard = memo(function SuspectCard({
  id,
  width,
  onPress,
  mark,
  showStamps = true,
}: SuspectProps) {
  const s = suspectOf(id);
  const h = cardHeight(width);
  const guilty = mark?.guilt === 'guilty';
  const cleared = mark?.guilt === 'innocent';
  const liar = mark?.honesty === 'liar';
  const fs = Math.max(13, Math.min(17, width * 0.095));
  // Sin onPress la carta es solo visual: un Pressable hijo sin acción se queda con el gesto y el
  // Pressable padre (p. ej. la selección de la rejilla) solo respondía con dos dedos.
  const Wrapper = onPress ? Pressable : View;
  const interactive = onPress ? {onPress, accessibilityRole: 'button' as const} : {accessible: true};
  return (
    <Wrapper
      {...interactive}
      accessibilityLabel={`${id}, ${s.gender === 'M' ? 'chico' : 'chica'}, ${traitLabel(
        s.gender,
        s.level,
      ).toLowerCase()}${guilty ? ', marcado como posible asesino' : ''}${
        liar ? ', marcado como mentiroso' : ''
      }${cleared ? ', descartado' : ''}`}
      accessibilityHint={onPress ? 'Abre la ficha del sospechoso' : undefined}
      style={[styles.card, {width, height: h, borderRadius: cardRadius(width)}]}>
      <CardImage source={SUSPECT_ART[id]} width={width} />
      {guilty || liar ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.frameOverlay,
            {borderRadius: cardRadius(width), borderColor: guilty ? color.bloodBright : color.gold},
          ]}
        />
      ) : null}
      <View style={[styles.topRow, {top: h * 0.06, left: width * 0.08, right: width * 0.08}]}>
        <GenderBadge gender={s.gender} size={Math.max(24, width * 0.16)} />
        <HeartMeter level={s.level} />
      </View>
      {showStamps && (guilty || liar || cleared) ? (
        <View style={styles.stamps}>
          {guilty ? <Stamp icon="knife" bg={color.blood} /> : null}
          {liar ? <Stamp icon="mask" bg="#8a6a1f" /> : null}
          {cleared ? <Stamp icon="shield" bg={color.sage} /> : null}
        </View>
      ) : null}
      <View style={[styles.ribbon, {bottom: h * 0.055, left: width * 0.1, right: width * 0.1}]}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.ribbonText, {fontSize: fs}]}>
          {id}
        </Text>
      </View>
      {cleared ? <View pointerEvents="none" style={styles.dim} /> : null}
    </Wrapper>
  );
});

const Stamp = ({icon, bg}: {icon: 'knife' | 'mask' | 'shield'; bg: string}) => (
  <View style={[styles.stamp, {backgroundColor: bg}]}>
    <Icon name={icon} size={18} color={color.textOnDark} />
  </View>
);

/** Versión conectada al store (revelado/marcas) para el tablero. */
export function BoardSuspect({id, width, onPress}: {id: SuspectId; width: number; onPress: () => void}) {
  const mark = useMark(id);
  return <SuspectCard id={id} width={width} onPress={onPress} mark={mark} />;
}

// ---------------------------------------------------------------- carta de testimonio
interface TestimonyProps {
  id: SuspectId;
  st: Statement;
  width: number;
  witnesses: readonly WitnessId[];
  onZoom: () => void;
}

export function TestimonyCard({id, st, width, witnesses, onZoom}: TestimonyProps) {
  const revealed = useRevealed(id);
  const assisted = useStore(s => s.settings.assisted);
  const h = cardHeight(width);
  const size = Math.max(13, Math.min(17, width * 0.085));
  const hints = assisted ? hintFor(st, witnesses) : [];

  const face = (
    <View style={{width, height: h}}>
      <CardImage source={ART.testimonio} width={width} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            paddingLeft: width * 0.22,
            paddingRight: width * 0.15,
            paddingTop: width * 0.15,
            paddingBottom: width * 0.25,
            justifyContent: 'center',
          },
        ]}>
        <View style={styles.plate}>
          <RichStatement st={st} size={size} />
        </View>
      </View>
      {hints.length > 0 ? (
        <View style={styles.hintChip} accessibilityLabel={`Lectura alterada por ${hints.join(' y ')}`}>
          <Text style={styles.hintText}>
            {hints
              .map(w =>
                WITNESS_INFO[w].title
                  .split(' ')
                  .map(x => x[0])
                  .join(''),
              )
              .join('·')}
          </Text>
        </View>
      ) : null}
    </View>
  );
  const back = <CardImage source={ART.dorso} width={width} />;

  return (
    <View style={{width, height: h}}>
      <FlipCard
        flipped={revealed}
        front={face}
        back={back}
        radius={cardRadius(width)}
        style={{width, height: h, aspectRatio: undefined}}
        onPress={() => {
          if (!revealed) {
            haptic('flip');
            sfx('flip');
            useStore.getState().reveal(id);
          } else {
            onZoom();
          }
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------- testigo
export function WitnessTile({id, onPress}: {id: WitnessId; onPress: () => void}) {
  const w = 74;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Testigo ${id}: ${WITNESS_INFO[id].short}`}
      accessibilityHint="Explica su efecto"
      style={styles.witness}>
      <CardImage source={WITNESS_ART[id]} width={w} borderColor={color.brass} />
      <Text style={styles.witnessName} numberOfLines={1}>
        {id}
      </Text>
      <Text style={styles.witnessEffect} numberOfLines={2}>
        {WITNESS_INFO[id].short}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: color.wood800,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  frameOverlay: {borderWidth: 2},
  topRow: {position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  roundel: {
    backgroundColor: color.gold,
    borderWidth: 1.5,
    borderColor: color.brass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hearts: {
    flexDirection: 'row',
    gap: 1,
    backgroundColor: 'rgba(27,18,12,0.72)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ribbon: {
    position: 'absolute',
    backgroundColor: 'rgba(234,217,182,0.96)',
    borderWidth: 1.5,
    borderColor: color.brass,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  ribbonText: {
    fontFamily: 'serif',
    fontWeight: '800',
    color: color.ink,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stamps: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '17%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  stamp: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: color.textOnDark,
  },
  dim: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,12,8,0.5)'},
  // Sin caja ni fondo: el texto va directo sobre el pergamino ilustrado.
  plate: {paddingHorizontal: 4, paddingVertical: 4},
  hintChip: {
    position: 'absolute',
    top: '7%',
    left: '9%',
    backgroundColor: color.gold,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: color.brass,
  },
  hintText: {fontSize: 11, fontWeight: '800', color: color.ink},
  witness: {width: 92, alignItems: 'center', gap: 3},
  witnessName: {color: color.textOnDark, fontWeight: '800', fontSize: 12, fontFamily: 'serif'},
  witnessEffect: {color: color.gold, fontSize: 11, textAlign: 'center', fontWeight: '700'},
});
