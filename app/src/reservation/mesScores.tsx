import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Modal, Platform } from 'react-native';
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

interface ScoreHole {
  hole: number;
  par: number | null;
  score: number | null;
  brut: number | null;
  net: number | null;
}

interface ScoreCard {
  annee: string;
  trimestre: string | null;
  tour: string;
  licence: string;
  nom_prenom: string;
  code_club: string | null;
  nom_parcours: string | null;
  repere: string | null;
  whs_index: string;
  handicap: string;
  totals: {
    score: number | null;
    brut: number | null;
    net: number | null;
  };
  holes: ScoreHole[];
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
  const [scoreCards, setScoreCards] = useState<ScoreCard[]>([]);
  const [selectedScoreCard, setSelectedScoreCard] = useState<ScoreCard | null>(null);
  const { height: windowHeight } = Dimensions.get('window');
  const support = Platform.OS === 'android' ? 'APP_ANDROID' : 'APP_IOS';

  // Initialisation des tableaux vides avec toutes les colonnes
useEffect(() => {

  if (
    globalJsonObject.isEclectic === "isEclectic" ||
    globalJsonObject.isEclectic === "isEclectic-IS" ||
    globalJsonObject.isEclectic === "isRingerScore"
  ) {

    const donnees = {
      operationType:
        globalJsonObject.isEclectic === "isEclectic"
          ? "getUserCurrentQuarterEclecticScores"
          : "getUserSearchEclecticScores",

      CRUD: "list",
      trimestre: "",
      tour: "",
      isEclectic: globalJsonObject.isEclectic,
      licence: globalJsonObject.licence,
      action: "manage",
      isAppMobile: true,
      support: support,
      isMobile: 0,
    };

    setShowSynthesis(true);
    fetchDataFromServer(donnees);
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
    const numberedTours =
      data.usersArray.filter(t => t.tour !== 'S');

    const synthesisData =
      data.usersArray.find(t => t.tour === 'S');

    const hasSynthesis =
      synthesisData !== undefined;

    let allTourNumbers: string[] = [];

    if (globalJsonObject.isEclectic === 'isRingerScore') {
      allTourNumbers = Array.from(
        new Set(numberedTours.map(t => t.tour))
      )
        .filter(tour => /^\d+$/.test(tour))
        .sort((a, b) => Number(a) - Number(b));
    } else {
      allTourNumbers = Array.from(
        { length: 7 },
        (_, i) => (i + 1).toString()
      );
    }

    return {
      allTourNumbers,
      hasSynthesis,
      synthesisData,
      numberedTours
    };
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
        setScoreCards(jsonObject.scoreCards || []);
        setGlobalProperty('nbrPlayersForRanking', jsonObject.nbrPlayers);
        setGlobalProperty('scoreForScores', jsonObject.score[0]);
        setGlobalProperty('rankNet', jsonObject.score[0]);
        setGlobalProperty('scoresBrut', jsonObject.brut);
        setGlobalProperty('scoresNet', jsonObject.net);
        setGlobalProperty('rankBrut', jsonObject.rang[0]);
        if ((jsonObject.scoreCards || []).length > 0) {
          setCodeClub(jsonObject.scoreCards[0].code_club || "");
        } else if (jsonObject.usersArray.length > 0) {
          setCodeClub(jsonObject.usersArray[0].code_club);
        }
        break;
    }
  };

  const fetchSynthesisData = () => {
      const donnees = {
        operationType: globalJsonObject.isEclectic === "isEclectic" && selectedTrimestre === "0" ? "getUserCurrentQuarterEclecticScores" : "getUserSearchEclecticScores",
        CRUD: "list",
        trimestre: selectedTrimestre === '0' ? '' : selectedTrimestre,
        tour:  selectedTour === '0' ? '' : selectedTour, 
        isEclectic: globalJsonObject.isEclectic,
        licence: globalJsonObject.licence,
        isAppMobile: true,
        support: support,
        isMobile: 0,
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

  const openScoreCard = (tour: string) => {
    const card = scoreCards.find(item => item.tour === tour);

    if (card) {
      setSelectedScoreCard(card);
    }
  };

  const getRepereColor = (repere?: string | null): string => {

    switch ((repere || '').toLowerCase()) {

        case 'blanc':
            return '#FFFFFF';

        case 'jaune':
            return '#FFD400';

        case 'bleu':
            return '#0066CC';

        case 'rouge':
            return '#D80000';

        case 'orange':
            return '#F28C00';

        case 'violet':
            return '#7A3DB8';

        case 'vert':
            return '#008000';

        case 'noir':
            return '#000000';

        default:
            return '#B0B0B0';
    }
  };

  const renderScoreCardModal = () => (
    <Modal
      visible={selectedScoreCard !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedScoreCard(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {selectedScoreCard?.tour === 'S'
              ? 'Synthèse'
              : `Tour ${selectedScoreCard?.tour}`}
          </Text>

          <View
              style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 4,
                  marginBottom: 10,
              }}
          >
              <Text style={{ color: '#555', fontSize: 13 }}>
                  {selectedScoreCard?.nom_parcours}
              </Text>

              <View
                  style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: getRepereColor(selectedScoreCard?.repere),
                      borderWidth: 1,
                      borderColor: '#666',
                      marginHorizontal: 6,
                  }}
              />

              <Text style={{ color: '#555', fontSize: 13 }}>
                  {selectedScoreCard?.repere}
              </Text>
          </View>

          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardHeaderCell, styles.cardHoleCell]}>Trou</Text>
            <Text style={styles.cardHeaderCell}>Par</Text>
            <Text style={styles.cardHeaderCell}>Score</Text>
            <Text style={styles.cardHeaderCell}>Brut</Text>
            <Text style={styles.cardHeaderCell}>Net</Text>
          </View>

