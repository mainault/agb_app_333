import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type CustomHeaderProps = {
  onMenuPress?: () => void;
  isHome?: boolean;
  appVersion?: string;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({
  onMenuPress,
  isHome = false,
  appVersion,
}) => {
  const router = useRouter();

  const handleMenuPress = () => {
    if (isHome && onMenuPress) {
      onMenuPress();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.headerContainer}>

      {/* LEFT - LOGO */}
      <View style={styles.leftContainer}>
        <Image
          source={require('../../../assets/images/logo_as_transparent.png')}
          style={styles.logo}
        />
      </View>

      {/* CENTER - TITLE */}
      <View style={styles.centerContainer}>
        <Text style={styles.companyName}>AS golf de Baugé</Text>
      </View>

      {/* RIGHT - MENU + VERSION */}
      <View style={styles.rightContainer}>
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        {appVersion && (
          <Text style={styles.version}>
            v{appVersion}
          </Text>
        )}
      </View>

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
    paddingTop: 10,
    paddingBottom: 10,
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
  leftContainer: {
    width: 50,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 50,
    alignItems: 'center', // 👈 clé pour empiler verticalement
  },
  version: {
    fontSize: 10,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default CustomHeader;