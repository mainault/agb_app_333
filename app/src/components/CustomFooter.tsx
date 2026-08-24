import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function CustomFooter() {
  return <View style={styles.footer} />;
}

const styles = StyleSheet.create({
  footer: {
    height: 34,
    backgroundColor: '#83bff7ff',
  },
});