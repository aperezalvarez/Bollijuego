import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {Alert, ScrollView, StyleSheet, Text} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Field, Header, Plate, SwitchRow} from '../../ui/Controls';
import {Screen} from '../../ui/WoodBackground';
import {color, type as T} from '../../ui/theme';

export function Settings({navigation}: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const s = useStore(st => st.settings);
  const set = useStore(st => st.setSettings);
  return (
    <Screen>
      <Header title="Ajustes" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Plate title="Jugador">
          <Field
            label="Nombre en las salas"
            value={s.name}
            onChangeText={t => set({name: t.slice(0, 24)})}
            placeholder="Jugador"
            maxLength={24}
          />
        </Plate>
        <Plate title="Experiencia">
          <SwitchRow icon="sound" label="Efectos de sonido" value={s.sound} onChange={v => set({sound: v})} />
          <SwitchRow icon="vibrate" label="Vibración" value={s.haptics} onChange={v => set({haptics: v})} />
          <SwitchRow
            icon="eye"
            label="Modo asistido"
            hint="Resalta con una pista sutil los testimonios que un testigo en mesa altera. No da la solución."
            value={s.assisted}
            onChange={v => set({assisted: v})}
          />
        </Plate>
        <Plate title="Datos">
          <Button
            variant="danger"
            icon="trash"
            label="Borrar estadísticas"
            onPress={() =>
              Alert.alert('Borrar estadísticas', 'Esta acción no se puede deshacer.', [
                {text: 'Cancelar', style: 'cancel'},
                {text: 'Borrar', style: 'destructive', onPress: () => useStore.getState().resetStats()},
              ])
            }
          />
        </Plate>
        <Text style={styles.foot}>¿Quién mató a la gallina? · versión 2.0</Text>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14, paddingBottom: 40},
  foot: {...T.small, color: color.textMuted, textAlign: 'center'},
});
