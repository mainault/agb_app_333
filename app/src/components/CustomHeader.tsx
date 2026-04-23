// components/CustomHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMenu } from '../../context/MenuContext';
import { router, useNavigation } from 'expo-router';

type CustomHeaderProps = {
  onMenuPress?: () => void;
  isHome?: boolean;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ onMenuPress, isHome = false }) => {
  const handleMenuPress = () => {
    if (isHome && onMenuPress) {
      onMenuPress();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/logo_as_transparent.png')}
          style={styles.logo}
        />
        <Text style={styles.companyName}>AS golf de Baugé</Text>
      </View>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
        <Ionicons name="menu" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#83bff7ff',
    height: 90,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 30,
    zIndex: 1000,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 64,
    width: 64,
    marginRight: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
});

export default CustomHeader;