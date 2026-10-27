import React from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import {useNav} from '../../../app/nav';
import {sessions} from '../../../net/registry';
import {useStore} from '../../../state/store';
import {Button} from '../../../ui/Button';
import {SwitchRow} from '../../../ui/Controls';
import {Sheet} from '../../../ui/Sheet';
import {rerollSolo} from '../../runtime';

export function OptionsSheet() {
  const nav = useNav();
  const settings = useStore(s => s.settings);
  const set = useStore(s => s.setSettings);
  const mode = useStore(s => s.game?.mode);

  const leave = () => {
    sessions.closeAll();
    useStore.getState().endGame();
    nav.reset({index: 0, routes: [{name: 'Home'}]});
  };
  return (
    <Sheet title="Opciones">
      <View style={styles.gap}>
        <SwitchRow
          icon="eye"
          label="Modo asistido"
          hint="Marca los testimonios cuya lectura altera un testigo en mesa. No revela la solución."
          value={settings.assisted}
          onChange={v => set({assisted: v})}
        />
        <SwitchRow
          icon="sound"
          label="Efectos de sonido"
          value={settings.sound}
          onChange={v => set({sound: v})}
        />
        <SwitchRow
          icon="vibrate"
          label="Vibración"
          value={settings.haptics}
          onChange={v => set({haptics: v})}
        />
        {mode === 'solo' ? (
          <Button
            icon="dice"
            label="Nuevo caso (misma configuración)"
            onPress={() => {
              if (rerollSolo()) {
                nav.goBack();
              }
            }}
          />
        ) : null}
        <Button
          icon="exit"
          variant="danger"
          label="Abandonar partida"
          onPress={() =>
            Alert.alert('Abandonar el caso', 'Perderás tu progreso y tus notas.', [
              {text: 'Cancelar', style: 'cancel'},
              {text: 'Abandonar', style: 'destructive', onPress: leave},
            ])
          }
        />
      </View>
    </Sheet>
  );
}
const styles = StyleSheet.create({gap: {gap: 10, paddingBottom: 8}});
