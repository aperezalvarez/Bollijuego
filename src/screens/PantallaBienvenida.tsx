import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, ImageBackground } from 'react-native';
import { ManualReglas } from '../components/ManualReglas';

interface PantallaBienvenidaProps {
  onSeleccionarModo: (modo: 'individual' | 'cooperativo' | 'versus') => void;
  faseInicial?: 'titulo' | 'modos';
}

const IMAGEN_PORTADA = require('../assets/images/Portada.png');

export const PantallaBienvenida = ({ onSeleccionarModo, faseInicial = 'titulo' }: PantallaBienvenidaProps) => {
  const [fase, setFase] = useState<'titulo' | 'modos'>(faseInicial);
  const [manualVisible, setManualVisible] = useState(false);
  const opacidadParpadeo = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fase === 'titulo') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacidadParpadeo, {
            toValue: 0.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacidadParpadeo, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      opacidadParpadeo.stopAnimation();
    }
  }, [fase, opacidadParpadeo]);

  if (fase === 'modos') {
    return (
      <View style={styles.pantallaModos}>
        <View style={styles.cabeceraReducida}>
          <Text style={styles.iconoMediano}>🐔</Text>
          <Text style={styles.tituloReducido}>¿Quién mató a la gallina?</Text>
        </View>
        
        <Text style={styles.textoInstruccion}>Selecciona un modo de juego</Text>
        
        <View style={styles.columnaBotones}>
          <TouchableOpacity style={styles.botonIndividual} onPress={() => onSeleccionarModo('individual')}>
            <Text style={styles.iconoBoton}>🕵️</Text>
            <View style={styles.textosBoton}>
              <Text style={styles.tituloBoton}>INDIVIDUAL</Text>
              <Text style={styles.descripcionBoton}>Resuelve el caso en solitario</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonCooperativo} onPress={() => onSeleccionarModo('cooperativo')}>
            <Text style={styles.iconoBoton}>🥚</Text>
            <View style={styles.textosBoton}>
              <Text style={styles.tituloBoton}>COOPERATIVO</Text>
              <Text style={styles.descripcionBoton}>Conexión local para 2 jugadores</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonVersus} onPress={() => onSeleccionarModo('versus')}>
            <Text style={styles.iconoBoton}>🔪</Text>
            <View style={styles.textosBoton}>
              <Text style={styles.tituloBoton}>VERSUS</Text>
              <Text style={styles.descripcionBoton}>Compite por ser el más rápido</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botonReglas} onPress={() => setManualVisible(true)}>
          <Text style={styles.textoBotonReglas}>📖 Ver Manual de Reglas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonVolver} onPress={() => setFase('titulo')}>
          <Text style={styles.textoBotonVolver}>Volver al Título</Text>
        </TouchableOpacity>

        <ManualReglas visible={manualVisible} onCerrar={() => setManualVisible(false)} />
      </View>
    );
  }

  return (
    <View style={styles.contenedorRoot}>
      <ImageBackground source={IMAGEN_PORTADA} style={styles.backgroundImage} resizeMode="cover">
        <SafeAreaView style={styles.areaSegura}>
          <TouchableOpacity style={styles.pantallaCompleta} activeOpacity={1} onPress={() => setFase('modos')}>
            <Animated.View style={[styles.contenedorParpadeo, { opacity: opacidadParpadeo }]}>
              <Text style={styles.textoParpadeante}>TOCA PARA EMPEZAR</Text>
            </Animated.View>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorRoot: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, width: '100%', height: '100%', justifyContent: 'center' },
  areaSegura: { flex: 1 },
  pantallaCompleta: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  contenedorParpadeo: { marginBottom: 80 },
  textoParpadeante: { color: '#f1c40f', fontSize: 24, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.95)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 8 },
  pantallaModos: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#1e272e' },
  cabeceraReducida: { alignItems: 'center', marginBottom: 40 },
  iconoMediano: { fontSize: 60 },
  tituloReducido: { fontSize: 24, fontWeight: 'bold', color: '#f1c40f', letterSpacing: 2, marginTop: 10, textTransform: 'uppercase', textAlign: 'center' },
  textoInstruccion: { color: '#ecf0f1', fontSize: 18, marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1 },
  columnaBotones: { width: '100%', maxWidth: 350, gap: 15 },
  
  botonIndividual: { flexDirection: 'row', backgroundColor: '#2980b9', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#3498db', elevation: 5 },
  botonCooperativo: { flexDirection: 'row', backgroundColor: '#d35400', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e67e22', elevation: 5 },
  botonVersus: { flexDirection: 'row', backgroundColor: '#c0392b', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e74c3c', elevation: 5 },
  
  iconoBoton: { fontSize: 35, marginRight: 15 },
  textosBoton: { flex: 1 },
  tituloBoton: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  descripcionBoton: { color: '#bdc3c7', fontSize: 13, marginTop: 3 },
  botonReglas: { marginTop: 25, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#34495e', borderWidth: 1, borderColor: '#7f8c8d' },
  textoBotonReglas: { color: '#ecf0f1', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  botonVolver: { marginTop: 25, padding: 15 },
  textoBotonVolver: { color: '#95a5a6', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});