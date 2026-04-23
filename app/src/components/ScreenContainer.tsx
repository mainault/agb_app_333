// components/ScreenContainer.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import CustomHeader from './CustomHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  showHeader?: boolean;
  onMenuPress?: () => void;
  isHome?: boolean; // Nouvelle prop
}

export default function ScreenContainer({
  children,
  showHeader = true,
  onMenuPress,
  isHome = false,
}: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      {showHeader && (
        <CustomHeader
          onMenuPress={onMenuPress}
          isHome={isHome}
        />
      )}
      <SafeAreaView style={styles.scrollView}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height:'97.5%',
    //backgroundColor: '#aacdeeff', // Même couleur de fond que dans _layout.tsx
  },
  scrollView: {

    backgroundColor: '#aacdeeff', // Même couleur de fond que dans _layout.tsx
  },
});
