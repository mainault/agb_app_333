// app/_layout.tsx
import { router, Stack, } from 'expo-router';
import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from './context/MenuContext';
import { BackHandler } from 'react-native';


export default function RootLayout() {
  useEffect(() => {
    const backAction = () => {
      router.replace('/'); // Retour à l'accueil
      return true; // Empêche le comportement par défaut
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  return (
    <PaperProvider>
      <MenuProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="subMenu" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/resa" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/displayListPlayers" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/displayRanking" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/displayListInscrits" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/mesScores" options={{ headerShown: false }} />
          <Stack.Screen name="src/reservation/covoiturage" options={{ headerShown: false }} />
        </Stack>
      </MenuProvider>
    </PaperProvider>
  );
}


