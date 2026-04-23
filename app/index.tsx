// app/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenContainer from './src/components/ScreenContainer';
import MenuModal from './src/components/MenuModal';
import { useIsFocused } from '@react-navigation/native';
import { isVersionLower } from './src/utils/version';

import {
  getGlobalAppVersionObject,
  getGlobalAppVersionProperty,
  resetGlobalAsTarifs,
  resetGlobalJsonObject,
  resetGlobalJsonObjectForRanking,
  resetGlobalPaymentsList,
  resetGlobalPlayersList,
  resetGlobalProperties,
  resetGlobalResaMember,
  resetGlobalTeamLeader,
  resetGlobalUsersList,
  setGlobalAppVersionObject,
  setGlobalAppVersionProperty,
  setGlobalProperty,
} from './src/store/GlobalPropertiesManager';

import { MenuItemType } from './src/types/menuTypes';
import Constants from 'expo-constants';
import { appConfig } from './src/config';
import { sendRequest } from './src/functions/httpRequest';
import { showAlert } from './src/utils/utilities';
import { GlobalAppVersionObject } from './src/store/GlobalStore';

const { width, height } = Dimensions.get('window');

const menus: MenuItemType[] = [
  {
    name: "Compétitions",
    subMenus: [
      {
        name: "Standard",
        subMenus: [
          { name: "Inscription / Désinscription", parentName: "Standard", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "inscription" } },
          //{ name: "Désinscription", parentName: "Standard", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "desinscription" } },
          { name: "Compléter équipe", parentName: "Standard", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "completer_equipe" } },
          { name: "Liste des inscrits", parentName: "Standard", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "liste_inscrits" } },
        ],
      },
      {
        name: "Eclectic",
        subMenus: [
          { name: "Inscription / Désinscription", parentName: "Eclectic", competitionType: "isEclectic", screen: "subMenu", params: { subMenuTitle: "eclectic_inscription" } },
          //{ name: "Désinscription", parentName: "Eclectic", competitionType: "isEclectic", screen: "subMenu", params: { subMenuTitle: "eclectic_desinscription" } },
          { name: "Mes scores", parentName: "Eclectic", competitionType: "isEclectic", screen: "subMenu", params: { subMenuTitle: "eclectic_mes_scores" } },
          { name: "Liste des inscrits", parentName: "Eclectic", competitionType: "isEclectic", screen: "subMenu", params: { subMenuTitle: "eclectic_liste_inscrits" } },
          { name: "Classement", parentName: "Eclectic", competitionType: "isEclectic", screen: "subMenu", params: { subMenuTitle: "eclectic_classement" } },
        ],
      },
      {
        name: "Challenge - hiver",
        subMenus: [
          { name: "Inscription / Désinscription", parentName: "Challenge - hiver", competitionType: "isEclectic-IS", screen: "subMenu", params: { subMenuTitle: "is_inscription" } },
          //{ name: "Désinscription", parentName: "Challenge - hiver", competitionType: "isEclectic-IS", screen: "subMenu", params: { subMenuTitle: "is_desinscription" } },
          { name: "Mes scores", parentName: "Challenge - hiver", competitionType: "isEclectic-IS", screen: "subMenu", params: { subMenuTitle: "is_mes_scores" } },
          { name: "Liste des inscrits", parentName: "Challenge - hiver", competitionType: "isEclectic-IS", screen: "subMenu", params: { subMenuTitle: "is_liste_inscrits" } },
          { name: "Classement", parentName: "Challenge - hiver", competitionType: "isEclectic-IS", screen: "subMenu", params: { subMenuTitle: "is_classement" } },
        ],
      },
      {
        name: "Ringer score",
        subMenus: [
          { name: "Inscription / Désinscription", parentName: "Ringer score", competitionType: "isRingerScore", screen: "subMenu", params: { subMenuTitle: "rs_inscription" } },
          //{ name: "Désinscription", parentName: "Ringer score", competitionType: "isRingerScore", screen: "subMenu", params: { subMenuTitle: "rs_desinscription" } },
          { name: "Mes scores", parentName: "Ringer score", competitionType: "isRingerScore", screen: "subMenu", params: { subMenuTitle: "rs_mes_scores" } },
          { name: "Liste des inscrits", parentName: "Ringer score", competitionType: "isRingerScore", screen: "subMenu", params: { subMenuTitle: "rs_liste_inscrits" } },
          { name: "Classement", parentName: "Ringer score", competitionType: "isRingerScore", screen: "subMenu", params: { subMenuTitle: "rs_classement" } },
        ],
      },
      {
        name: "BACATTSS",
        subMenus: [
          { name: "Inscription / Désinscription", parentName: "BACATTSS", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "inscription" } },
          //{ name: "Désinscription", parentName: "BACATTSS", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "desinscription" } },
          { name: "Liste des inscrits", parentName: "BACATTSS", competitionType: "isNotEclectic", screen: "subMenu", params: { subMenuTitle: "liste_inscrits" } },
        ],
      },
      {
        name: "Payer droit de jeu en ligne", parentName: "Paiement droit de jeu en ligne", competitionType: "OLP", screen: "subMenu", params: { subMenuTitle: "OLP" },
      },
      {
        name: "Covoiturage", parentName: "Covoiturage", competitionType: "covoiturage", screen: "subMenu", params: { subMenuTitle: "covoiturage" },
      },
    ],
  },

  {
    name: "Informations légales",
    subMenus: [
      {
        name: "Mentions légales",
        screen: "legal"
      }
    ]
  }
];

