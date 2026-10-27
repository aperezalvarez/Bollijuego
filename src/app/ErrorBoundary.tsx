import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useStore} from '../state/store';
import {Button} from '../ui/Button';
import {color, type as T} from '../ui/theme';

interface S {
  error: Error | null;
}

/** Cinturón de seguridad: un fallo de render nunca cierra la app; ofrece volver al menú. */
export class ErrorBoundary extends React.Component<{children: React.ReactNode}, S> {
  state: S = {error: null};
  static getDerivedStateFromError(error: Error): S {
    return {error};
  }
  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Algo se torció</Text>
        <Text style={styles.body}>Ha ocurrido un error inesperado. Tu progreso guardado sigue a salvo.</Text>
        <Button
          label="Volver al inicio"
          variant="primary"
          onPress={() => {
            useStore.getState().endGame();
            this.setState({error: null});
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: color.wood900, justifyContent: 'center', padding: 24, gap: 16},
  title: {...T.title, color: color.gold, textAlign: 'center'},
  body: {...T.body, color: color.textOnDark, textAlign: 'center'},
});
