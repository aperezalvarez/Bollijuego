import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';

interface CartaTestimonioProps {
  texto: string;
  resetToken?: number;
  onPressZoom: () => void;
}

const IMAGEN_DORSO = require('../assets/images/Dorso.png');
const IMAGEN_FONDO = require('../assets/images/Testimonio.png');

export const CartaTestimonio = ({ texto, resetToken, onPressZoom }: CartaTestimonioProps) => {
  const [revelada, setRevelada] = useState(false);

  useEffect(() => {
    setRevelada(false);
  }, [resetToken]);

  if (!revelada) {
    return (
      <TouchableOpacity 
        style={styles.cartaOculta} 
        onPress={() => setRevelada(true)}
        activeOpacity={0.8}
      >
        <Image source={IMAGEN_DORSO} style={styles.imagen} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.cartaRevelada} onPress={onPressZoom} activeOpacity={0.8}>
      <ImageBackground source={IMAGEN_FONDO} style={styles.fondoImagen} resizeMode="cover">
        <View style={styles.contenedorTexto}>
          <Text style={styles.texto} numberOfLines={6}>
            {texto}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartaOculta: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartaRevelada: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#fff',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  fondoImagen: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenedorTexto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: '24%',
    paddingRight: '16%',
    paddingTop: '16%',
    paddingBottom: '26%',
  },
  texto: {
    fontSize: 10,
    color: '#3e2723',
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'serif',
    fontStyle: 'italic',
  }
});