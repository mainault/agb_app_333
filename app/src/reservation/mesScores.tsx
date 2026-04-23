import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from '../components/dropDown';
import { getGlobalJsonObject, getGlobalProperties, setGlobalProperty } from '../store/GlobalPropertiesManager';
import { showAlert } from '../utils/utilities';
import { sendRequest } from '../utils/api';

interface PlayerTour {
  T1: string; T2: string; T3: string; T4: string; T5: string;
  T6: string; T7: string; T8: string; T9: string; T10: string;
  T11: string; T12: string; T13: string; T14: string; T15: string;
  T16: string; T17: string; T18: string;
  score: string;
  tour: string;
  brut: string;
  net: string;
  [key: string]: string;
}

interface ScoreData {
  title: string;
  cumuls: { label: string; value: string }[];
  usersArray: PlayerTour[];
}

interface ScoreRow {
  trou: string;
  [key: string]: string;
}

const MesScores = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ScoreData>({
    title: 'Mes Scores',
    cumuls: [],
    usersArray: []
  });
  const [selectedTrimestre, setSelectedTrimestre] = useState('0');
  const [selectedTour, setSelectedTour] = useState('0');
  const [showSynthesis, setShowSynthesis] = useState(false);
  const params = useLocalSearchParams();
  const globalJsonObject = useRef(params.globalJsonObject ? JSON.parse(params.globalJsonObject as string) : getGlobalJsonObject()).current;
  const [codeClub, setCodeClub] = useState("");
  const { height: windowHeight } = Dimensions.get('window');

  // Initialisation des tableaux vides avec toutes les colonnes
  useEffect(() => {
    // Si ringer-score on charge le tableau car il n'y a pas de choix trimestre ou tour
    if(globalJsonObject.isEclectic === "isRingerScore"){
      const donnees = {
        operationType: selectedTrimestre === '0' ? "getUserCurrentQuarterEclecticScores" : 'getUserSearchEclecticScores',
        CRUD: "list",
        trimestre: selectedTrimestre === '0' ? '' : selectedTrimestre,
        tour:  selectedTour === '0' ? '' : selectedTour, 
        isEclectic: globalJsonObject.isEclectic,
        licence: globalJsonObject.licence,
      };
      setShowSynthesis(true);
      fetchDataFromServer(donnees);
    }else{
      // Créer un tableau vide avec des lignes vides pour cumuls
      const emptyCumuls = [
        { label: 'Cumul Brut', value: '' },
        { label: 'Cumul Net', value: '' },
        { label: 'Moyenne', value: '' }
      ];
      // Créer un tableau vide avec des lignes vides pour usersArray
      const emptyUsersArray = Array(18).fill(0).map((_, i) => {

        const emptyTour: PlayerTour = {
          T1: '', T2: '', T3: '', T4: '', T5: '',
          T6: '', T7: '', T8: '', T9: '', T10: '',
          T11: '', T12: '', T13: '', T14: '', T15: '',
          T16: '', T17: '', T18: '',
          score: '',
          tour: (i + 1).toString(),
          brut: '',
          net: ''
        };
        return emptyTour;
      });

      setData({
        title: 'Mes Scores',
        cumuls: emptyCumuls,
        usersArray: emptyUsersArray
      });
      setIsLoading(false);
    }
  }, []);

  const trimestreOptions = [
    { label: '', value: '0' },
    { label: 'Trimestre 1', value: '1' },
    { label: 'Trimestre 2', value: '2' },
    { label: 'Trimestre 3', value: '3' },
    { label: 'Trimestre 4', value: '4' }
  ];

  const tourOptions = [
    { label: '', value: '0' },
    { label: 'Tour 1', value: '1' },
    { label: 'Tour 2', value: '2' },
    { label: 'Tour 3', value: '3' },
    { label: 'Tour 4', value: '4' }
  ];

  const analyzeTours = () => {
    const numberedTours = data.usersArray.filter(t => t.tour !== 'S');
    const hasSynthesis = data.usersArray.some(t => t.tour === 'S');
    const synthesisData = hasSynthesis ? data.usersArray.find(t => t.tour === 'S') : null;
    const maxTourNumber = numberedTours.length > 0 ? Math.max(...numberedTours.map(t => parseInt(t.tour))) : 0;

    let allTourNumbers = [];
    if (globalJsonObject.isEclectic === 'isRingerScore') {
      allTourNumbers = maxTourNumber > 0 ? Array.from({ length: maxTourNumber }, (_, i) => (i + 1).toString()) : [];
    } else {
      allTourNumbers = Array.from({ length: 7 }, (_, i) => (i + 1).toString());
    }

    return { allTourNumbers, hasSynthesis, synthesisData, numberedTours: numberedTours };
  };

  const { allTourNumbers, hasSynthesis, synthesisData } = analyzeTours();

  const fetchDataFromServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      const response = await sendRequest(donnees);
      getServerResponse(response);
    } catch (error) {
      console.error("Erreur dans fetchDataFromServer:", error);
      await showAlert("Gestion des erreurs", "Problème de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const getServerResponse = (jsonObject: any) => {
    switch (jsonObject.operationType) {
      case "getUserCurrentQuarterEclecticScores":
      case "getUserSearchEclecticScores":
        if (jsonObject.status === "KO") {
          showAlert("Gestion des erreurs", jsonObject.error);
          return;
        }
        setData({
          title: jsonObject.title || 'Mes Scores',
          cumuls: jsonObject.cumuls || [],
          usersArray: jsonObject.usersArray || []
        });
        setGlobalProperty('nbrPlayersForRanking', jsonObject.nbrPlayers);
        setGlobalProperty('scoreForScores', jsonObject.score[0]);
        setGlobalProperty('rankNet', jsonObject.score[0]);
        setGlobalProperty('scoresBrut', jsonObject.brut);
        setGlobalProperty('scoresNet', jsonObject.net);
        setGlobalProperty('rankBrut', jsonObject.rang[0]);
        if (jsonObject.usersArray.length > 0) {
          setCodeClub(jsonObject.usersArray[0].code_club);
        }
        break;
    }
  };

  const fetchSynthesisData = () => {
      const donnees = {
      operationType: selectedTrimestre === '0' ? "getUserCurrentQuarterEclecticScores" : 'getUserSearchEclecticScores',
      CRUD: "list",
      trimestre: selectedTrimestre === '0' ? '' : selectedTrimestre,
      tour:  selectedTour === '0' ? '' : selectedTour, 
      isEclectic: globalJsonObject.isEclectic,
      licence: globalJsonObject.licence,
    };
    setShowSynthesis(true);
    fetchDataFromServer(donnees);
  };

  const handleEmailScores = () => {
    const annee = data.usersArray[0]?.annee || new Date().getFullYear().toString();
    const trimestre = globalJsonObject.isEclectic === 'isEclectic' ? selectedTrimestre : '';
    const donnees = {
      operationType: "sendIndividualScores",
      annee: annee,
      licence: [globalJsonObject.licence],
      isEclectic: globalJsonObject.isEclectic,
      trimestre: trimestre,
      tour: globalJsonObject.isEclectic === 'isEclecticIS' ? selectedTour : '',
      isSynthesis: hasSynthesis,
      action: "sendIndividualScores",
      code_club: codeClub,
    };
    fetchDataFromServer(donnees);
  };

  const handleTerminer = () => {
    router.replace('/');
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.trouHeader]}>Trou</Text>
      {allTourNumbers.map((tourNum, index) => (
        <Text key={`header-${tourNum}`} style={[styles.headerCell, { width: tourColumnWidth }]}>
          {hasSynthesis && index === allTourNumbers.length - 1 ? 'S' : `T${tourNum}`}
        </Text>
      ))}
    </View>
  );

  const renderScoreRow = (row: ScoreRow, index: number) => (
    <View key={`row-${index}`} style={styles.scoreRow}>
      <Text style={[styles.scoreCell, styles.trouCell]}>
        {row.trou}
      </Text>
      {allTourNumbers.map((tourNum, colIndex) => {
        const isLastColumn = colIndex === allTourNumbers.length - 1;
        const key = globalJsonObject.isEclectic !== 'isRingerScore' && isLastColumn && hasSynthesis ? 'synthese' : `tour${tourNum}`;
        return (
          <Text
            key={`cell-${row.trou}-${key}`}
            style={[styles.scoreCell, { width: tourColumnWidth }]}
          >
            {row[key] || "—"}
          </Text>
        );
      })}
    </View>
  );

  const renderCumuls = () => (
    <View style={styles.cumulsContainer}>
      {data.cumuls.map((cumul, index) => (
        <Text key={index} style={styles.cumulText}>
          {cumul.label}: {cumul.value}
        </Text>
      ))}
    </View>
  );

  const prepareScoreData = (): { trouRows: ScoreRow[], brutRow: ScoreRow, netRow: ScoreRow } => {
    const trouRows: ScoreRow[] = [];
    let brutRow: ScoreRow = { trou: "BRUT" };
    let netRow: ScoreRow = { trou: "NET" };

    for (let i = 1; i <= 18; i++) {
      const trouKey = `T${i}` as keyof PlayerTour;
      const row: ScoreRow = { trou: `${i}` };
      allTourNumbers.forEach((tourNum, index) => {
        const isLastColumn = index === allTourNumbers.length - 1;
        const tourData = data.usersArray.find(t => t.tour === tourNum);
        if (globalJsonObject.isEclectic !== 'isRingerScore' && isLastColumn && hasSynthesis) {
          row.synthese = synthesisData?.[trouKey] || "—";
        } else {
          row[`tour${tourNum}`] = tourData?.[trouKey] || "—";
        }
      });
      trouRows.push(row);
    }

    allTourNumbers.forEach((tourNum, index) => {
      const isLastColumn = index === allTourNumbers.length - 1;
      const tourData = data.usersArray.find(t => t.tour === tourNum);
      if (globalJsonObject.isEclectic !== 'isRingerScore' && isLastColumn && hasSynthesis) {
        brutRow.synthese = synthesisData?.brut || "—";
        netRow.synthese = synthesisData?.net || "—";
      } else {
        brutRow[`tour${tourNum}`] = tourData?.brut || "—";
        netRow[`tour${tourNum}`] = tourData?.net || "—";
      }
    });

    return { trouRows, brutRow, netRow };
  };

  const { trouRows, brutRow, netRow } = prepareScoreData();
  const tourColumnWidth = 45;
  const tableMinWidth = 40 + allTourNumbers.length * tourColumnWidth;

  const getTableMaxHeight = () => {
    return windowHeight * 0.7;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Compétitions : {globalJsonObject.isEclectic === 'isEclectic' ? 'ECLECTIC' : globalJsonObject.isEclectic === 'isEclectic-IS' ? 'CHALLENGE HIVER' : 'RINGER SCORE'}
        </Text>

        {(globalJsonObject.isEclectic === 'isEclectic' || globalJsonObject.isEclectic === 'isEclectic-IS') && (
          <View style={styles.dropdownsContainer}>
            {globalJsonObject.isEclectic === 'isEclectic' && (
              <Dropdown
                label="Trimestre"
                selectedValue={selectedTrimestre}
                onValueChange={setSelectedTrimestre}
                options={trimestreOptions}
                placeholder="Sélection..."
                width="30%"
              />
            )}
            <Dropdown
              label="Tour"
              selectedValue={selectedTour}
              onValueChange={setSelectedTour}
              options={tourOptions}
              placeholder="Sélection..."
              width={globalJsonObject.isEclectic === 'isEclectic-IS' ? "45%" : globalJsonObject.isEclectic === 'isEclectic' ? "30%" : '30%'}
            />
            <TouchableOpacity
              style={styles.synthesisButton}
              onPress={fetchSynthesisData}
            >
              <Text style={styles.finishButtonText}>Afficher</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.classementContainer}>
          {globalJsonObject.isEclectic === 'isRingerScore' && (
            <>
              <Text style={styles.classementText}>
                Classement Brut : <Text style={styles.classementValue}>{getGlobalProperties().scoresBrut}</Text> -
                Rang : <Text style={styles.classementValue}>{getGlobalProperties().rankBrut}</Text> /
                <Text style={styles.classementValue}>{getGlobalProperties().nbrPlayersForRanking}</Text> joueurs
              </Text>
              <Text style={styles.classementText}>
                Classement Net : <Text style={styles.classementValue}>{getGlobalProperties().scoresNet}</Text> -
                Rang : <Text style={styles.classementValue}>{getGlobalProperties().rankNet}</Text> /
                <Text style={styles.classementValue}>{getGlobalProperties().nbrPlayersForRanking}</Text> joueurs
              </Text>
            </>
          )}
          {globalJsonObject.isEclectic !== 'isRingerScore' && (
            <Text style={styles.classementText}>
              Classement : B+N : <Text style={styles.classementValue}>{getGlobalProperties().scoreForScores}</Text> -
              Rang : <Text style={styles.classementValue}>{getGlobalProperties().rankBrut}</Text> /
              <Text style={styles.classementValue}>{getGlobalProperties().nbrPlayersForRanking}</Text> joueurs
            </Text>
          )}
        </View>

        {data.cumuls.length > 0 && renderCumuls()}

        {isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : (
          <View style={[styles.tableOuterContainer, { maxHeight: getTableMaxHeight() }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ minWidth: tableMinWidth }}>
                {renderHeader()}
                <ScrollView nestedScrollEnabled style={[styles.scrollView, { maxHeight: getTableMaxHeight() - 60 }]}>
                  {trouRows.map((row, index) => renderScoreRow(row, index))}
                </ScrollView>
                <View style={styles.brutNetContainer}>
                  {renderScoreRow(brutRow, 18)}
                  {renderScoreRow(netRow, 19)}
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.finishButton} onPress={handleEmailScores}>
            <Text style={styles.finishButtonText}>Email scores</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.finishButton]} onPress={handleTerminer}>
            <Text style={styles.finishButtonText}>Terminer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    height: '100%',
    backgroundColor: '#aacdeeff',
  },
  container: {
    flex: 1,
    backgroundColor: '#dee2e6',
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#333',
  },
  dropdownsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: "100%",
  },
  classementContainer: {
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  classementText: {
    fontSize: 14,
    marginBottom: 3,
    color: '#333',
    fontWeight: 'bold',
  },
  classementValue: {
    color: '#e71313',
    fontWeight: 'bold',
  },
  cumulsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  cumulText: {
    fontSize: 12,
    marginBottom: 3,
    color: '#333',
  },
  tableOuterContainer: {
    flex: 1,
    marginBottom: 10,
  },
  scrollView: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#b9d6ee',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 6,
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trouHeader: {
    width: 40,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#98bef7',
    alignItems: 'center',
    minHeight: 30,
  },
  brutNetContainer: {
    borderTopWidth: 2,
    borderTopColor: '#999',
    backgroundColor: '#f3ecec',
  },
  scoreCell: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  trouCell: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#9bc5f8',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 10,
  },
  finishButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  synthesisButton: {
    backgroundColor: '#3498db',
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.5,
    height: 40,
  },
  synthesisButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});

export default MesScores;