export default function Index() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isFocused = useIsFocused();
  const updateShownRef = useRef(false);
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';

  // 🔧 Reset global data
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        resetGlobalJsonObject();
        resetGlobalResaMember();
        resetGlobalProperties();
        resetGlobalPlayersList();
        resetGlobalPaymentsList();
        resetGlobalUsersList();
        resetGlobalTeamLeader();
        resetGlobalJsonObjectForRanking();
        resetGlobalAsTarifs();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  const requestServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      console.log("Données envoyées au serveur :", donnees);
      getServerResponse(await sendRequest(donnees));
    } catch (error) {
      console.error("Erreur :", error);
      showAlert("Erreur", "Problème de connexion.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de dispatch des réponses du serveur
  const getServerResponse = (jsonObject: any) => {
    switch (jsonObject.operationType) {
      case "getAppVersion": {
        if (jsonObject.status === "KO") {
          showAlert("Erreur", jsonObject.error || "Impossible de récupérer les compétitions.");
          return;
        }
        const data = jsonObject.version as GlobalAppVersionObject;

        setGlobalAppVersionObject(data);

        const latest = data?.latestVersion ?? '0.0.0';

        console.log( `Version actuelle: ${currentVersion}, Min: ${data?.minVersion}, Latest: ${latest}`);

        // 1. force update
        if (data?.minVersion && isVersionLower(currentVersion, data.minVersion)) {
          showForceUpdateAlert(data);
          return;
        }

// 2. update optionnelle
if (
  isVersionLower(currentVersion, latest) &&
  !updateShownRef.current
) {
  updateShownRef.current = true;
  showUpdateAlert(data);
}
        break;
      }
      default:
        break;
    }
  };
  const showForceUpdateAlert = (data: any) => {
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/idXXXXX'
        : 'https://play.google.com/store/apps/details?id=com.mainault.agb_app_333';

    Alert.alert(
      "Mise à jour obligatoire",
      data.message || `Une nouvelle version (${data.latestVersion}) est requise pour continuer.`,
      [
        {
          text: "Mettre à jour",
          onPress: () => Linking.openURL(storeUrl),
        }
      ],
      { cancelable: false } // 🔴 empêche de fermer l’alerte sur Android
    );
  };

  const checkAppVersion = async () => {
    const donnees = {
      operationType: "getAppVersion",
    };
    requestServer(donnees);
  };

  useEffect(() => {
    const timer = setTimeout(checkAppVersion, 800);
    return () => clearTimeout(timer);
  }, []);

 // 🔔 popup update
  const showUpdateAlert = (data: any) => {
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/idXXXXX'
        : 'https://play.google.com/store/apps/details?id=com.mainault.agb_app_333';

    Alert.alert(
      "Mise à jour disponible",
      data.message || `Version ${data.latestVersion} disponible.`,
      [
        { text: "Mettre à jour", onPress: () => Linking.openURL(storeUrl) },
        { text: "Plus tard", style: "cancel" }
      ]
    );
  };

  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScreenContainer onMenuPress={handleMenuPress} isHome={true}>
          <View style={styles.contentContainer}>
            <ImageBackground
              source={require('../assets/images/background.jpg')}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View style={styles.overlay}>
                <View style={styles.container}>
                  <Text style={styles.title}>
                    Bienvenue sur le site de l'AS
                    {"\n"}
                    <Text>du golf de Baugé en Anjou</Text>
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        </ScreenContainer>

        <MenuModal
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          menus={menus}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// 🎨 STYLES
const styles = StyleSheet.create({
  safeArea: {
    height: '97%',
    backgroundColor: 'white',
    marginTop: -25,
  },
  contentContainer: {
    justifyContent: 'center',
    height: '90%',
    padding: 20,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
  },
});