import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Personaje } from '../logic/tipos';

interface CartaSospechosoProps {
  personaje: Personaje;
  onPressZoom: () => void;
}

const IMAGENES: Record<string, any> = {
  "Tavio": require('../assets/images/Tavio.png'),
  "Pili": require('../assets/images/Pili.png'),
  "Pork": require('../assets/images/Pork.png'),
  "Charlot": require('../assets/images/Charlot.png'),
  "Lolo": require('../assets/images/Lolo.png'),
  "Luisa": require('../assets/images/Luisa.png'),
  "Charls": require('../assets/images/Charls.png'),
  "Reisy": require('../assets/images/Reisy.png')
};

export const CartaSospechoso = ({ personaje, onPressZoom }: CartaSospechosoProps) => {
  return (
    <TouchableOpacity style={styles.carta} onPress={onPressZoom} activeOpacity={0.8}>
      <Image source={IMAGENES[personaje.nombre]} style={styles.imagen} resizeMode="cover" />
      <View style={styles.etiquetaNombre}>
        <Text style={styles.textoNombre}>{personaje.nombre}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  carta: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#2c3e50',
  },
  imagen: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  etiquetaNombre: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  textoNombre: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  }
});