import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text} from 'react-native';
import type {RootStackParamList} from '../../app/types';
import type {NetMode} from '../../net/protocol';
import {useStore} from '../../state/store';
import {Button} from '../../ui/Button';
import {Chips, Field, Header, Plate} from '../../ui/Controls';
import {Screen} from '../../ui/WoodBackground';
import {color, type as T} from '../../ui/theme';

const DESC: Record<NetMode, string> = {
  cooperativo:
    'De 2 a 4 jugadores resuelven el MISMO caso a la vez, cada uno con su cuaderno, y razonan juntos. Cada jugador tiene su propia entrega.',
  versus:
    'De 2 a 4 jugadores, el mismo caso, salida simultánea con cuenta atrás. Gana quien ACIERTE en menos tiempo. El anfitrión custodia la solución.',
};

export function Multi({navigation}: NativeStackScreenProps<RootStackParamList, 'Multi'>) {
  const [mode, setMode] = useState<NetMode>('cooperativo');
  const name = useStore(s => s.settings.name);
  const setSettings = useStore(s => s.setSettings);
  return (
    <Screen>
      <Header title="Multijugador local" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Plate title="Modo">
          <Chips
            options={[
              {id: 'cooperativo', label: 'Cooperativo'},
              {id: 'versus', label: 'Versus'},
            ]}
            value={mode}
            onChange={setMode}
          />
          <Text style={styles.desc}>{DESC[mode]}</Text>
        </Plate>
        <Plate title="Tu nombre">
          <Field
            label="Nombre visible para los demás"
            value={name}
            onChangeText={t => setSettings({name: t.slice(0, 24)})}
            placeholder="Jugador"
            maxLength={24}
          />
        </Plate>
        <Button
          variant="primary"
          icon="wifi"
          label="Crear sala"
          hint="Tú eres el anfitrión"
          onPress={() => navigation.navigate('Setup', {mode})}
        />
        <Button
          icon="users"
          label="Unirme a una sala"
          hint="Introduce el código del anfitrión"
          onPress={() => navigation.navigate('LobbyJoin', {mode})}
        />
        <Text style={styles.note}>
          Todos los dispositivos deben estar en la misma red Wi-Fi (o conectados al punto de acceso del móvil
          del anfitrión). No hace falta Internet.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 14},
  desc: {...T.body, color: color.textOnDark},
  note: {...T.small, color: color.textMuted, textAlign: 'center'},
});
