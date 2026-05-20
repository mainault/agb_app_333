import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomHeader from './CustomHeader';

interface ScreenContainerProps {
  children: React.ReactNode;
  showHeader?: boolean;
  onMenuPress?: () => void;
  isHome?: boolean;
  appVersion?: string;
}

export default function ScreenContainer({
  children,
  showHeader = true,
  onMenuPress,
  isHome = false,
  appVersion,
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      {showHeader && (
        <CustomHeader
          onMenuPress={onMenuPress}
          isHome={isHome}
          appVersion={appVersion}
        />
      )}

      <View
        style={[
          styles.content,
          !showHeader && !isHome && styles.contentWithoutHeader,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#aacdeeff',
  },

  content: {
    flex: 1,
    backgroundColor: '#aacdeeff',
  },

  contentWithoutHeader: {
    paddingTop: 30,
    paddingBottom: 50,
  },
});