import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sendRequest } from '../src/utils/api';
import DropdownCompetition from '../src/components/DropdownCompetition';
import ScreenContainer from './../src/components/ScreenContainer';
import { getGlobalAppVersionObject, getGlobalProperties, setGlobalAsTarifs, setGlobalProperty } from '../src/store/GlobalPropertiesManager';
import { showAlert } from '../src/utils/utilities';
import { CompetitionClass, getCompetitionClassForRequest, getCompetitionClassFromType } from '../src/utils/competitionClass';


// Définition des types
interface Competition {
  competition_key: string;
  nom_competition: string;
  tarif_adulte?: string;
  tarif_enfant?: string;
  tarif_membre?: string;
  formule?: string;
  date_competition?: string;
}

export default function ChoixCompetition() {
  const { params, subMenuTitle, parentName, competitionType } = useLocalSearchParams<{
    name: string;
    subMenuTitle: string;
    parentName: string;
    competitionType: string;
    params: any;
  }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitionKey, setSelectedCompetitionKey] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [multiCompetitionsList, setMultiCompetitionsList] = useState<Competition[]>([]);
  const isCovoiturage = parentName === "Covoiturage";

  const navigationStarted = useRef(false);

  useFocusEffect(useCallback(() => {
    navigationStarted.current = false;
  }, []));

  const requestServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      getServerResponse(await sendRequest(donnees));
    } catch (error) {
      showAlert("Erreur", "Problème de connexion.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de dispatch des réponses du serveur
  const getServerResponse = (jsonObject: any) => {
    switch (jsonObject.operationType) {
      case "getASTarifs":
          setGlobalAsTarifs(jsonObject);
          // Ouverture automatique de la modale OLPTransaction si competitionType === "OLP"
          if (competitionType === "OLP" && jsonObject.status === "OK") {
            //setIsOLPTransactionModalVisible(true);
          }
          break;

      case "getCurrentCompetitions":
        if (jsonObject.status === "KO") {
          showAlert(
            "Erreur",
            jsonObject.error || "Impossible de récupérer les compétitions."
          );
          return;
        }

        if (jsonObject.isComplete === "incomplete") {
          if (!Array.isArray(jsonObject.incomplete) || jsonObject.incomplete.length === 0) {
            showAlert(
              "Information",
              "Il n'y a aucune équipe incomplète."
            );
            router.back();
            return;
          }

          setMultiCompetitionsList(jsonObject.incomplete);
          break;
        }

        if (competitionType === "OLP") {
          setCompetitions(jsonObject.multiCompetitionsList || []);
        } else {
          setMultiCompetitionsList(jsonObject.multiCompetitionsList || []);
        }

        break;

      default:
        break;
    }
  };

  // Appel initial du serveur
  useEffect(() => {
    setGlobalProperty('menuEquipeIncomplete', subMenuTitle == "Compléter équipe" ? true : false);

    if (subMenuTitle === "Mes résultats") {
      setGlobalProperty('sous_menu', subMenuTitle as string);
      setGlobalProperty('menu', parentName as string);

      router.push({
        pathname: `/subMenu/Login`,
        params: {
          subMenuTitle,
          parentName,
          competitionType,
          selectedCompetitionKey: "",
          selectedCompetitionName: "",
        },
      });

      return;
    }

    if (
      subMenuTitle === "Mes scores" &&
      competitionType !== "isNotEclectic"
    ) {
      setGlobalProperty('sous_menu', subMenuTitle as string);
      setGlobalProperty('menu', parentName as string);

      router.push({
        pathname: `/subMenu/Login`,
        params: {
          subMenuTitle,
          parentName,
          competitionType,
          selectedCompetitionKey: selectedCompetitionKey,
          selectedCompetitionName: selectedCompetitionName,
        },
      });

      return;
    }

    let donnees = null;

    if (competitionType === "OLP") {
      donnees = {
        operationType: "getASTarifs",
        source: 'olpTransaction',
      };
    } else {
      donnees = {
        operationType: "getCurrentCompetitions",
        competitionClass: isCovoiturage
          ? CompetitionClass.ALL_TYPES
          : getCompetitionClassForRequest(competitionType),
        action: "displayLogin",
        list: subMenuTitle === "Liste des inscrits" ? "yes" : "no",
        isMassResaAccess: false,
        isComplete:
          getGlobalProperties().menuEquipeIncomplete
            ? "incomplete"
            : "normal",
        isBacattss: parentName === "BACATTSS" ? true : false,
      };
    }

    requestServer(donnees);
  }, []);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    setSelectedCompetitionKey(null);
    let isEclecticValue = "isNotEclectic";
    switch (option) {
      case "Eclectic":
        isEclecticValue = "isEclectic";
        break;
      case "Ringer Score":
        isEclecticValue = "isRingerScore";
        break;
      case "Challenge hiver":
        isEclecticValue = "isEclectic-IS";
        break;
      case "Autres compétitions":
        isEclecticValue = "isNotEclectic";
        break;
    }
    const donnees = {
      operationType: "getCurrentCompetitions",
      competitionClass: getCompetitionClassFromType(isEclecticValue),
      action: "displayLogin",
      list: "no",
      isMassResaAccess: false,
      isComplete: "normal",
      isOLP: competitionType === "OLP",
    };
    requestServer(donnees);
  };

  // Trouver la compétition sélectionnée pour récupérer son nom et sa formule
  const getSelectedCompetitionAbstract = (): any | null => {
    const list = competitionType === "OLP" ? competitions : multiCompetitionsList;
    if (!selectedCompetitionKey) return null;
    const selected = list.find(c => c.competition_key === selectedCompetitionKey);
    return selected ? selected : null;
  };

  const selectedCompetitionName = getSelectedCompetitionAbstract()?.nom_competition || null;

  const handleCompetitionSelect = (key: string) => {
    if (navigationStarted.current) {
      return;
    }
    const list = competitionType === "OLP" ? competitions : multiCompetitionsList;
    const selectedCompetition = list.find(item => String(item.competition_key) === String(key));
    if (!selectedCompetition) {
      showAlert("Erreur", "Veuillez sélectionner une compétition.");
      return;
    }
    if(subMenuTitle === "Compléter équipe" && selectedCompetition.formule?.includes("Scramble") !== true) {
      showAlert("Erreur", "La fonctionnalité de compléter équipe n'est disponible que pour les compétitions en formule scramble.");
      return;
    }
    navigationStarted.current = true;
    setSelectedCompetitionKey(key);
    setGlobalProperty('sous_menu', subMenuTitle as string);
    setGlobalProperty('menu', parentName as string);
    router.push({
      pathname: `/subMenu/Login`,
      params: {
        subMenuTitle,
        parentName,
        competitionType: competitionType === "OLP" ? (
          selectedOption === "Eclectic" ? "isEclectic" :
          selectedOption === "Ringer Score" ? "isRingerScore" :
          selectedOption === "Challenge hiver" ? "isEclectic-IS" : "isNotEclectic"
        ) : competitionType,
        selectedCompetitionKey: competitionType === "OLP" ? "OLP" : key,
        selectedCompetitionName: selectedCompetition.nom_competition,
      },
    });
  };

  return (
    <ScreenContainer
        showHeader={true}
        appVersion={getGlobalAppVersionObject()?.latestVersion}
      >
        <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={28} color="#183b66" />
          <Text style={{ fontSize: 16, color: '#183b66', marginLeft: 6 }}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choix de la compétition</Text>
        <Text style={styles.subtitle}>Formule : {parentName}</Text>

        {competitionType === "OLP" ? (
          <>
              <View style={styles.radioGroup}>
                {["Eclectic", "Ringer Score", "Challenge hiver", "Autres compétitions"].map((option) => (
                  <View key={option} style={styles.radioOption}>
                    <TouchableOpacity onPress={() => handleOptionChange(option)}>
                      <View style={styles.radioCircle}>
                        {selectedOption === option && <View style={styles.selectedRb} />}
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.radioLabel}>{option}</Text>
                  </View>
                ))}
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color="#0000ff" />
              ) : (
                <DropdownCompetition
                  competitions={competitions}
                  selectedCompetition={selectedCompetitionKey}
                  onSelect={handleCompetitionSelect}
                  maxLabelLength={40}
                  flatListProps={{
                    contentContainerStyle: { paddingVertical: 0 },
                    ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: 'transparent' }} />
                  }}
                />
              )}
          </>
        ) : (
          <>
            {isLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <>
                <View style={styles.dropdownContainer}>
                  <DropdownCompetition
                    competitions={multiCompetitionsList}
                    selectedCompetition={selectedCompetitionKey}
                    onSelect={handleCompetitionSelect}
                    maxLabelLength={40}
                    flatListProps={{
                      contentContainerStyle: { paddingVertical: 0 },
                      ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: 'transparent' }} />
                    }}
                  />
                </View>
              </>
            )}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginTop: 20,
    height: "40%",
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#080101ff',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  radioGroup: {
    marginTop: 20,
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  radioLabel: {
    fontSize: 16,
  },

});
