import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

interface PantallaInicioProps {
  onGenerarCaso: (config: any) => void;
  onVolver: () => void;
  modo?: 'individual' | 'cooperativo' | 'versus';
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

const TODOS_PERSONAJES = ["Tavio", "Pili", "Pork", "Charlot", "Lolo", "Luisa", "Charls", "Reisy"];
const TODOS_TESTIGOS = ["Thomas", "Mr. Red", "La Vicente", "Croqueta Batista"];

export const PantallaInicio = ({ onGenerarCaso, onVolver, modo = 'individual' }: PantallaInicioProps) => {
  const [sospechososTotales, setSospechososTotales] = useState(6);
  const [asesinos, setAsesinos] = useState(2);
  const [mentirosos, setMentirosos] = useState(2);
  const [testigosActivos, setTestigosActivos] = useState(1);
  const [modoSeleccion, setModoSeleccion] = useState<'aleatorio' | 'manual'>('aleatorio');
  
  const [modalManualVisible, setModalManualVisible] = useState(false);
  const [personajesSeleccionados, setPersonajesSeleccionados] = useState<string[]>([]);
  const [testigosSeleccionados, setTestigosSeleccionados] = useState<string[]>([]);

  const maxAsesinos = Math.ceil(sospechososTotales / 2);
  const maxMentirosos = Math.ceil(sospechososTotales / 2);
  const maxTestigos = sospechososTotales <= 5 ? 1 : 2;

  const ajustarSospechosos = (delta: number) => {
    const nuevoTotal = Math.max(3, Math.min(8, sospechososTotales + delta));
    setSospechososTotales(nuevoTotal);
    
    const nuevoMaxAsesinos = Math.ceil(nuevoTotal / 2);
    const nuevoMaxMentirosos = Math.ceil(nuevoTotal / 2);
    const nuevoMaxTestigos = nuevoTotal <= 5 ? 1 : 2;

    if (asesinos > nuevoMaxAsesinos) setAsesinos(nuevoMaxAsesinos);
    if (mentirosos > nuevoMaxMentirosos) setMentirosos(nuevoMaxMentirosos);
    if (testigosActivos > nuevoMaxTestigos) setTestigosActivos(nuevoMaxTestigos);

    if (personajesSeleccionados.length > nuevoTotal) {
      setPersonajesSeleccionados(prev => prev.slice(0, nuevoTotal));
    }
    if (testigosSeleccionados.length > nuevoMaxTestigos) {
      setTestigosSeleccionados(prev => prev.slice(0, nuevoMaxTestigos));
    }
  };

  const ajustarAsesinos = (delta: number) => {
    setAsesinos(Math.max(1, Math.min(maxAsesinos, asesinos + delta)));
  };

  const ajustarMentirosos = (delta: number) => {
    setMentirosos(Math.max(1, Math.min(maxMentirosos, mentirosos + delta)));
  };

  const ajustarTestigos = (delta: number) => {
    setTestigosActivos(Math.max(0, Math.min(maxTestigos, testigosActivos + delta)));
    const nuevoValor = Math.max(0, Math.min(maxTestigos, testigosActivos + delta));
    if (testigosSeleccionados.length > nuevoValor) {
      setTestigosSeleccionados(prev => prev.slice(0, nuevoValor));
    }
  };

  const alternarPersonaje = (nombre: string) => {
    setPersonajesSeleccionados(prev => {
      if (prev.includes(nombre)) return prev.filter(n => n !== nombre);
      if (prev.length < sospechososTotales) return [...prev, nombre];
      return prev;
    });
  };

  const alternarTestigo = (nombre: string) => {
    setTestigosSeleccionados(prev => {
      if (prev.includes(nombre)) return prev.filter(n => n !== nombre);
      if (prev.length < testigosActivos) return [...prev, nombre];
      return prev;
    });
  };

  const iniciarJuego = () => {
    const config = {
      sospechososTotales,
      asesinos,
      mentirosos,
      testigosActivos,
      modoSeleccion,
      personajesManuales: modoSeleccion === 'manual' ? personajesSeleccionados : [],
      testigosManuales: modoSeleccion === 'manual' ? testigosSeleccionados : []
    };
    onGenerarCaso(config);
  };

  const renderSelector = (etiqueta: string, valor: number, min: number, max: number, onAjustar: (d: number) => void) => (
    <View style={styles.filaSelector}>
      <Text style={styles.etiquetaSelector}>{etiqueta}</Text>
      <View style={styles.controlesNumericos}>
        <TouchableOpacity style={[styles.botonAjuste, valor <= min && styles.botonAjusteDesactivado]} onPress={() => onAjustar(-1)} disabled={valor <= min}>
          <Text style={styles.textoBotonAjuste}>-</Text>
        </TouchableOpacity>
        <Text style={styles.valorNumerico}>{valor}</Text>
        <TouchableOpacity style={[styles.botonAjuste, valor >= max && styles.botonAjusteDesactivado]} onPress={() => onAjustar(1)} disabled={valor >= max}>
          <Text style={styles.textoBotonAjuste}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const seleccionValida = personajesSeleccionados.length === sospechososTotales && testigosSeleccionados.length === testigosActivos;

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabeceraPrincipal}>
        <Text style={styles.tituloApp}>¿QUIÉN MATÓ A LA GALLINA?</Text>
        <Text style={styles.subtituloApp}>Motor de Misterios</Text>
      </View>

      <View style={styles.tarjetaConfiguracion}>
        <Text style={styles.tituloTarjeta}>Configurar Partida</Text>

        {renderSelector("Sospechosos totales", sospechososTotales, 3, 8, ajustarSospechosos)}
        {renderSelector("¿Cuántos son Asesinos?", asesinos, 1, maxAsesinos, ajustarAsesinos)}
        {renderSelector("¿Cuántos Mienten?", mentirosos, 1, maxMentirosos, ajustarMentirosos)}
        {renderSelector("Testigos activos", testigosActivos, 0, maxTestigos, ajustarTestigos)}

        <View style={styles.filaSelector}>
          <Text style={styles.etiquetaSelector}>Modo de Selección</Text>
          <View style={styles.selectorModo}>
            <TouchableOpacity style={[styles.mitadModo, modoSeleccion === 'aleatorio' && styles.modoActivo]} onPress={() => setModoSeleccion('aleatorio')}>
              <Text style={[styles.textoModo, modoSeleccion === 'aleatorio' && styles.textoModoActivo]}>Aleatorio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mitadModo, modoSeleccion === 'manual' && styles.modoActivo]} onPress={() => setModoSeleccion('manual')}>
              <Text style={[styles.textoModo, modoSeleccion === 'manual' && styles.textoModoActivo]}>Manual</Text>
            </TouchableOpacity>
          </View>
        </View>

        {modoSeleccion === 'manual' && (
          <TouchableOpacity style={[styles.botonSeleccionManual, seleccionValida && styles.botonSeleccionManualValido]} onPress={() => setModalManualVisible(true)}>
            <Text style={styles.textoBotonSeleccionManual}>
              {seleccionValida ? '✅ Cartas Elegidas' : '⚙️ Elegir Cartas Manualmente'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.botonGenerar, (modoSeleccion === 'manual' && !seleccionValida) && styles.botonDesactivado]} disabled={modoSeleccion === 'manual' && !seleccionValida} onPress={iniciarJuego}>
          <Text style={styles.textoBotonGenerar}>
            {modo === 'individual' ? 'GENERAR CASO' : 'GENERAR Y TRANSMITIR'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.botonVolver} onPress={onVolver}>
        <Text style={styles.textoBotonVolver}>
          {modo === 'individual' ? 'VOLVER AL MENÚ' : 'CANCELAR'}
        </Text>
      </TouchableOpacity>

      {modalManualVisible && (
        <View style={[StyleSheet.absoluteFill, styles.fondoModal, { zIndex: 1000, elevation: 1000 }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalManualVisible(false)} />
          <TouchableOpacity activeOpacity={1} style={styles.contenedorRejilla}>
            <Text style={styles.tituloModal}>Selección Manual</Text>
            <ScrollView>
              <View style={styles.seccionRejilla}>
                <Text style={styles.etiquetaSeccionRejilla}>Personajes ({personajesSeleccionados.length}/{sospechososTotales})</Text>
                <View style={styles.cuadriculaCartas}>
                  {TODOS_PERSONAJES.map(nombre => {
                    const seleccionado = personajesSeleccionados.includes(nombre);
                    return (
                      <TouchableOpacity key={nombre} style={styles.cartaRejilla} onPress={() => alternarPersonaje(nombre)} activeOpacity={0.7}>
                        <Image source={IMAGENES[nombre]} style={[styles.imagenRejilla, seleccionado && styles.imagenSeleccionada]} resizeMode="cover" />
                        {seleccionado && <View style={styles.capaSeleccion}><Text style={styles.checkSeleccion}>✓</Text></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.seccionRejilla}>
                <Text style={styles.etiquetaSeccionRejilla}>Testigos ({testigosSeleccionados.length}/{testigosActivos})</Text>
                <View style={styles.cuadriculaCartas}>
                  {TODOS_TESTIGOS.map(nombre => {
                    const seleccionado = testigosSeleccionados.includes(nombre);
                    return (
                      <TouchableOpacity key={nombre} style={styles.cartaRejilla} onPress={() => alternarTestigo(nombre)} activeOpacity={0.7}>
                        <Image source={IMAGENES[nombre]} style={[styles.imagenRejilla, seleccionado && styles.imagenSeleccionada]} resizeMode="cover" />
                        {seleccionado && <View style={styles.capaSeleccion}><Text style={styles.checkSeleccion}>✓</Text></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.filaBotonesManual}>
              <TouchableOpacity style={styles.botonVolverManual} onPress={() => setModalManualVisible(false)}>
                <Text style={styles.textoBoton}>VOLVER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botonConfirmarRejilla, !seleccionValida && styles.botonDesactivado]} disabled={!seleccionValida} onPress={() => setModalManualVisible(false)}>
                <Text style={styles.textoBoton}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#1e272e', alignItems: 'center', justifyContent: 'center', padding: 20 },
  cabeceraPrincipal: { alignItems: 'center', marginBottom: 30 },
  tituloApp: { fontSize: 24, fontWeight: 'bold', color: '#f1c40f', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 3, letterSpacing: 2, textAlign: 'center' },
  subtituloApp: { fontSize: 16, color: '#ecf0f1', textTransform: 'uppercase', letterSpacing: 4, marginTop: 5 },
  tarjetaConfiguracion: { backgroundColor: '#101418', width: '100%', padding: 25, borderRadius: 15, borderWidth: 2, borderColor: '#d4af37', elevation: 10 },
  tituloTarjeta: { fontSize: 24, fontWeight: 'bold', color: '#f1c40f', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  cajaHost: { backgroundColor: 'rgba(41, 128, 185, 0.15)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#3498db', marginBottom: 20 },
  textoHost: { color: '#3498db', fontWeight: 'bold', textAlign: 'center', fontSize: 13, lineHeight: 18, textTransform: 'uppercase' },
  filaSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.2)' },
  etiquetaSelector: { color: '#ecf0f1', fontSize: 16, fontWeight: 'bold', flex: 1 },
  controlesNumericos: { flexDirection: 'row', alignItems: 'center' },
  botonAjuste: { backgroundColor: '#2980b9', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3498db', elevation: 3 },
  botonAjusteDesactivado: { backgroundColor: '#34495e', borderColor: '#2c3e50', elevation: 0, opacity: 0.6 },
  textoBotonAjuste: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
  valorNumerico: { color: '#f1c40f', fontSize: 20, fontWeight: 'bold', width: 40, textAlign: 'center' },
  selectorModo: { flexDirection: 'row', backgroundColor: '#1e272e', borderRadius: 8, borderWidth: 1, borderColor: '#d4af37', overflow: 'hidden' },
  mitadModo: { paddingHorizontal: 15, paddingVertical: 8 },
  modoActivo: { backgroundColor: '#d4af37' },
  textoModo: { color: '#ecf0f1', fontWeight: 'bold' },
  textoModoActivo: { color: '#101418' },
  botonSeleccionManual: { backgroundColor: '#34495e', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#f1c40f' },
  botonSeleccionManualValido: { backgroundColor: '#27ae60', borderColor: '#2ecc71' },
  textoBotonSeleccionManual: { color: '#fff', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase' },
  botonGenerar: { backgroundColor: '#c0392b', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10, borderWidth: 2, borderColor: '#e74c3c', elevation: 5 },
  textoBotonGenerar: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  botonDesactivado: { opacity: 0.4 },
  botonVolver: { marginTop: 25, padding: 15 },
  textoBotonVolver: { color: '#95a5a6', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' },
  fondoModal: { backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  contenedorRejilla: { backgroundColor: '#101418', width: '95%', height: '85%', borderRadius: 15, borderWidth: 3, borderColor: '#d4af37', padding: 20 },
  tituloModal: { fontSize: 22, fontWeight: 'bold', color: '#f1c40f', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase' },
  seccionRejilla: { marginBottom: 20 },
  etiquetaSeccionRejilla: { color: '#ecf0f1', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#d4af37', paddingBottom: 5 },
  cuadriculaCartas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  cartaRejilla: { width: '22%', aspectRatio: 0.7, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#1e272e' },
  imagenRejilla: { width: '100%', height: '100%' },
  imagenSeleccionada: { opacity: 0.6 },
  capaSeleccion: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(212, 175, 55, 0.4)', justifyContent: 'center', alignItems: 'center' },
  checkSeleccion: { color: '#fff', fontSize: 35, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  
  filaBotonesManual: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 },
  botonVolverManual: { flex: 1, backgroundColor: '#7f8c8d', padding: 15, borderRadius: 10, alignItems: 'center' },
  botonConfirmarRejilla: { flex: 2, backgroundColor: '#27ae60', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: '#2ecc71' },
  textoBoton: { color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});