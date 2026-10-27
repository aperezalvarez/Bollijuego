import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground } from 'react-native';
import { CartaSospechoso } from '../components/CartaSospechoso';
import { CartaTestimonio } from '../components/CartaTestimonio';
import { Personaje, Asignacion } from '../logic/tipos';
import { CasoGenerado } from '../logic/motorMisterio';

interface PantallaTableroProps {
  caso: CasoGenerado;
  onMenu: () => void;
  onReroll: () => void;
  onAbrirNotas: () => void;
  onAbrirSolucion: () => void;
  modo?: 'individual' | 'cooperativo' | 'versus';
  codigoSala?: string | null;
  tiempoInicio: number;
}

const IMAGENES: Record<string, any> = {
  "Tavio": require('../assets/images/Tavio.png'),
  "Pili": require('../assets/images/Pili.png'),
  "Pork": require('../assets/images/Pork.png'),
  "Charlot": require('../assets/images/Charlot.png'),
  "Lolo": require('../assets/images/Lolo.png'),
  "Luisa": require('../assets/images/Luisa.png'),
  "Charls": require('../assets/images/Charls.png'),
  "Reisy": require('../assets/images/Reisy.png'),
  "Thomas": require('../assets/images/Thomas.png'),
  "Mr. Red": require('../assets/images/Mr.-Red.png'),
  "La Vicente": require('../assets/images/La-Vicente.png'),
  "Croqueta Batista": require('../assets/images/Croqueta-Batista.png')
};

const IMAGEN_FONDO_TESTIMONIO = require('../assets/images/Testimonio.png');

