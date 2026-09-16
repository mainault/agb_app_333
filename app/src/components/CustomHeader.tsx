import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
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
  showMainMenuButton = false,
}) => {
  const router = useRouter();

  // Accessibilité : détection d'une taille de police système augmentée
  const { fontScale } = useWindowDimensions();
  const isLargeFont = fontScale > 1.2;

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
          showMainMenuButton && styles.compactHeader,
          isLargeFont && styles.headerContainerLargeFont,
          showMainMenuButton &&
            isLargeFont &&
            styles.compactHeaderLargeFont,
        ]}
      >
        {/* LEFT - LOGO OU MENU PRINCIPAL */}
        <View
          style={[
            styles.leftContainer,
            showMainMenuButton && styles.mainMenuContainer,
            showMainMenuButton &&
              isLargeFont &&
              styles.mainMenuContainerLargeFont,
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

              <Text
                style={[
                  styles.mainMenuText,
                  isLargeFont && styles.mainMenuTextLargeFont,
                ]}
              >
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
            style={[
              styles.companyName,
              isLargeFont && styles.companyNameLargeFont,
            ]}
            numberOfLines={1}
          >
            AS golf de Baugé
          </Text>
        </View>

        {/* RIGHT - MENU */}
        <View style={[styles.rightContainer, isLargeFont && styles.rightContainerLargeFont,]}>
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

  /*
   * Affichage standard :
   * on conserve exactement la hauteur historique.
   */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#83bff7ff',
    height: 90,
    paddingHorizontal: 20,
  },

  /*
   * Header compact standard.
   */
  compactHeader: {
    height: 58,
  },

  /*
   * Police système agrandie :
   * la hauteur n'est plus bloquée à 90 px.
   */
  headerContainerLargeFont: {
    height: undefined,
    minHeight: 110,
  },

  /*
   * Même principe pour le header compact.
   */
  compactHeaderLargeFont: {
    height: undefined,
    minHeight: 72,
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

  /*
   * On conserve fontSize 20 :
   * React Native applique déjà le fontScale système.
   */
  companyNameLargeFont: {
    fontSize: 20,
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

  /*
   * Permet au texte "Accueil" de ne pas provoquer
   * de débordement horizontal en grosse police.
   */
  mainMenuTextLargeFont: {
    fontSize: 12,
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
  mainMenuContainerLargeFont: {
    width: 70,
  },

  rightContainerLargeFont: {
    width: 50,
  },
});

export default CustomHeader;