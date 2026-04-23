import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SubMenuScreen() {
  useEffect(() => {
    console.log("SubMenu screen is called");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sous-Menu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
