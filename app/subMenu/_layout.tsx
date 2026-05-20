import { Stack } from 'expo-router';

export default function SubMenuLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#aacdeeff' },
      }}
    />
  );
}