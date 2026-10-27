import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CasoGenerado } from '../logic/motorMisterio';

interface PapiroNotasProps {
  visible: boolean;
  onClose: () => void;
  caso: CasoGenerado | null;
  notasGuardadas?: string;
  onActualizarNotas?: (notas: string) => void;
}

type Herramienta = 'lapiz' | 'goma';

interface Trazo {
  d: string;
  herramienta: Herramienta;
}

export const PapiroNotas = ({ visible, onClose, caso, notasGuardadas, onActualizarNotas }: PapiroNotasProps) => {
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const [trazoActual, setTrazoActual] = useState<string>('');
  const [herramientaActiva, setHerramientaActiva] = useState<Herramienta>('lapiz');

  const herramientaRef = useRef<Herramienta>(herramientaActiva);
  const pathRef = useRef<string>('');

  useEffect(() => {
    herramientaRef.current = herramientaActiva;
  }, [herramientaActiva]);

  useEffect(() => {
    if (notasGuardadas) {
      try {
        setTrazos(JSON.parse(notasGuardadas));
      } catch (e) {
        setTrazos([]);
      }
    } else {
      setTrazos([]);
    }
    setTrazoActual('');
    pathRef.current = '';
  }, [caso, notasGuardadas]);

  const limpiarNotas = () => {
    setTrazos([]);
    if (onActualizarNotas) {
      onActualizarNotas(JSON.stringify([]));
    }
    pathRef.current = '';
    setTrazoActual('');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current = `M${locationX},${locationY}`;
        setTrazoActual(pathRef.current);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current += ` L${locationX},${locationY}`;
        setTrazoActual(pathRef.current);
      },
      onPanResponderRelease: () => {
        const pathFinal = pathRef.current;
        const herramientaFinal = herramientaRef.current;
        
        if (pathFinal) {
          setTrazos(prevTrazos => {
            const nuevaLista = [...prevTrazos, { d: pathFinal, herramienta: herramientaFinal }];
            if (onActualizarNotas) {
              onActualizarNotas(JSON.stringify(nuevaLista));
            }
            return nuevaLista;
          });
        }
        
        pathRef.current = '';
        setTrazoActual('');
      }
    })
  ).current;

  if (!visible) return null;

  const renderLineasLibreta = () => {
    const lineas = [];
    for (let i = 0; i < 45; i++) {
      lineas.push(<View key={i} style={styles.lineaPapel} />);
    }
    return <View style={styles.fondoLineas} pointerEvents="none">{lineas}</View>;
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.hojaCompleta, { zIndex: 1000, elevation: 1000 }]}>
      <View style={styles.barraHerramientas}>
        <TouchableOpacity style={styles.botonAccion} onPress={onClose}>
          <Text style={styles.iconoHerramienta}>❌</Text>
        </TouchableOpacity>

        <View style={styles.grupoHerramientas}>
          <TouchableOpacity 
            style={[styles.botonHerramienta, herramientaActiva === 'lapiz' && styles.herramientaActiva]} 
            onPress={() => setHerramientaActiva('lapiz')}
          >
            <Text style={styles.iconoHerramienta}>✏️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.botonHerramienta, herramientaActiva === 'goma' && styles.herramientaActiva]} 
            onPress={() => setHerramientaActiva('goma')}
          >
            <Text style={styles.iconoHerramienta}>🧽</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.botonAccion} 
          onPress={limpiarNotas}
        >
          <Text style={styles.iconoHerramienta}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.areaDibujo} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {trazos.map((trazo, index) => (
            <Path
              key={index}
              d={trazo.d}
              stroke={trazo.herramienta === 'goma' ? '#F4E7C3' : '#1e272e'}
              strokeWidth={trazo.herramienta === 'goma' ? 40 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {trazoActual ? (
            <Path
              d={trazoActual}
              stroke={herramientaActiva === 'goma' ? '#F4E7C3' : '#1e272e'}
              strokeWidth={herramientaActiva === 'goma' ? 40 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </Svg>
        {renderLineasLibreta()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hojaCompleta: { backgroundColor: '#F4E7C3', paddingTop: 20 },
  barraHerramientas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e3d5a8', borderBottomWidth: 2, borderBottomColor: '#d4af37', elevation: 4 },
  grupoHerramientas: { flexDirection: 'row', gap: 15 },
  botonHerramienta: { padding: 10, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  herramientaActiva: { borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.2)' },
  botonAccion: { padding: 10, borderRadius: 8 },
  iconoHerramienta: { fontSize: 26 },
  areaDibujo: { flex: 1 },
  fondoLineas: { ...StyleSheet.absoluteFillObject, paddingTop: 40 },
  lineaPapel: { height: 1, backgroundColor: '#8eaeba', marginBottom: 35, opacity: 0.4 }
});