          <ScrollView style={styles.cardScrollView}>
            {selectedScoreCard?.holes.map((hole) => (
              <View key={`card-hole-${hole.hole}`} style={styles.cardRow}>
                <Text style={[styles.cardCell, styles.cardHoleCell]}>
                  {hole.hole}
                </Text>

                <Text style={styles.cardCell}>
                  {hole.par ?? '—'}
                </Text>

                <Text style={styles.cardCell}>
                  {hole.score ?? '—'}
                </Text>

                <Text style={styles.cardCell}>
                  {hole.brut ?? '—'}
                </Text>

                <View style={styles.cardNetCell}>
                  <Text
                    style={[
                      styles.cardNetText,
                      hole.score !== null &&
                      hole.par !== null &&
                      hole.score > hole.par &&
                      styles.cardNetOverPar,
                      hole.score !== null &&
                      hole.par !== null &&
                      hole.score < hole.par &&
                      styles.cardNetUnderPar
                    ]}
                  >
                    {hole.net ?? '—'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cardTotalsRow}>
            <Text style={[styles.cardTotalsLabel, styles.cardHoleCell]}>
              Total
            </Text>
            <Text style={styles.cardTotalsCell}>—</Text>
            <Text style={styles.cardTotalsCell}>
              {selectedScoreCard?.totals.score ?? '—'}
            </Text>
            <Text style={styles.cardTotalsCell}>
              {selectedScoreCard?.totals.brut ?? '—'}
            </Text>
            <Text style={styles.cardTotalsCell}>
              {selectedScoreCard?.totals.net ?? '—'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setSelectedScoreCard(null)}
          >
            <Text style={styles.finishButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.trouHeader]}>
        Trou
      </Text>

      {allTourNumbers.map((tourNum) => (
        <TouchableOpacity
          key={`header-${tourNum}`}
          style={[styles.headerTouchable, { width: tourColumnWidth }]}
          onPress={() => openScoreCard(tourNum)}
          disabled={!scoreCards.some(card => card.tour === tourNum)}
        >
          <Text style={styles.headerCell}>
            {`T${tourNum}`}
          </Text>
        </TouchableOpacity>
      ))}

      {hasSynthesis && (
        <TouchableOpacity
          key="header-synthesis"
          style={[styles.headerTouchable, { width: tourColumnWidth }]}
          onPress={() => openScoreCard('S')}
          disabled={!scoreCards.some(card => card.tour === 'S')}
        >
          <Text style={styles.headerCell}>S</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderScoreRow = (row: ScoreRow, index: number) => (
    <View key={`row-${index}`} style={styles.scoreRow}>
      <Text style={[styles.scoreCell, styles.trouCell]}>
        {row.trou}
      </Text>

      {allTourNumbers.map((tourNum) => (
        <TouchableOpacity
          key={`cell-${row.trou}-tour${tourNum}`}
          style={[styles.scoreTouchable, { width: tourColumnWidth }]}
          onPress={() => openScoreCard(tourNum)}
          disabled={!scoreCards.some(card => card.tour === tourNum)}
        >
          <Text style={styles.scoreCell}>
            {row[`tour${tourNum}`] || "—"}
          </Text>
        </TouchableOpacity>
      ))}

      {hasSynthesis && (
        <TouchableOpacity
          key={`cell-${row.trou}-synthese`}
          style={[styles.scoreTouchable, { width: tourColumnWidth }]}
          onPress={() => openScoreCard('S')}
          disabled={!scoreCards.some(card => card.tour === 'S')}
        >
          <Text style={styles.scoreCell}>
            {row.synthese || "—"}
          </Text>
        </TouchableOpacity>
      )}
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

  const prepareScoreData = (): {
    trouRows: ScoreRow[];
    brutRow: ScoreRow;
    netRow: ScoreRow;
  } => {
    const trouRows: ScoreRow[] = [];
    const brutRow: ScoreRow = { trou: "BRUT" };
    const netRow: ScoreRow = { trou: "NET" };

    for (let i = 1; i <= 18; i++) {
      const trouKey = `T${i}` as keyof PlayerTour;
      const row: ScoreRow = { trou: `${i}` };

      allTourNumbers.forEach((tourNum) => {
        const tourData = data.usersArray.find(
          item => item.tour === tourNum
        );

        row[`tour${tourNum}`] =
          tourData?.[trouKey] || "—";
      });

      if (hasSynthesis) {
        row.synthese =
          synthesisData?.[trouKey] || "—";
      }

      trouRows.push(row);
    }

    allTourNumbers.forEach((tourNum) => {
      const tourData = data.usersArray.find(
        item => item.tour === tourNum
      );

      brutRow[`tour${tourNum}`] =
        tourData?.brut || "—";

      netRow[`tour${tourNum}`] =
        tourData?.net || "—";
    });

    if (hasSynthesis) {
      brutRow.synthese =
        synthesisData?.brut || "—";

      netRow.synthese =
        synthesisData?.net || "—";
    }

    return {
      trouRows,
      brutRow,
      netRow
    };
  };

  const { trouRows, brutRow, netRow } = prepareScoreData();
  const tourColumnWidth = 45;

  const synthesisColumnCount = globalJsonObject.isEclectic === 'isRingerScore' && hasSynthesis ? 1 : 0;

  const tableMinWidth = 40 + (allTourNumbers.length + synthesisColumnCount) * tourColumnWidth;

  const getTableMaxHeight = () => {
    return windowHeight * 0.7;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Compétitions : {globalJsonObject.isEclectic === 'isEclectic' ? 'ECLECTIC' : globalJsonObject.isEclectic === 'isEclectic-IS' ? 'CHALLENGE HIVER' : 'RINGER SCORE'}
        </Text>

          {globalJsonObject.isEclectic === 'isEclectic' && (
            <View style={styles.dropdownsContainer}>
              <Dropdown
                label="Trimestre"
                selectedValue={selectedTrimestre}
                onValueChange={setSelectedTrimestre}
                options={trimestreOptions}
                placeholder="Sélection..."
                width="30%"
              />

              <Dropdown
                label="Tour"
                selectedValue={selectedTour}
                onValueChange={setSelectedTour}
                options={tourOptions}
                placeholder="Sélection..."
                width="30%"
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
        <Text style={styles.helpText}>
            Touchez l'en-tête d'un tour pour afficher la carte détaillée.
        </Text>
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

        {renderScoreCardModal()}

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
  headerTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
    marginTop: 4,
    marginBottom: 10,
  },
  cardScrollView: {
    maxHeight: 500,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#b9d6ee',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  cardHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    paddingVertical: 7,
    color: '#333',
  },
  cardRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d5e3f5',
  },
  cardCell: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 6,
    color: '#333',
  },
  cardHoleCell: {
    flex: 0.8,
    fontWeight: 'bold',
  },
  cardTotalsRow: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#999',
    backgroundColor: '#f3ecec',
  },
  cardTotalsLabel: {
    textAlign: 'center',
    paddingVertical: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTotalsCell: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    alignSelf: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 12,
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
  },
  helpText: {
    fontSize: 13,
    color: '#080808',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardNetCell: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  },

  cardNetText: {
    textAlign: 'center',
    color: '#333',
    paddingVertical: 4,
  },

  cardNetOverPar: {
    color: '#e71313',
    fontWeight: 'bold',
  },

  cardNetUnderPar: {
    color: 'green',
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: 'green',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 1,
  },
});

export default MesScores;
