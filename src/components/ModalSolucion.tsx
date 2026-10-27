import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CasoGenerado } from '../logic/motorMisterio';

interface ModalSolucionProps {
  visible: boolean;
  onClose: () => void;
  caso: CasoGenerado | null;
  onMenu: () => void;
  onReroll: () => void;
  modo?: 'individual' | 'cooperativo' | 'versus';
  tiempoInicio: number;
}

export const ModalSolucion = ({ visible, onClose, caso, onMenu, onReroll, modo = 'individual', tiempoInicio }: ModalSolucionProps) => {
  const [asesinosMarcados, setAsesinosMarcados] = useState<string[]>([]);
  const [mentirososMarcados, setMentirososMarcados] = useState<string[]>([]);
  const [estadoResultado, setEstadoResultado] = useState<'pendiente' | 'victoria' | 'derrota'>('pendiente');
  const [tiempoFinal, setTiempoFinal] = useState(0);

  useEffect(() => {
    setAsesinosMarcados([]);
    setMentirososMarcados([]);
    setEstadoResultado('pendiente');
    setTiempoFinal(0);
  }, [caso]);

  if (!visible || !caso) return null;

  const formatearTiempo = (totalSegundos: number) => {
    const minutos = Math.floor(totalSegundos / 60);
    const secs = totalSegundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMarcador = (nombre: string, tipo: 'asesino' | 'mentiroso') => {
    if (tipo === 'asesino') {
      setAsesinosMarcados(prev => prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]);
    } else {
      setMentirososMarcados(prev => prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]);
    }
  };

  const manejarEntregar = () => {
    const asAcierto = asesinosMarcados.length === caso.solucion.asesinos.length && asesinosMarcados.every(a => caso.solucion.asesinos.includes(a));
    const meAcierto = mentirososMarcados.length === caso.solucion.mentirosos.length && mentirososMarcados.every(m => caso.solucion.mentirosos.includes(m));
    
    setTiempoFinal(Math.floor((Date.now() - tiempoInicio) / 1000));
    setEstadoResultado(asAcierto && meAcierto ? 'victoria' : 'derrota');
  };

  const cantidadCorrecta =
    asesinosMarcados.length === caso.solucion.asesinos.length &&
    mentirososMarcados.length === caso.solucion.mentirosos.length;

  const renderizarCheckboxes = () => (
    <>
      <Text style={styles.textoObjetivo}>
        OBJETIVO: <Text style={styles.numeroResaltado}>{caso.solucion.asesinos.length}</Text> Asesino(s) y <Text style={styles.numeroResaltado}>{caso.solucion.mentirosos.length}</Text> Mentiroso(s)
      </Text>

      {modo === 'versus' && (
        <View style={styles.cajaAlertaVersus}>
          <Text style={styles.textoVersus}>⏱️ ¡Sé el más rápido en resolverlo!</Text>
        </View>
      )}
      
      <View style={styles.cabeceraTabla}>
        <Text style={[styles.textoCabecera, { flex: 2 }]}></Text>
        <Text style={[styles.textoCabecera, { flex: 1, textAlign: 'center' }]}>Asesino</Text>
        <Text style={[styles.textoCabecera, { flex: 1, textAlign: 'center' }]}>Mentiroso</Text>
      </View>

      <ScrollView style={styles.listaSospechosos}>
        {caso.asignaciones.map((asig) => {
          const esAsesino = asesinosMarcados.includes(asig.personaje.nombre);
          const esMentiroso = mentirososMarcados.includes(asig.personaje.nombre);

          return (
            <View key={asig.personaje.nombre} style={styles.filaTabla}>
              <Text style={styles.nombrePersonaje}>{asig.personaje.nombre}</Text>
              
              <View style={styles.celdaCheckbox}>
                <TouchableOpacity 
                  style={[styles.checkbox, esAsesino && styles.checkboxActivo]} 
                  onPress={() => toggleMarcador(asig.personaje.nombre, 'asesino')}
                >
                  {esAsesino && <Text style={styles.marcaCheck}>X</Text>}
                </TouchableOpacity>
              </View>

              <View style={styles.celdaCheckbox}>
                <TouchableOpacity 
                  style={[styles.checkbox, esMentiroso && styles.checkboxActivo]} 
                  onPress={() => toggleMarcador(asig.personaje.nombre, 'mentiroso')}
                >
                  {esMentiroso && <Text style={styles.marcaCheck}>X</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.contenedorBotones}>
        <TouchableOpacity style={styles.botonCancelar} onPress={onClose}>
          <Text style={styles.textoBotonSecundario}>VOLVER</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.botonEntregar, !cantidadCorrecta && styles.botonDesactivado]} 
          disabled={!cantidadCorrecta}
          onPress={manejarEntregar}
        >
          <Text style={styles.textoBotonPrincipal}>ENTREGAR SOLUCIÓN</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderizarResultado = () => {
    const esVictoria = estadoResultado === 'victoria';
    return (
      <View style={styles.contenedorResultado}>
        <Text style={[styles.tituloResultado, { color: esVictoria ? '#2ecc71' : '#e74c3c' }]}>
          {esVictoria ? '¡CASO RESUELTO!' : '¡HAS FALLADO!'}
        </Text>

        {modo === 'versus' && (
          <View style={styles.cajaTiempoFinal}>
             <Text style={styles.textoTiempoFinalTitulo}>TIEMPO REGISTRADO</Text>
             <Text style={styles.textoTiempoFinal}>{formatearTiempo(tiempoFinal)}</Text>
             <Text style={styles.textoTiempoFinalSub}>¡Compáralo con tu rival!</Text>
          </View>
        )}
        
        <Text style={styles.mensajeResultado}>
          {esVictoria ? '¡Suuuu! Has conseguido atrapar a los sapos traidores' : 'Te babaste'}
        </Text>

        {!esVictoria && (
          <View style={styles.solucionReal}>
            <Text style={styles.tituloSolucionReal}>La verdad era:</Text>
            <Text style={styles.textoSolucionReal}>Asesinos: {caso.solucion.asesinos.join(', ')}</Text>
            <Text style={styles.textoSolucionReal}>Mentirosos: {caso.solucion.mentirosos.join(', ')}</Text>
          </View>
        )}

        <View style={styles.contenedorBotonesFinales}>
          <TouchableOpacity style={styles.botonMenu} onPress={onMenu}>
            <Text style={styles.textoBotonBlanco}>VOLVER AL MENÚ</Text>
          </TouchableOpacity>
          {modo === 'individual' && (
            <TouchableOpacity style={styles.botonReroll} onPress={onReroll}>
              <Text style={styles.textoBotonBlanco}>NUEVO CASO</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.fondoOscuro, { zIndex: 1000, elevation: 1000 }]}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1} 
        onPress={estadoResultado === 'pendiente' ? onClose : undefined} 
      />
      <TouchableOpacity activeOpacity={1} style={styles.tarjetaSolucion}>
        <Text style={styles.tituloModal}>SOLUCIÓN</Text>
        {estadoResultado === 'pendiente' ? renderizarCheckboxes() : renderizarResultado()}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fondoOscuro: { backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  tarjetaSolucion: { backgroundColor: '#1e272e', width: '90%', maxHeight: '85%', borderRadius: 15, padding: 20, borderWidth: 3, borderColor: '#d4af37' },
  tituloModal: { fontSize: 24, fontWeight: 'bold', color: '#f1c40f', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 2 },
  textoObjetivo: { color: '#ecf0f1', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  numeroResaltado: { color: '#f1c40f', fontSize: 20 },
  cajaAlertaVersus: { backgroundColor: 'rgba(231, 76, 60, 0.2)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e74c3c', marginBottom: 15 },
  textoVersus: { color: '#e74c3c', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: 13 },
  cabeceraTabla: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#d4af37', paddingBottom: 10, marginBottom: 10 },
  textoCabecera: { color: '#d4af37', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12 },
  listaSospechosos: { flexGrow: 0 },
  filaTabla: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 175, 55, 0.3)' },
  nombrePersonaje: { flex: 2, color: '#ecf0f1', fontSize: 16, fontWeight: 'bold' },
  celdaCheckbox: { flex: 1, alignItems: 'center' },
  checkbox: { width: 30, height: 30, borderWidth: 2, borderColor: '#d4af37', borderRadius: 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101418' },
  checkboxActivo: { backgroundColor: '#c0392b', borderColor: '#e74c3c' },
  marcaCheck: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  contenedorBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  botonCancelar: { flex: 1, padding: 15, backgroundColor: '#7f8c8d', borderRadius: 8, marginRight: 10, alignItems: 'center' },
  botonEntregar: { flex: 2, padding: 15, backgroundColor: '#27ae60', borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#2ecc71' },
  botonDesactivado: { backgroundColor: '#2c3e50', borderColor: '#34495e', opacity: 0.5 },
  textoBotonSecundario: { color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' },
  textoBotonPrincipal: { color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 16 },
  contenedorResultado: { alignItems: 'center', paddingVertical: 20 },
  tituloResultado: { fontSize: 32, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', textAlign: 'center' },
  cajaTiempoFinal: { backgroundColor: '#101418', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#f1c40f', width: '100%', alignItems: 'center', marginBottom: 20 },
  textoTiempoFinalTitulo: { color: '#bdc3c7', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
  textoTiempoFinal: { color: '#f1c40f', fontSize: 36, fontWeight: 'bold', letterSpacing: 2 },
  textoTiempoFinalSub: { color: '#ecf0f1', fontSize: 14, fontStyle: 'italic', marginTop: 5 },
  mensajeResultado: { color: '#ecf0f1', fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 24 },
  solucionReal: { backgroundColor: 'rgba(231, 76, 60, 0.1)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e74c3c', width: '100%', marginBottom: 25 },
  tituloSolucionReal: { color: '#e74c3c', fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  textoSolucionReal: { color: '#fff', fontSize: 16, marginBottom: 5, textAlign: 'center' },
  contenedorBotonesFinales: { flexDirection: 'row', width: '100%', gap: 15 },
  botonMenu: { flex: 1, backgroundColor: '#34495e', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7f8c8d' },
  botonReroll: { flex: 1, backgroundColor: '#8e44ad', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#9b59b6' },
  textoBotonBlanco: { color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }
});