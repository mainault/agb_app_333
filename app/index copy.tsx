// app/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenContainer from './src/components/ScreenContainer';
import MenuModal from './src/components/MenuModal';
import { useIsFocused } from '@react-navigation/native';
import { usePathname } from 'expo-router';
import {
  getGlobalProperties,
  resetGlobalAsTarifs,
  resetGlobalJsonObject,
  resetGlobalJsonObjectForRanking,
  resetGlobalPaymentsList,
  resetGlobalPlayersList,
  resetGlobalProperties,
  resetGlobalResaMember,
  resetGlobalTeamLeader,
  resetGlobalUsersList,
} from './src/store/GlobalPropertiesManager';
import { MenuItemType } from './src/types/menuTypes';
import Constants from 'expo-constants';
interface PaymentResultParams {
  status: string;
  prenom: string;
  montant: string;
  nom_competition: string;
  isEclectic: boolean;
  isResynchronized: boolean;
  data?: string;
  paymentsData?: string;
  montantBrut?: string;
}

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
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // Délai pour laisser le temps à l'écran précédent de terminer
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
      }, 500); // 500ms pour laisser le temps aux opérations asynchrones

      return () => clearTimeout(timer);
    }
  }, [isFocused]);

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
          menus={menus as any}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

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