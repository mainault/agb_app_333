// app/_layout.tsx
import { Stack, } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { MenuProvider } from './context/MenuContext';



export default function RootLayout() {

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
          <Stack.Screen name="src/reservation/covoiturageList" options={{ headerShown: false }} />
        </Stack>
      </MenuProvider>
    </PaperProvider>
  );
}


