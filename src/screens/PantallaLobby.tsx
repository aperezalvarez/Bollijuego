import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { unirseSala } from '../logic/motorRed';
import { CasoGenerado } from '../logic/motorMisterio';

interface PantallaLobbyProps {
  modo: 'individual' | 'cooperativo' | 'versus';
  onVolver: () => void;
  onContinuarHost: () => void;
  onCasoRecibido: (caso: CasoGenerado) => void;
}

export const PantallaLobby = ({ modo, onVolver, onContinuarHost, onCasoRecibido }: PantallaLobbyProps) => {
  const [faseLobby, setFaseLobby] = useState<'seleccion' | 'guest_input' | 'guest_buscando'>('seleccion');
  const [codigo, setCodigo] = useState('');
  const [errorSala, setErrorSala] = useState(false);

  const tituloModo = modo === 'cooperativo' ? 'Modo Cooperativo' : 'Modo Versus';
  const iconoModo = modo === 'cooperativo' ? '🥚' : '🔪';

  const pulsarNumero = (num: string) => {
    if (codigo.length < 4) setCodigo(prev => prev + num);
  };

  const borrarNumero = () => {
    setCodigo(prev => prev.slice(0, -1));
  };

  const manejarUnirse = async () => {
    if (codigo.length !== 4) return;
    setFaseLobby('guest_buscando');
    setErrorSala(false);
    
    const caso = await unirseSala(codigo, modo);
    
    if (caso) {
      onCasoRecibido(caso);
    } else {
      setErrorSala(true);
      setCodigo('');
      setFaseLobby('guest_input');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenedorScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.cabecera}>
        <Text style={styles.iconoGran}>{iconoModo}</Text>
        <Text style={styles.titulo}>{tituloModo}</Text>
        <Text style={styles.subtitulo}>Conexión por Red</Text>
      </View>

      {faseLobby === 'seleccion' && (
        <View style={styles.cajaOpciones}>
          <Text style={styles.instruccion}>Selecciona tu rol en la partida:</Text>
          
          <TouchableOpacity style={styles.botonHost} onPress={onContinuarHost}>
            <Text style={styles.iconoBoton}>🏠</Text>
            <View style={styles.textosBoton}>
              <Text style={styles.tituloBoton}>CREAR SALA (HOST)</Text>
              <Text style={styles.descripcionBoton}>Configura el caso y obtén el código</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonGuest} onPress={() => setFaseLobby('guest_input')}>
            <Text style={styles.iconoBoton}>🔍</Text>
            <View style={styles.textosBoton}>
              <Text style={styles.tituloBoton}>UNIRSE (INVITADO)</Text>
              <Text style={styles.descripcionBoton}>Introduce el código del Host</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {faseLobby === 'guest_input' && (
        <View style={styles.cajaOpciones}>
          <Text style={styles.instruccion}>Introduce el código de 4 dígitos:</Text>
          
          <View style={styles.displayCodigo}>
            {[0, 1, 2, 3].map((index) => (
              <View key={index} style={styles.cajaDigito}>
                <Text style={styles.digito}>{codigo[index] || ''}</Text>
              </View>
            ))}
          </View>

          {errorSala && <Text style={styles.textoError}>No se encontró la sala o el modo de juego no coincide.</Text>}

          <View style={styles.tecladoNum}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <TouchableOpacity key={num} style={styles.tecla} onPress={() => pulsarNumero(num)}>
                <Text style={styles.textoTecla}>{num}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.tecla, styles.teclaVacia]} />
            <TouchableOpacity style={styles.tecla} onPress={() => pulsarNumero('0')}>
              <Text style={styles.textoTecla}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.teclaBorrar} onPress={borrarNumero}>
              <Text style={styles.textoTeclaBorrar}>⌫</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.botonBuscar, codigo.length !== 4 && { opacity: 0.5 }]} 
            onPress={manejarUnirse}
            disabled={codigo.length !== 4}
          >
            <Text style={styles.textoBotonBuscar}>BUSCAR CASO</Text>
          </TouchableOpacity>
        </View>
      )}

      {faseLobby === 'guest_buscando' && (
        <View style={styles.cajaOpciones}>
          <ActivityIndicator size="large" color="#3498db" style={styles.spinner} />
          <Text style={styles.textoEstado}>Descargando caso...</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.botonVolver} 
        onPress={() => faseLobby === 'seleccion' ? onVolver() : setFaseLobby('seleccion')}
      >
        <Text style={styles.textoBotonVolver}>
          {faseLobby === 'seleccion' ? 'VOLVER AL MENÚ' : 'CANCELAR'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenedorScroll: { flexGrow: 1, backgroundColor: '#1e272e', alignItems: 'center', justifyContent: 'center', padding: 20, paddingVertical: 40 },
  cabecera: { alignItems: 'center', marginBottom: 30 },
  iconoGran: { fontSize: 60, marginBottom: 10 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#f1c40f', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#ecf0f1', letterSpacing: 3, marginTop: 5, textTransform: 'uppercase' },
  cajaOpciones: { width: '100%', maxWidth: 350, backgroundColor: '#101418', borderRadius: 15, padding: 20, borderWidth: 2, borderColor: '#34495e', alignItems: 'center', minHeight: 300, justifyContent: 'center' },
  instruccion: { color: '#bdc3c7', fontSize: 16, marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
  botonHost: { flexDirection: 'row', backgroundColor: '#d35400', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#e67e22', width: '100%', marginBottom: 15, elevation: 5 },
  botonGuest: { flexDirection: 'row', backgroundColor: '#2980b9', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#3498db', width: '100%', elevation: 5 },
  iconoBoton: { fontSize: 30, marginRight: 15 },
  textosBoton: { flex: 1 },
  tituloBoton: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  descripcionBoton: { color: '#ecf0f1', fontSize: 12, marginTop: 3, opacity: 0.8 },
  displayCodigo: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 15, width: '100%' },
  cajaDigito: { width: 48, height: 55, backgroundColor: '#1e272e', borderRadius: 10, borderWidth: 2, borderColor: '#f1c40f', justifyContent: 'center', alignItems: 'center' },
  digito: { color: '#f1c40f', fontSize: 28, fontWeight: 'bold' },
  tecladoNum: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 15, width: 260 },
  tecla: { width: 75, height: 55, backgroundColor: '#2c3e50', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#34495e', elevation: 2 },
  teclaVacia: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 },
  textoTecla: { color: '#ecf0f1', fontSize: 24, fontWeight: 'bold' },
  teclaBorrar: { width: 75, height: 55, backgroundColor: '#c0392b', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c', elevation: 2 },
  textoTeclaBorrar: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  botonBuscar: { backgroundColor: '#27ae60', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#2ecc71', width: '100%', elevation: 5 },
  textoBotonBuscar: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  textoError: { color: '#e74c3c', textAlign: 'center', marginBottom: 15, fontWeight: 'bold', fontSize: 13 },
  spinner: { marginVertical: 20 },
  textoEstado: { color: '#3498db', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  botonVolver: { marginTop: 20, padding: 15 },
  textoBotonVolver: { color: '#95a5a6', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});