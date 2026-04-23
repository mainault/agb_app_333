import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { sendRequest } from '../src/utils/api';
import DropdownCompetition from '../src/components/DropdownCompetition';
import ScreenContainer from './../src/components/ScreenContainer';
import { formatHtmlForAlert } from '../src/utils/htmlUtils';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../src/components/CustomButton';
import { getGlobalAsTarif, getGlobalAsTarifs, setGlobalAsTarifs, setGlobalProperty } from '../src/store/GlobalPropertiesManager';
import { showAlert } from '../src/utils/utilities';

// Définition des types
interface Competition {
  competition_key: string;
  nom_competition: string;
  tarif_adulte?: string;
  tarif_enfant?: string;
  tarif_membre?: string;
  formule?: string;
}

interface ASTarifs {
  tarif_adulte: string;
  tarif_enfant: string;
  tarif_membre: string;
}

export default function ChoixCompetition() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { params, subMenuTitle, parentName, competitionType } = useLocalSearchParams<{
    name: string;
    subMenuTitle: string;
    parentName: string;
    competitionType: string;
    params: any;
  }>();

  // État pour gérer l'état de chaque bouton par son ID
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({
    'valider-btn': true,
    'abandonner-btn': true,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitionKey, setSelectedCompetitionKey] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [multiCompetitionsList, setMultiCompetitionsList] = useState<Competition[]>([]);
  const [asTarifs, setAsTarifs] = useState<ASTarifs | null>(null);
  const [isOLPTransactionModalVisible, setIsOLPTransactionModalVisible] = useState(false);
  const [selectedTarifType, setSelectedTarifType] = useState<'adulte' | 'enfant' | 'membre'>('adulte');

  const navigation = useNavigation();

  // Fonction pour mettre à jour l'état d'un bouton
  const setButtonState = (id: string, enabled: boolean) => {
    setButtonStates(prev => ({
      ...prev,
      [id]: enabled,
    }));
  };

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
          showAlert("Erreur", jsonObject.error || "Impossible de récupérer les compétitions.");
          return;
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
    if (subMenuTitle === "Mes scores" && competitionType !== "isNotEclectic") {
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
        isEclectic: competitionType === "covoiturage" ? "isAllTypes" : competitionType,
        action: "displayLogin",
        list: subMenuTitle === "Liste des inscrits" ? "yes" : "no",
        isMassResaAccess: false,
        isComplete: "normal",
        isBacattss: parentName === "BACATTSS" ? true : false,
      };
    }
    requestServer(donnees);
  }, []);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
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
      isEclectic: isEclecticValue,
      action: "displayLogin",
      list: "no",
      isMassResaAccess: false,
      isComplete: "normal",
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

  const handleValider = () => {
    if (!selectedCompetitionKey) {
      showAlert("Erreur", "Veuillez sélectionner une compétition.");
      return;
    }
    if(subMenuTitle === "Compléter équipe" && getSelectedCompetitionAbstract()?.formule.includes("scramble") !== true) {
      showAlert("Erreur", "La fonctionnalité de compléter équipe n'est disponible que pour les compétitions en formule scramble.");
      return;
    }
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
        selectedCompetitionKey: competitionType === "OLP" ? "OLP" : selectedCompetitionKey,
        selectedCompetitionName: selectedCompetitionName,
      },
    });
  };

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.container}>
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
                  onSelect={setSelectedCompetitionKey}
                  maxLabelLength={40}
                  flatListProps={{
                    contentContainerStyle: { paddingVertical: 0 },
                    ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: 'transparent' }} />
                  }}
                />
              )}


            <View style={styles.buttonsContainer}>
              <CustomButton
                id="abandonner-btn"
                title="Abandonner"
                onPress={() => router.back()}
                buttonStates={buttonStates}
                setButtonState={setButtonState}
              />
              <CustomButton
                id="valider-btn"
                title="Valider"
                onPress={handleValider}
                buttonStates={buttonStates}
                setButtonState={setButtonState}
              />
            </View>
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
                    onSelect={setSelectedCompetitionKey}
                    maxLabelLength={40}
                    flatListProps={{
                      contentContainerStyle: { paddingVertical: 0 },
                      ItemSeparatorComponent: () => <View style={{ height: 1, backgroundColor: 'transparent' }} />
                    }}
                  />
                </View>
                <View style={styles.buttonsContainer}>
                  <CustomButton
                    id="abandonner-btn"
                    title="Abandonner"
                    onPress={() => router.back()}
                    buttonStates={buttonStates}
                    setButtonState={setButtonState}
                  />
                  <CustomButton
                    id="valider-btn"
                    title="Valider"
                    onPress={handleValider}
                    buttonStates={buttonStates}
                    setButtonState={setButtonState}
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: "50%",
    paddingHorizontal: 0,
  },
  container: {
    height: '95.5%',
    marginTop: 0,
    padding: 30,
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
