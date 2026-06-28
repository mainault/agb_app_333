import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { MenuProvider } from './context/MenuContext';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#aacdeeff');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <PaperProvider>
        <MenuProvider>
          <StatusBar
            style="dark"
            backgroundColor="#aacdeeff"
          />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#aacdeeff' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="subMenu" />
            <Stack.Screen name="src/reservation/resa" />
            <Stack.Screen name="src/reservation/displayListPlayers" />
            <Stack.Screen name="src/reservation/displayRanking" />
            <Stack.Screen name="src/reservation/displayListInscrits" />
            <Stack.Screen name="src/reservation/mesScores" />
            <Stack.Screen name="src/reservation/covoiturage" />
            <Stack.Screen name="src/reservation/covoiturageList" />
          </Stack>
        </MenuProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}