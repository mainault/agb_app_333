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
  appVersion?: string; // Nouvelle prop pour la version de l'app
  useTopSafeArea?: boolean;
}

export default function ScreenContainer({
    children,
    showHeader = true,
    onMenuPress,
    isHome = false,
    appVersion,
    useTopSafeArea = false,
  }: ScreenContainerProps) {
    if (useTopSafeArea) {
      return (
        <View style={styles.containerFlex}>
          <SafeAreaView edges={["top"]} style={styles.headerSafe}>
            {showHeader && (
              <CustomHeader
                onMenuPress={onMenuPress}
                isHome={isHome}
                appVersion={appVersion}
              />
            )}
          </SafeAreaView>

          <SafeAreaView style={styles.contentFlex}>
            {children}
          </SafeAreaView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {showHeader && (
          <CustomHeader
            onMenuPress={onMenuPress}
            isHome={isHome}
            appVersion={appVersion}
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
  height: '97.9%',
},

scrollView: {
  backgroundColor: '#aacdeeff',
},

containerFlex: {
  flex: 1,
  backgroundColor: '#aacdeeff',
},

headerSafe: {
  backgroundColor: '#83bff7ff',
},

contentFlex: {
  flex: 1,
  backgroundColor: '#aacdeeff',
},
});