export const PantallaTablero = ({ caso, onMenu, onReroll, onAbrirNotas, onAbrirSolucion, modo = 'individual', codigoSala, tiempoInicio }: PantallaTableroProps) => {
  const [segundos, setSegundos] = useState(0);
  const [personajeZoom, setPersonajeZoom] = useState<Personaje | null>(null);
  const [testigoZoom, setTestigoZoom] = useState<string | null>(null);
  const [testimonioZoomTexto, setTestimonioZoomTexto] = useState<string | null>(null);
  const [modalMenuVisible, setModalMenuVisible] = useState(false);

  const testigosMesa = caso.testigos || (caso as any).testigosActivos || [];

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - tiempoInicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [tiempoInicio]);

  const formatearTiempo = (totalSegundos: number) => {
    const minutos = Math.floor(totalSegundos / 60);
    const secs = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const obtenerDescripcionTestigo = (nombre: string) => {
    switch (nombre) {
      case 'Thomas': return 'Invierte los géneros en los testimonios.';
      case 'Mr. Red': return 'Invierte los testimonios que buscan a alguien Arisco.';
      case 'La Vicente': return 'Invierte los testimonios que buscan a alguien Cariñoso.';
      case 'Croqueta Batista': return 'Invierte los testimonios sobre quién miente y quien es culpable.';
      default: return 'Efecto desconocido.';
    }
  };

  const getDistribucion = (total: number) => {
    switch(total) {
      case 3: return [2, 1];
      case 4: return [2, 2];
      case 5: return [2, 2, 1];
      case 6: return [2, 2, 2];
      case 7: return [2, 2, 2, 1];
      case 8: return [2, 2, 2, 2];
      default: return [2, 1];
    }
  };

  const procesarFilasCuadricula = () => {
    if (!caso.asignaciones) return [];
    let asignacionesRestantes = [...caso.asignaciones];
    const distribucion = getDistribucion(caso.asignaciones.length);
    
    return distribucion.map(cantidad => {
      const fila = asignacionesRestantes.slice(0, cantidad);
      asignacionesRestantes = asignacionesRestantes.slice(cantidad);
      return fila;
    });
  };

  const filasAsignaciones = procesarFilasCuadricula();

  const cerrarZoom = () => {
    setPersonajeZoom(null);
    setTestigoZoom(null);
    setTestimonioZoomTexto(null);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <TouchableOpacity style={styles.botonHamburguesa} onPress={() => setModalMenuVisible(true)}>
          <View style={styles.lineaHamburguesa} />
          <View style={styles.lineaHamburguesa} />
          <View style={styles.lineaHamburguesa} />
        </TouchableOpacity>
        
        <View style={styles.cajaHudRediseñada}>
          <View style={styles.filaRolesHud}>
            <Text style={styles.textoRolHud}>ASESINOS: <Text style={styles.datoRolHud}>{caso.solucion.asesinos.length}</Text></Text>
            <Text style={styles.separadorRolesHud}>|</Text>
            <Text style={styles.textoRolHud}>MENTIROSOS: <Text style={styles.datoRolHud}>{caso.solucion.mentirosos.length}</Text></Text>
          </View>
          <View style={[styles.cajaTiempoHud, modo === 'versus' && styles.cajaTiempoVersus]}>
            <Text style={[styles.textoTiempoHud, modo === 'versus' && styles.textoTiempoVersus]}>
              {modo === 'versus' ? '⏱️ ' : '⏳ '}{formatearTiempo(segundos)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.tablero} contentContainerStyle={styles.tableroContenido} showsVerticalScrollIndicator={false}>
        <View style={styles.zonaTestigos}>
          <Text style={styles.tituloZona}>TESTIGOS</Text>
          {testigosMesa.length > 0 ? (
            <View style={styles.filaTestigos}>
              {testigosMesa.map((testigo: string, index: number) => (
                <TouchableOpacity key={index} style={styles.cartaTestigo} onPress={() => setTestigoZoom(testigo)}>
                  <Image source={IMAGENES[testigo]} style={styles.imagenTestigo} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.textoSinTestigos}>Ninguno</Text>
          )}
        </View>

        <View style={styles.cabeceraSeccion}>
          <Text style={styles.tituloSeccion}>SOSPECHOSOS</Text>
        </View>

        {filasAsignaciones.map((fila, indexFila) => (
          <View key={`fila-${indexFila}`} style={styles.filaGrid}>
            {fila.map((asig: Asignacion) => (
              <View key={asig.personaje.nombre} style={styles.bloquePareja}>
                <View style={styles.mitadCarta}>
                  <CartaSospechoso 
                    personaje={asig.personaje} 
                    onPressZoom={() => setPersonajeZoom(asig.personaje)} 
                  />
                </View>
                <View style={styles.separadorHorizontal} />
                <View style={styles.mitadCarta}>
                  <CartaTestimonio 
                    texto={asig.testimonio.texto} 
                    onPressZoom={() => setTestimonioZoomTexto(asig.testimonio.texto)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.barraAcciones}>
        <TouchableOpacity style={styles.botonNotas} onPress={onAbrirNotas}>
          <Text style={styles.textoBotonAccion}>📝 Notas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.botonResolver} onPress={onAbrirSolucion}>
          <Text style={styles.textoBotonAccion}>⚖️ Resolver</Text>
        </TouchableOpacity>
      </View>

      {modalMenuVisible && (
        <View style={[StyleSheet.absoluteFill, styles.fondoModal, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalMenuVisible(false)} />
          <TouchableOpacity activeOpacity={1} style={styles.menuOpciones}>
            <Text style={styles.tituloMenu}>Opciones</Text>
            {modo === 'individual' && (
              <TouchableOpacity style={styles.botonReroll} onPress={() => { setModalMenuVisible(false); onReroll(); }}>
                <Text style={styles.textoBotonBlanco}>🎲 Reroll</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.botonSalir} onPress={() => { setModalMenuVisible(false); onMenu(); }}>
              <Text style={styles.textoBotonBlanco}>🚪 Salir</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {(!!personajeZoom || !!testigoZoom || !!testimonioZoomTexto) && (
        <View style={[StyleSheet.absoluteFill, styles.fondoModal, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={cerrarZoom} />
          <TouchableOpacity activeOpacity={1} style={styles.contenidoModal}>
            
            {personajeZoom && (
              <>
                <View style={styles.marcoZoom}>
                  <Image source={IMAGENES[personajeZoom.nombre]} style={styles.imagenZoom} resizeMode="cover" />
                </View>
                <Text style={styles.tituloZoom}>{personajeZoom.nombre}</Text>
                <View style={styles.panelDetalles}>
                    <Text style={styles.detalleZoom}>Género: <Text style={styles.valorDetalle}>{personajeZoom.gen}</Text></Text>
                    <Text style={styles.detalleZoom}>Rasgo: <Text style={styles.valorDetalle}>{personajeZoom.rasgo}</Text></Text>
                </View>
              </>
            )}
            
            {testigoZoom && (
              <>
                <View style={styles.marcoZoom}>
                  <Image source={IMAGENES[testigoZoom]} style={styles.imagenZoom} resizeMode="cover" />
                </View>
                <Text style={styles.tituloTestigoZoom}>{testigoZoom}</Text>
                <View style={styles.panelDetalles}>
                    <Text style={styles.detalleTestigo}>{obtenerDescripcionTestigo(testigoZoom)}</Text>
                </View>
              </>
            )}

            {testimonioZoomTexto && (
              <View style={styles.marcoZoom}>
                <ImageBackground source={IMAGEN_FONDO_TESTIMONIO} style={styles.imagenZoom} resizeMode="cover">
                  <View style={styles.contenedorTextoZoom}>
                    <Text style={styles.textoZoom} adjustsFontSizeToFit={true} minimumFontScale={0.7} numberOfLines={6}>
                        {testimonioZoomTexto}
                    </Text>
                  </View>
                </ImageBackground>
              </View>
            )}

            <TouchableOpacity style={styles.botonCerrarZoom} onPress={cerrarZoom}>
              <Text style={styles.textoBotonBlanco}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e272e' },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#101418', borderBottomWidth: 3, borderBottomColor: '#d4af37', elevation: 5 },
  botonHamburguesa: { padding: 10, backgroundColor: '#1e272e', borderRadius: 8, justifyContent: 'space-around', height: 42, width: 45, borderWidth: 1, borderColor: '#d4af37' },
  lineaHamburguesa: { height: 3, backgroundColor: '#d4af37', width: '100%', borderRadius: 2 },
  cajaHudRediseñada: { backgroundColor: '#101418', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#d4af37', alignItems: 'center', justifyContent: 'center' },
  filaRolesHud: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  textoRolHud: { color: '#bdc3c7', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  datoRolHud: { color: '#f1c40f', fontSize: 14 },
  separadorRolesHud: { color: '#7f8c8d', marginHorizontal: 12, opacity: 0.5 },
  cajaTiempoHud: { backgroundColor: '#1e272e', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#34495e' },
  cajaTiempoVersus: { borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  textoTiempoHud: { color: '#ecf0f1', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  textoTiempoVersus: { color: '#e74c3c' },
  tablero: { flex: 1, padding: 10 },
  tableroContenido: { paddingBottom: 100 },
  zonaTestigos: { paddingHorizontal: 15, paddingVertical: 5, marginBottom: 5, alignItems: 'center' },
  tituloZona: { color: '#d4af37', fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontSize: 18, textTransform: 'uppercase', letterSpacing: 1.5 },
  textoSinTestigos: { color: '#95a5a6', fontStyle: 'italic', textAlign: 'center' },
  filaTestigos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  cartaTestigo: { width: 62, height: 87, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#d4af37' },
  imagenTestigo: { width: '100%', height: '100%' },
  cabeceraSeccion: { alignItems: 'center', marginBottom: 12, marginTop: 5 },
  tituloSeccion: { color: '#d4af37', fontWeight: 'bold', fontSize: 20, textTransform: 'uppercase', letterSpacing: 1.5 },
  filaGrid: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 },
  bloquePareja: { flexDirection: 'row', alignItems: 'center', width: '47%' },
  mitadCarta: { flex: 1 },
  separadorHorizontal: { width: 6 },
  barraAcciones: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#101418', borderTopWidth: 3, borderTopColor: '#d4af37', elevation: 10 },
  botonNotas: { flex: 1, backgroundColor: '#2980b9', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#d4af37' },
  botonResolver: { flex: 1, backgroundColor: '#c0392b', padding: 15, borderRadius: 10, marginLeft: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#d4af37' },
  textoBotonAccion: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  fondoModal: { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  contenidoModal: { backgroundColor: '#1e272e', padding: 25, borderRadius: 18, width: '95%', alignItems: 'center', borderWidth: 3, borderColor: '#d4af37' },
  menuOpciones: { backgroundColor: '#1e272e', padding: 25, borderRadius: 18, width: '85%', alignItems: 'center', borderWidth: 3, borderColor: '#d4af37' },
  tituloMenu: { fontSize: 26, fontWeight: 'bold', color: '#f1c40f', marginBottom: 25, textTransform: 'uppercase', letterSpacing: 1.5 },
  botonReroll: { backgroundColor: '#8e44ad', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15, borderWidth: 1.5, borderColor: '#d4af37' },
  botonSalir: { backgroundColor: '#c0392b', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 15, borderWidth: 1.5, borderColor: '#d4af37' },
  textoBotonBlanco: { color: '#fff', fontSize: 17, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  marcoZoom: { width: 280, aspectRatio: 0.7, borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 3, borderColor: '#d4af37' },
  imagenZoom: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  contenedorTextoZoom: { flex: 1, width: '100%', paddingLeft: '24%', paddingRight: '16%', paddingTop: '16%', paddingBottom: '26%', alignItems: 'center', justifyContent: 'center' },
  textoZoom: { fontSize: 28, color: '#3e2723', textAlign: 'center', fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic' },
  tituloZoom: { fontSize: 32, fontWeight: 'bold', color: '#f1c40f', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  tituloTestigoZoom: { fontSize: 28, fontWeight: 'bold', color: '#f1c40f', marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  panelDetalles: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#d4af37', width: '100%', alignItems: 'center', marginBottom: 20 },
  detalleZoom: { fontSize: 19, color: '#ecf0f1', marginBottom: 8, fontWeight: 'bold' },
  valorDetalle: { color: '#f1c40f', fontWeight: 'normal' },
  detalleTestigo: { fontSize: 18, color: '#ecf0f1', textAlign: 'center', fontStyle: 'italic', lineHeight: 24 },
  botonCerrarZoom: { backgroundColor: '#c0392b', paddingVertical: 14, paddingHorizontal: 50, borderRadius: 30, marginTop: 10, borderWidth: 2, borderColor: '#d4af37' }
});