import {DarkTheme, NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import {Board} from '../features/game/Board';
import {Result} from '../features/game/Result';
import {DetailSheet} from '../features/game/sheets/Detail';
import {NotesSheet} from '../features/game/sheets/Notes';
import {OptionsSheet} from '../features/game/sheets/Options';
import {ReferenceSheet} from '../features/game/sheets/Reference';
import {SolveSheet} from '../features/game/sheets/Solve';
import {Home} from '../features/home/Home';
import {LobbyHost} from '../features/lobby/LobbyHost';
import {LobbyJoin} from '../features/lobby/LobbyJoin';
import {Multi} from '../features/lobby/Multi';
import {Rules} from '../features/meta/Rules';
import {Settings} from '../features/meta/Settings';
import {Stats} from '../features/meta/Stats';
import {Setup} from '../features/setup/Setup';
import {useAppLifecycle} from '../platform/lifecycle';
import {useStore} from '../state/store';
import {setHapticsEnabled} from '../ui/haptics';
import {preloadSfx, setSoundEnabled} from '../ui/sound';
import {color} from '../ui/theme';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navRef = createNavigationContainerRef<RootStackParamList>();
const IN_GAME = new Set(['Board', 'Notes', 'Reference', 'Solve', 'Options', 'Detail']);

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: color.wood900,
    card: color.wood800,
    text: color.textOnDark,
    border: color.brass,
    primary: color.gold,
  },
};

function useHydrated() {
  const [ok, setOk] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const off = useStore.persist.onFinishHydration(() => setOk(true));
    if (useStore.persist.hasHydrated()) {
      setOk(true);
    }
    return off;
  }, []);
  return ok;
}

export function RootNavigator() {
  const hydrated = useHydrated();
  const haptics = useStore(s => s.settings.haptics);
  const sound = useStore(s => s.settings.sound);
  useEffect(() => setHapticsEnabled(haptics), [haptics]);
  useEffect(() => preloadSfx(), []);
  useEffect(() => setSoundEnabled(sound), [sound]);

  const lifecycle = useMemo(
    () => ({
      onBackground: () => useStore.getState().pauseClock(),
      onForeground: () => {
        const r = navRef.getCurrentRoute()?.name;
        if (r && IN_GAME.has(r)) {
          useStore.getState().resumeClock();
        }
      },
    }),
    [],
  );
  useAppLifecycle(lifecycle);

  if (!hydrated) {
    return <View style={{flex: 1, backgroundColor: color.wood900}} />;
  }
  const sheet = {
    presentation: 'transparentModal',
    animation: 'none',
    contentStyle: {backgroundColor: 'transparent'},
  } as const;
  return (
    <NavigationContainer ref={navRef} theme={theme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: color.wood900},
          animation: 'fade_from_bottom',
        }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Setup" component={Setup} />
        <Stack.Screen name="Multi" component={Multi} />
        <Stack.Screen name="LobbyHost" component={LobbyHost} options={{gestureEnabled: false}} />
        <Stack.Screen name="LobbyJoin" component={LobbyJoin} options={{gestureEnabled: false}} />
        <Stack.Screen name="Board" component={Board} options={{gestureEnabled: false, animation: 'fade'}} />
        <Stack.Screen name="Result" component={Result} options={{gestureEnabled: false, animation: 'fade'}} />
        <Stack.Screen name="Rules" component={Rules} />
        <Stack.Screen name="Stats" component={Stats} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Notes" component={NotesSheet} options={sheet} />
        <Stack.Screen name="Reference" component={ReferenceSheet} options={sheet} />
        <Stack.Screen name="Solve" component={SolveSheet} options={sheet} />
        <Stack.Screen name="Options" component={OptionsSheet} options={sheet} />
        <Stack.Screen name="Detail" component={DetailSheet} options={sheet} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
