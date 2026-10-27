import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, StatusBar } from 'react-native';
import { generarCaso, CasoGenerado } from './src/logic/motorMisterio';
import { crearSala, comprobarEstadoSala, apagarRed } from './src/logic/motorRed';
import { PantallaBienvenida } from './src/screens/PantallaBienvenida';
import { PantallaLobby } from './src/screens/PantallaLobby';
import { PantallaInicio } from './src/screens/PantallaInicio';
import { PantallaTablero } from './src/screens/PantallaTablero';
import { PapiroNotas } from './src/components/PapiroNotas';
import { ModalSolucion } from './src/components/ModalSolucion';

export default function App() {
  const [pantallaActiva, setPantallaActiva] = useState<'bienvenida' | 'lobby' | 'configuracion' | 'transmitiendo' | 'juego'>('bienvenida');
  const [faseBienvenida, setFaseBienvenida] = useState<'titulo' | 'modos'>('titulo');
  const [modoJuego, setModoJuego] = useState<'individual' | 'cooperativo' | 'versus'>('individual');
  const [caso, setCaso] = useState<CasoGenerado | null>(null);
  const [configActual, setConfigActual] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [codigoSala, setCodigoSala] = useState<string | null>(null);
  const [notasJugador, setNotasJugador] = useState('');
  const [modalNotasVisible, setModalNotasVisible] = useState(false);
  const [modalSolucionVisible, setModalSolucionVisible] = useState(false);
  const [modalAbandonarVisible, setModalAbandonarVisible] = useState(false);
  const [modalErrorVisible, setModalErrorVisible] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [tiempoInicio, setTiempoInicio] = useState<number>(0);

  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (pantallaActiva === 'transmitiendo' && codigoSala) {
      intervalo = setInterval(async () => {
        const iniciada = await comprobarEstadoSala(codigoSala);
        if (iniciada) {
          clearInterval(intervalo);
          setPantallaActiva('juego');
          setTiempoInicio(Date.now());
        }
      }, 1500);
    }
    return () => clearInterval(intervalo);
  }, [pantallaActiva, codigoSala]);

  const manejarSeleccionModo = (modo: 'individual' | 'cooperativo' | 'versus') => {
    setModoJuego(modo);
    if (modo === 'individual') {
      setPantallaActiva('configuracion');
    } else {
      setPantallaActiva('lobby');
    }
  };

  const manejarCasoRecibido = (casoDescargado: CasoGenerado) => {
    setCaso(casoDescargado);
    setGameKey(k => k + 1);
    setTiempoInicio(Date.now());
    setPantallaActiva('juego');
  };

  const iniciarNuevoCaso = async (config: any) => {
    setCargando(true);
    setConfigActual(config);
    setNotasJugador('');
    
    setTimeout(async () => {
      try {
        const nuevoCaso = generarCaso(config);
        if (!nuevoCaso.asignaciones || nuevoCaso.asignaciones.length === 0) throw new Error("Imposible generar caso");
        setCaso(nuevoCaso);
        setGameKey(k => k + 1);
        
        if (modoJuego !== 'individual') {
          const codigo = await crearSala(nuevoCaso, modoJuego);
          if (codigo) {
            setCodigoSala(codigo);
            setPantallaActiva('transmitiendo');
          } else {
            setMensajeError('Error de red al crear la sala.');
            setModalErrorVisible(true);
          }
        } else {
          setTiempoInicio(Date.now());
          setPantallaActiva('juego');
        }
      } catch (error) {
        setMensajeError('No se pudo generar un caso válido.');
        setModalErrorVisible(true);
      } finally {
        setCargando(false);
      }
    }, 150);
  };

  const handleReroll = () => {
    if (!configActual) return;
    setCargando(true);
    setModalSolucionVisible(false);
    setModalNotasVisible(false);
    setNotasJugador('');
    
    setTimeout(() => {
      try {
        const nuevoCaso = generarCaso(configActual);
        setCaso(nuevoCaso);
        setGameKey(k => k + 1);
        setTiempoInicio(Date.now());
      } catch (error) {
        setMensajeError('No se pudo regenerar el caso.');
        setModalErrorVisible(true);
      } finally {
        setCargando(false);
      }
    }, 150);
  };

  const solicitarAbandonar = () => setModalAbandonarVisible(true);

  const confirmarAbandonar = () => {
    apagarRed();
    setCaso(null);
    setConfigActual(null);
    setCodigoSala(null);
    setNotasJugador('');
    setTiempoInicio(0);
    setModalAbandonarVisible(false);
    setModalSolucionVisible(false);
    setModalNotasVisible(false);
    
    if (modoJuego === 'individual') {
      setPantallaActiva('configuracion');
    } else {
      setPantallaActiva('lobby');
    }
  };

  const cancelarHost = () => {
    apagarRed();
    setCodigoSala(null);
    setCaso(null);
    setPantallaActiva('lobby');
  };

  const volverDesdeConfiguracion = () => {
    if (modoJuego === 'individual') {
      setFaseBienvenida('modos');
      setPantallaActiva('bienvenida');
    } else {
      setPantallaActiva('lobby');
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#f1c40f" />
        <Text style={styles.textoCargando}>Buscando el crimen perfecto...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#1e272e" translucent={false} />
      
      {pantallaActiva === 'bienvenida' && <PantallaBienvenida faseInicial={faseBienvenida} onSeleccionarModo={manejarSeleccionModo} />}
      {pantallaActiva === 'lobby' && (
        <PantallaLobby 
          modo={modoJuego} 
          onVolver={() => {
            setFaseBienvenida('modos');
            setPantallaActiva('bienvenida');
          }} 
          onContinuarHost={() => setPantallaActiva('configuracion')} 
          onCasoRecibido={manejarCasoRecibido} 
        />
      )}
      {pantallaActiva === 'configuracion' && <PantallaInicio modo={modoJuego} onGenerarCaso={iniciarNuevoCaso} onVolver={volverDesdeConfiguracion} />}

      {pantallaActiva === 'transmitiendo' && (
        <View style={styles.centro}>
          <Text style={styles.iconoTransmision}>✅</Text>
          <Text style={styles.textoTransmision}>¡SALA CREADA!</Text>
          <Text style={styles.subtextoTransmision}>Dile al invitado que introduzca este PIN. La partida empezará automáticamente.</Text>
          
          <View style={styles.cajaPin}>
            <Text style={styles.pinGigante}>{codigoSala}</Text>
          </View>
          <ActivityIndicator size="large" color="#3498db" />

          <TouchableOpacity style={styles.botonCancelarTransmision} onPress={cancelarHost}>
            <Text style={styles.textoBotonCancelarTransmision}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {pantallaActiva === 'juego' && caso && (
        <>
          <PantallaTablero 
            key={`tablero-${gameKey}`}
            caso={caso} 
            modo={modoJuego}
            codigoSala={codigoSala}
            tiempoInicio={tiempoInicio}
            onMenu={solicitarAbandonar}
            onReroll={handleReroll}
            onAbrirNotas={() => setModalNotasVisible(true)}
            onAbrirSolucion={() => setModalSolucionVisible(true)}
          />
          
          <PapiroNotas 
            visible={modalNotasVisible} 
            onClose={() => setModalNotasVisible(false)} 
            caso={caso} 
            notasGuardadas={notasJugador}
            onActualizarNotas={setNotasJugador}
          />
          
          <ModalSolucion 
            visible={modalSolucionVisible} 
            onClose={() => setModalSolucionVisible(false)} 
            caso={caso} 
            modo={modoJuego} 
            tiempoInicio={tiempoInicio}
            onMenu={confirmarAbandonar} 
            onReroll={handleReroll} 
          />
        </>
      )}

      {modalAbandonarVisible && (
        <View style={[StyleSheet.absoluteFill, styles.fondoModal, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalAbandonarVisible(false)} />
          <TouchableOpacity activeOpacity={1} style={styles.cajaAlerta}>
            <Text style={styles.tituloAlerta}>ABANDONAR CASO</Text>
            <Text style={styles.textoAlerta}>¿Estás seguro de que quieres salir? Perderás todo el progreso y tus notas.</Text>
            <View style={styles.filaBotonesAlerta}>
              <TouchableOpacity style={styles.botonCancelarAlerta} onPress={() => setModalAbandonarVisible(false)}><Text style={styles.textoBotonAlerta}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.botonPeligroAlerta} onPress={confirmarAbandonar}><Text style={styles.textoBotonAlerta}>Abandonar</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {modalErrorVisible && (
        <View style={[StyleSheet.absoluteFill, styles.fondoModal, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalErrorVisible(false)} />
          <TouchableOpacity activeOpacity={1} style={styles.cajaAlertaError}>
            <Text style={styles.tituloAlertaError}>AVISO</Text>
            <Text style={styles.textoAlerta}>{mensajeError}</Text>
            <TouchableOpacity style={styles.botonCancelarAlerta} onPress={() => setModalErrorVisible(false)}><Text style={styles.textoBotonAlerta}>Entendido</Text></TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e272e' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e272e', padding: 20 },
  textoCargando: { color: '#f1c40f', marginTop: 25, fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  iconoTransmision: { fontSize: 70, marginBottom: 10 },
  textoTransmision: { color: '#2ecc71', fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  subtextoTransmision: { color: '#bdc3c7', fontSize: 16, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
  cajaPin: { backgroundColor: '#101418', paddingHorizontal: 40, paddingVertical: 20, borderRadius: 15, borderWidth: 3, borderColor: '#f1c40f', marginVertical: 30, elevation: 10 },
  pinGigante: { color: '#f1c40f', fontSize: 60, fontWeight: 'bold', letterSpacing: 15, textAlign: 'center' },
  fondoModal: { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cajaAlerta: { backgroundColor: '#101418', width: '100%', maxWidth: 340, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#d4af37', alignItems: 'center' },
  cajaAlertaError: { backgroundColor: '#101418', width: '100%', maxWidth: 340, borderRadius: 15, padding: 25, borderWidth: 2, borderColor: '#e74c3c', alignItems: 'center' },
  tituloAlerta: { fontSize: 22, fontWeight: 'bold', color: '#f1c40f', marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  tituloAlertaError: { fontSize: 22, fontWeight: 'bold', color: '#e74c3c', marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  textoAlerta: { color: '#ecf0f1', fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 24 },
  filaBotonesAlerta: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 12 },
  botonCancelarAlerta: { flex: 1, backgroundColor: '#34495e', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7f8c8d' },
  botonPeligroAlerta: { flex: 1, backgroundColor: '#c0392b', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e74c3c' },
  textoBotonAlerta: { color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 14 },
  botonCancelarTransmision: { marginTop: 30, padding: 15 },
  textoBotonCancelarTransmision: { color: '#95a5a6', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});