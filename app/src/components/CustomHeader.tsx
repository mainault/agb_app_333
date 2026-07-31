import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

type CustomHeaderProps = {
  onMenuPress?: () => void;
  isHome?: boolean;
  appVersion?: string;
  showMainMenuButton?: boolean;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({
  onMenuPress,
  isHome = false,
  appVersion,
  showMainMenuButton = false
}) => {
  const router = useRouter();

  const handleMenuPress = () => {
    if (isHome && onMenuPress) {
      onMenuPress();
      return;
    }

    router.replace('/');
  };

  const handleMainMenuPress = () => {
    router.replace('/');
  };
  
  return (
    <SafeAreaView
      edges={['top']}
      style={styles.safeArea}
    >
      <View
        style={[
          styles.headerContainer,
          showMainMenuButton && styles.compactHeader
        ]}
      >
        {/* LEFT - LOGO OU MENU PRINCIPAL */}
        <View
          style={[
            styles.leftContainer,
            showMainMenuButton && styles.mainMenuContainer
          ]}
        >
          {showMainMenuButton ? (
            <TouchableOpacity
              style={styles.mainMenuButton}
              onPress={handleMainMenuPress}
              accessibilityRole="button"
              accessibilityLabel="Retour au menu principal"
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color="#000"
              />

              <Text style={styles.mainMenuText}>
                Accueil
              </Text>
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../../../assets/images/logo_as_transparent.png')}
              style={styles.logo}
            />
          )}
        </View>

        {/* CENTER - TITLE */}
        <View style={styles.centerContainer}>
          <Text
            style={styles.companyName}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            AS golf de Baugé
          </Text>
        </View>

        {/* RIGHT - MENU */}
        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le menu"
          >
            <Ionicons
              name="menu"
              size={30}
              color="black"
            />
          </TouchableOpacity>

          {appVersion && (
            <Text style={styles.version}>
              v{appVersion}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#83bff7ff',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#83bff7ff',
    height: 90,
    paddingHorizontal: 20,
  },

  compactHeader: {
    height: 58,
  },

  logo: {
    height: 64,
    width: 64,
    marginRight: 10,
  },

  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  menuButton: {
    padding: 8,
  },

  leftContainer: {
    width: 64,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  mainMenuContainer: {
    width: 82,
  },

  mainMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },

  mainMenuText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: -4,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  rightContainer: {
    width: 64,
    alignItems: 'center',
  },

  version: {
    fontSize: 10,
    opacity: 0.9,
    marginTop: 2,
  },
});

export default CustomHeader;