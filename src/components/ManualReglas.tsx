import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface ManualReglasProps {
  visible: boolean;
  onCerrar: () => void;
}

export const ManualReglas = ({ visible, onCerrar }: ManualReglasProps) => {
  if (!visible) return null;

  return (
    <View style={styles.pantallaCompleta}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Manual de Reglas</Text>
        <TouchableOpacity style={styles.botonCerrar} onPress={onCerrar}>
          <Text style={styles.textoBoton}>CERRAR</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.seccionTitulo}>🎯 Objetivo del Juego</Text>
        <Text style={styles.texto}>
          Tu misión es deducir quiénes son los asesinos y quiénes son los mentirosos cruzando los testimonios de todos los sospechosos en el tablero. Fíjate en los requisitos de la partida en la parte superior para saber cuántos culpables y sapos debes atrapar.
        </Text>

        <Text style={styles.seccionTitulo}>📝 Testimonios y Mentiras</Text>
        <Text style={styles.texto}>
          Si un sospechoso dice la verdad, su testimonio es un hecho absoluto. Sin embargo, si un sospechoso es un Mentiroso, su testimonio significa EXACTAMENTE LO CONTRARIO de lo que dice. Por ejemplo, si un mentiroso dice "Ningún asesino es chico", la realidad es que "Al menos un asesino es chico".
        </Text>

        <Text style={styles.seccionTitulo}>🎮 Modos de Juego</Text>
        <View style={styles.cajaModos}>
          <Text style={styles.itemLista}><Text style={styles.resaltado}>INDIVIDUAL:</Text> Resuelve el misterio a tu propio ritmo. Ideal para practicar deducciones.</Text>
          <Text style={styles.itemLista}><Text style={styles.resaltado}>COOPERATIVO:</Text> Conéctate con un amigo. Ambos recibiréis el mismo caso exacto. Cada uno usa su propia hoja de notas y debéis razonar juntos para llegar a la misma conclusión.</Text>
          <Text style={styles.itemLista}><Text style={styles.resaltado}>VERSUS:</Text> Competitivo puro. Ambos jugáis el mismo caso al mismo tiempo. Al entregar la solución se registrará vuestro tiempo. ¡El más rápido en acertar gana!</Text>
        </View>

        <Text style={styles.seccionTitulo}>🎭 Escala de Rasgos</Text>
        <Text style={styles.texto}>
          Muchos testimonios comparan la personalidad de los asesinos ("más cariñoso que yo", "menos arisco..."). La escala de afecto va de menor a mayor de la siguiente manera:
        </Text>
        
        <View style={styles.tablaRasgos}>
          <View style={styles.filaRasgo}>
            <Text style={styles.nivelRasgo}>Nivel 0 (Muy Ariscos)</Text>
            <Text style={styles.personajesRasgo}>Tavio (Chico) y Pili (Chica)</Text>
          </View>
          <View style={styles.filaRasgo}>
            <Text style={styles.nivelRasgo}>Nivel 1 (Ariscos)</Text>
            <Text style={styles.personajesRasgo}>Pork (Chico) y Charlot (Chica)</Text>
          </View>
          <View style={styles.filaRasgo}>
            <Text style={styles.nivelRasgo}>Nivel 2 (Cariñosos)</Text>
            <Text style={styles.personajesRasgo}>Lolo (Chico) y Luisa (Chica)</Text>
          </View>
          <View style={[styles.filaRasgo, { borderBottomWidth: 0 }]}>
            <Text style={styles.nivelRasgo}>Nivel 3 (Muy Cariñosos)</Text>
            <Text style={styles.personajesRasgo}>Charls (Chico) y Reisy (Chica)</Text>
          </View>
        </View>

        <Text style={styles.seccionTitulo}>👁️ Efectos de los Testigos</Text>
        <Text style={styles.texto}>
          Los testigos pasivos alteran las reglas del juego de los testimonios. Revisa siempre quiénes están en la mesa antes de deducir:
        </Text>
        
        <View style={styles.tarjetaTestigo}>
          <Text style={styles.nombreTestigo}>Thomas</Text>
          <Text style={styles.efectoTestigo}>
            Invierte los géneros en las declaraciones. Si un sospechoso busca a un "chico", el testimonio realmente aplica a una "chica", y viceversa.
          </Text>
        </View>

        <View style={styles.tarjetaTestigo}>
          <Text style={styles.nombreTestigo}>Mr. Red</Text>
          <Text style={styles.efectoTestigo}>
            Invierte los testimonios que mencionan la palabra "Arisco" o "Muy Arisco". Pasarán a significar "Cariñoso" o "Muy Cariñoso" respectivamente.
          </Text>
        </View>

        <View style={styles.tarjetaTestigo}>
          <Text style={styles.nombreTestigo}>La Vicente</Text>
          <Text style={styles.efectoTestigo}>
            Invierte los testimonios que mencionan la palabra "Cariñoso" o "Muy Cariñoso". Pasarán a significar "Arisco" o "Muy Arisco" respectivamente.
          </Text>
        </View>

        <View style={styles.tarjetaTestigo}>
          <Text style={styles.nombreTestigo}>Croqueta Batista</Text>
          <Text style={styles.efectoTestigo}>
            Invierte las acusaciones directas. Si alguien dice que otro "miente", en realidad está diciendo que ese otro "es inocente". Si dice que "dice la verdad", significa que "es culpable".
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pantallaCompleta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e272e',
    zIndex: 1000,
    elevation: 1000,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#101418',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 3,
    borderBottomColor: '#d4af37'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1c40f',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  botonCerrar: {
    backgroundColor: '#c0392b',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c'
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  scroll: {
    padding: 20,
  },
  seccionTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d4af37',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  texto: {
    fontSize: 16,
    color: '#ecf0f1',
    lineHeight: 24,
    marginBottom: 15,
  },
  cajaModos: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3498db',
    marginBottom: 15
  },
  itemLista: {
    fontSize: 15,
    color: '#ecf0f1',
    lineHeight: 22,
    marginBottom: 10
  },
  resaltado: {
    fontWeight: 'bold',
    color: '#3498db'
  },
  tablaRasgos: {
    backgroundColor: '#101418',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d4af37',
    marginBottom: 20,
    overflow: 'hidden'
  },
  filaRasgo: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    flexDirection: 'column'
  },
  nivelRasgo: {
    color: '#f1c40f',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4
  },
  personajesRasgo: {
    color: '#ecf0f1',
    fontSize: 15
  },
  tarjetaTestigo: {
    backgroundColor: '#101418',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#d4af37'
  },
  nombreTestigo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  efectoTestigo: {
    fontSize: 15,
    color: '#bdc3c7',
    lineHeight: 22,
    fontStyle: 'italic'
  }
});