import React, {useMemo, useRef, useState} from 'react';
import {Alert, PanResponder, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Svg, {Line, Path} from 'react-native-svg';
import {suspectOf, type SuspectId} from '../../../domain';
import {useMark, useStore, type Honesty, type Guilt, type Stroke} from '../../../state/store';
import {IconButton} from '../../../ui/Button';
import {Chips} from '../../../ui/Controls';
import {GenderBadge} from '../../../ui/cards';
import {haptic} from '../../../ui/haptics';
import {sfx} from '../../../ui/sound';
import {Sheet} from '../../../ui/Sheet';
import {color, hit, radius} from '../../../ui/theme';

type Tab = 'tabla' | 'dibujo';
const INKS = ['#2a1a12', '#8e2a22', '#1c3f66', '#46603a'];
const WIDTHS = [2, 4, 7];
const PAPER = '#ead9b6';

/** Un fallo dentro del cuaderno nunca debe cerrar la app: se muestra un aviso dentro de la hoja. */
class NotesBoundary extends React.Component<{children: React.ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  render() {
    if (this.state.failed) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.summary}>No se pudo mostrar esta pestaña.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            onPress={() => this.setState({failed: false})}
            style={styles.segBtn}>
            <Text style={styles.segText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export function NotesSheet() {
  const tab = useStore(s => s.notesTab);
  const setTab = useStore(s => s.setNotesTab);
  return (
    <Sheet title="Cuaderno de notas" tall>
      <Chips<Tab>
        options={[
          {id: 'tabla', label: 'Tabla de deducción'},
          {id: 'dibujo', label: 'Dibujo libre'},
        ]}
        value={tab}
        onChange={setTab}
      />
      <View style={styles.paper}>
        <NotesBoundary key={tab}>{tab === 'dibujo' ? <Canvas /> : <DeductionTable />}</NotesBoundary>
      </View>
    </Sheet>
  );
}

// ---------------------------------------------------------------- tabla de deducción
function DeductionTable() {
  // Selector estable: devolver un array nuevo por lectura provoca un bucle infinito de renders (zustand 5).
  const slots = useStore(s => s.game?.pub.slots);
  const speakers = useMemo(() => (slots ?? []).map(x => x.speaker), [slots]);
  const nK = useStore(s => s.game?.pub.killers ?? 0);
  const nL = useStore(s => s.game?.pub.liars ?? 0);
  const marks = useStore(s => s.marks);
  const guilty = speakers.filter(id => marks[id]?.guilt === 'guilty').length;
  const liars = speakers.filter(id => marks[id]?.honesty === 'liar').length;
  return (
    <ScrollView contentContainerStyle={{padding: 12, gap: 10}}>
      <Text style={styles.summary}>
        Culpables marcados {guilty}/{nK} · Mentirosos marcados {liars}/{nL}
      </Text>
      <Text style={styles.hintInk}>
        Marca lo que vas deduciendo; se refleja en las cartas y precarga la entrega. Un toque repetido lo
        quita.
      </Text>
      {speakers.map(id => (
        <TableRow key={id} id={id} />
      ))}
    </ScrollView>
  );
}

function TableRow({id}: {id: SuspectId}) {
  const m = useMark(id);
  const {setHonesty, setGuilt} = useStore.getState();
  return (
    <View style={styles.row}>
      <View style={styles.who}>
        <GenderBadge gender={suspectOf(id).gender} size={24} />
        <Text style={styles.name}>{id}</Text>
      </View>
      <View style={styles.seg}>
        <Seg
          label="Dice la verdad"
          on={m.honesty === 'truthful'}
          tone={color.sage}
          onPress={() => act(() => setHonesty(id, 'truthful' as Honesty))}
        />
        <Seg
          label="Miente"
          on={m.honesty === 'liar'}
          tone="#8a6a1f"
          onPress={() => act(() => setHonesty(id, 'liar' as Honesty))}
        />
      </View>
      <View style={styles.seg}>
        <Seg
          label="Inocente"
          on={m.guilt === 'innocent'}
          tone={color.sage}
          onPress={() => act(() => setGuilt(id, 'innocent' as Guilt))}
        />
        <Seg
          label="Culpable"
          on={m.guilt === 'guilty'}
          tone={color.blood}
          onPress={() => act(() => setGuilt(id, 'guilty' as Guilt))}
        />
      </View>
    </View>
  );
}
const act = (f: () => void) => {
  haptic('select');
  sfx('stamp');
  f();
};
function Seg({label, on, tone, onPress}: {label: string; on: boolean; tone: string; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: on}}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.segBtn, on && {backgroundColor: tone, borderColor: '#2a1a12'}]}>
      <Text style={[styles.segText, on && {color: color.textOnDark}]} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------- lienzo (trazos vectoriales)
/** Trazo → ruta SVG con suavizado cuadrático (puntos medios). */
export function pathOf(pts: number[]): string {
  if (pts.length < 2) {
    return '';
  }
  if (pts.length === 2) {
    return `M${pts[0]} ${pts[1]} l0.01 0`;
  }
  let d = `M${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2;
    const my = (pts[i + 1] + pts[i + 3]) / 2;
    d += ` Q${pts[i]} ${pts[i + 1]} ${mx} ${my}`;
  }
  return `${d} L${pts[pts.length - 2]} ${pts[pts.length - 1]}`;
}

const StrokePath = React.memo(function StrokePath({s}: {s: Stroke}) {
  if (!Array.isArray(s?.pts) || s.pts.length < 2) {
    return null; // trazo corrupto en el estado persistido
  }
  return (
    <Path
      d={pathOf(s.pts)}
      stroke={s.color}
      strokeWidth={s.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
});

type Live = {set: (pts: number[]) => void};
const LiveStroke = React.forwardRef<Live, {color: string; width: number}>(function LiveStroke(
  {color: c, width},
  ref,
) {
  const [pts, setPts] = useState<number[]>([]);
  React.useImperativeHandle(ref, () => ({set: setPts}), []);
  return pts.length ? (
    <Path
      d={pathOf(pts)}
      stroke={c}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ) : null;
});

/** Los gestos del lienzo jamás propagan una excepción al hilo de eventos. */
const safe = (f: () => void) => {
  try {
    f();
  } catch {
    // gesto descartado
  }
};

function Canvas() {
  const strokes = useStore(s => s.strokes);
  const ink = useStore(s => s.strokeColor);
  const width = useStore(s => s.strokeWidth);
  const [eraser, setEraser] = useState(false);
  const live = useRef<Live>(null);
  const cur = useRef<number[]>([]);
  const tool = useRef({eraser, ink, width});
  tool.current = {eraser, ink, width};

  const pan = useMemo(() => {
    const add = (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      const c = cur.current;
      if (c.length >= 2 && Math.hypot(x - c[c.length - 2], y - c[c.length - 1]) < 2.5) {
        return;
      }
      c.push(x, y);
      live.current?.set([...c]);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e =>
        safe(() => {
          const {locationX: x, locationY: y} = e.nativeEvent;
          if (tool.current.eraser) {
            erase(x, y);
          } else {
            cur.current = [];
            add(x, y);
          }
        }),
      onPanResponderMove: e =>
        safe(() => {
          const {locationX: x, locationY: y} = e.nativeEvent;
          if (tool.current.eraser) {
            erase(x, y);
          } else {
            add(x, y);
          }
        }),
      onPanResponderRelease: () => safe(end),
      onPanResponderTerminate: () => safe(end),
    });
    function erase(x: number, y: number) {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        useStore.getState().eraseAt(x, y, 14);
      }
    }
    function end() {
      if (!tool.current.eraser && cur.current.length >= 2) {
        useStore.getState().addStroke({color: tool.current.ink, width: tool.current.width, pts: cur.current});
      }
      cur.current = [];
      live.current?.set([]);
    }
  }, []);

  return (
    <View style={{flex: 1}}>
      <View style={styles.tools}>
        <IconButton
          icon="pencil"
          label="Lápiz"
          active={!eraser}
          onPress={() => setEraser(false)}
          tone={color.ink}
        />
        <IconButton
          icon="eraser"
          label="Goma de borrar"
          active={eraser}
          onPress={() => setEraser(true)}
          tone={color.ink}
        />
        <IconButton
          icon="undo"
          label="Deshacer"
          onPress={() => useStore.getState().undoStroke()}
          tone={color.ink}
        />
        <IconButton
          icon="trash"
          label="Borrar todo"
          tone={color.ink}
          onPress={() =>
            strokes.length &&
            Alert.alert('Borrar todo', '¿Borrar todo el dibujo?', [
              {text: 'Cancelar', style: 'cancel'},
              {text: 'Borrar', style: 'destructive', onPress: () => useStore.getState().clearStrokes()},
            ])
          }
        />
        <View style={styles.sep} />
        {INKS.map(c => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Tinta ${c}`}
            accessibilityState={{selected: ink === c && !eraser}}
            onPress={() => {
              useStore.getState().setPen({color: c});
              setEraser(false);
            }}
            style={[styles.dot, {backgroundColor: c}, ink === c && !eraser && styles.dotOn]}
          />
        ))}
        <View style={styles.sep} />
        {WIDTHS.map(w => (
          <Pressable
            key={w}
            accessibilityRole="button"
            accessibilityLabel={`Grosor ${w}`}
            accessibilityState={{selected: width === w}}
            onPress={() => useStore.getState().setPen({width: w})}
            style={[styles.wBtn, width === w && styles.dotOn]}>
            <View style={{width: 22, height: w, borderRadius: w, backgroundColor: color.ink}} />
          </Pressable>
        ))}
      </View>
      <View style={styles.canvas} {...pan.panHandlers}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({length: 30}, (_, i) => (
            <Line
              key={i}
              x1="0"
              x2="100%"
              y1={40 + i * 34}
              y2={40 + i * 34}
              stroke="#7a9aa8"
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ))}
          {strokes.map((s, i) => (
            <StrokePath key={i} s={s} />
          ))}
          <LiveStroke ref={live} color={ink} width={width} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    backgroundColor: PAPER,
    borderRadius: radius.md,
    marginTop: 10,
    borderWidth: 2,
    borderColor: color.brass,
    overflow: 'hidden',
  },
  fallback: {flex: 1, padding: 16, gap: 12, justifyContent: 'center'},
  summary: {color: color.ink, fontWeight: '800', fontSize: 15, textAlign: 'center'},
  hintInk: {color: '#4a3526', fontSize: 13, textAlign: 'center'},
  row: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: radius.md,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#c9b48a',
  },
  who: {flexDirection: 'row', alignItems: 'center', gap: 8},
  name: {color: color.ink, fontFamily: 'serif', fontWeight: '800', fontSize: 17},
  seg: {flexDirection: 'row', gap: 6},
  segBtn: {
    flex: 1,
    minHeight: hit.min,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#a8916a',
    backgroundColor: '#f3e7c8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  segText: {color: color.ink, fontWeight: '800', fontSize: 13},
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#d9c597',
    borderBottomWidth: 1.5,
    borderColor: color.brass,
  },
  sep: {width: 1.5, height: 26, backgroundColor: '#a8916a', marginHorizontal: 4},
  dot: {width: 30, height: 30, borderRadius: 15, margin: 6, borderWidth: 2, borderColor: 'transparent'},
  dotOn: {borderColor: color.brass, transform: [{scale: 1.15}]},
  wBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  canvas: {flex: 1, minHeight: 300, backgroundColor: PAPER},
});
