// app/subMenu/_layout.tsx
import { Stack } from 'expo-router';
import { useState } from 'react';
import CustomHeader from '../src/components/CustomHeader';

export default function SubMenuLayout() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <CustomHeader onMenuPress={() => setMenuVisible(true)} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="[subMenuTitle]" options={{ headerShown: false }} />
        <Stack.Screen name="Login" options={{ headerShown: false }} />
        <Stack.Screen name="ChoixCompetition" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}