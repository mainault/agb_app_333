import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGlobalJsonObjectForRanking, getGlobalProperties, setGlobalProperty } from '../store/GlobalPropertiesManager';
import { GlobalPlayerRanking, GlobalPlayerRankingRS } from '../store/GlobalStore';
import { sendRequest } from '../utils/api';
import { showAlert } from '../utils/utilities';

const DisplayRanking = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrimestre, setSelectedTrimestre] = useState<string>("tous");
  const [playersData, setPlayersData] = useState<GlobalPlayerRanking[]>([]);
  const [playersDataRS, setPlayersDataRS] = useState<GlobalPlayerRankingRS[]>([]);
  const [trimestres, setTrimestres] = useState<Array<{label: string, value: string}>>([]);
  const [parcoursPars, setParcoursPars] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<GlobalPlayerRanking | GlobalPlayerRankingRS | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const flatListRef = useRef<FlatList<any>>(null);
  const isRingerScore = getGlobalJsonObjectForRanking().isEclectic === "isRingerScore";
  const isEclectic = getGlobalJsonObjectForRanking().isEclectic === "isEclectic" ||
                   getGlobalJsonObjectForRanking().isEclectic === "isEclectic-IS";

  // Initialisation correcte de sortBy en fonction du mode
  const [sortBy, setSortBy] = useState<string>(() => {
    return isRingerScore ? "seriesNet" : "series";
  });

  const fetchDataFromServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      const response = await sendRequest(donnees);
      getServerResponse(response);
    } catch (error) {
      console.error("Erreur dans fetchDataFromServer:", error);
      await showAlert("Erreur", "Problème de connexion.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getServerResponse = (jsonObject: any) => {
    setIsLoading(false);
    if (jsonObject.status === "KO") {
      // Réinitialisation complète des données
      setPlayersData([]);
      setPlayersDataRS([]);
      setTrimestres([]);
      setParcoursPars([]);
      showAlert("Gestion des Erreurs", jsonObject.error);
      // Arrêt immédiat du traitement
      return;
    }

    if (jsonObject.nbrPlayers) {
      setGlobalProperty("nbrPlayersForRanking", jsonObject.nbrPlayers);
    }

    if (jsonObject.nbrTrimestres) {
      const formattedTrimestres = jsonObject.nbrTrimestres.map((item: { trimestre: string }) => ({
        label: item.trimestre,
        value: item.trimestre,
      }));
      setTrimestres([{ label: "Tous", value: "tous" }, ...formattedTrimestres]);
    }

    if (jsonObject.parcoursPars) {
      setParcoursPars(jsonObject.parcoursPars);
      setGlobalProperty("parcoursPars", jsonObject.parcoursPars);
    }

    if (isRingerScore) {
      setPlayersDataRS([...jsonObject.mergedRanking]);
    } else {
      setPlayersData([...jsonObject.mergedRanking]);
    }
  };

  useEffect(() => {
    const donnees = {
      operationType: "getRanking",
      isEclectic: getGlobalJsonObjectForRanking().isEclectic,
      role: isRingerScore ? "user" : "",
      sortOrder: sortBy,
      trimestre: selectedTrimestre === "tous" ? "" : selectedTrimestre,
      isAppMobile: true,
    };
    console.log("Données envoyées au serveur:", donnees);
    fetchDataFromServer(donnees);
  }, [sortBy, selectedTrimestre]);

  const handleFinishPress = async () => {
    await ScreenOrientation.unlockAsync();
    router.replace('/');
  };

  const getCompetitionTitle = () => {
    return `Classement - Nombre de joueurs : ${getGlobalProperties().nbrPlayersForRanking}`;
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleTrimestreChange = (value: string) => {
    setSelectedTrimestre(value);
  };

  const checkIfBreakLine = (item: GlobalPlayerRanking | GlobalPlayerRankingRS): boolean => {
    if (!item) return false;
    return isHtmlContent(item.nom_prenom) ||
           item.nom_prenom.includes("Dames") ||
           item.nom_prenom.includes("Messieurs") ||
           (item as GlobalPlayerRanking).serie?.toLowerCase().includes("série");
  };

  const isHtmlContent = (content: string): boolean => {
    if (!content) return false;
    return content.includes('<') || content.includes('&');
  };

  const extractTextFromHtml = (html: string): string | null => {
    if (!html) return null;
    try {
      const match = html.match(/>([^<]+)</);
      return match ? match[1].trim() : null;
    } catch (error) {
      console.error("Erreur lors de l'extraction du texte HTML:", error);
      return null;
    }
  };

  const renderPlayerContent = (item: GlobalPlayerRanking | GlobalPlayerRankingRS) => {
    const isBreakLine = checkIfBreakLine(item);

    if (isBreakLine) {
      // Pour les lignes de break (catégories), on affiche juste le nom
      return renderPlayerName(item);
    } else {
      // Pour les lignes normales, on affiche nom + série si elle est en HTML
      return (
        <View>
          {renderPlayerName(item)}
          {!isRingerScore && item && 'serie' in item && item.serie && isHtmlContent(item.serie) && (
            <RenderHTML
              contentWidth={130}
              source={{ html: item.serie }}
              baseStyle={styles.serieInPlayerCell}
            />
          )}
        </View>
      );
    }
  };

  const renderPlayerName = (content: GlobalPlayerRanking | GlobalPlayerRankingRS) => {
    // Vérifier si c'est une ligne de break (catégorie)
    const isBreakLine = isHtmlContent(content.nom_prenom) ||
                      content.nom_prenom.includes("Dames") ||
                      content.nom_prenom.includes("Messieurs") ||
                      (content.serie?.toLowerCase().includes("série"));

    // Vérifier si la série est en HTML et doit être affichée dans le nom
    const hasHtmlSerie = content && 'serie' in content && content.serie && isHtmlContent(content.serie);

    if (isBreakLine || hasHtmlSerie) {

      // Pour les lignes de break ou quand la série est en HTML, on combine nom et série
      let htmlContent = content.nom_prenom;

      if (hasHtmlSerie) {
        // Si la série est en HTML, on l'ajoute au nom
        htmlContent = `${content.serie}`;
      }

      return (
        <RenderHTML
          contentWidth={130}
          source={{ html: htmlContent }}
          baseStyle={styles.categorieSerieInPlayerCell}
        />
      );
    } else {
      // Pour les lignes normales, on affiche juste le nom
      return (
        <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
          {content.nom_prenom}
        </Text>
      );
    }
  };


  const renderNormalHeader = () => {
    return (
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.playerCell]}>
          <Text style={styles.headerText}>JOUEUR</Text>
        </Text>
        <View style={[styles.headerCell, styles.infoCell]}>
          <Text style={styles.headerText}> </Text>
        </View>
        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text style={styles.headerText}>BRUT</Text>
        </View>
        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text style={styles.headerText}>NET</Text>
        </View>
        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text style={styles.headerText}>BN</Text>
        </View>
        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text style={styles.headerText}>RANG</Text>
        </View>
      </View>
    );
  };

  const renderRingerScoreHeader = () => {
    return (
      <View style={styles.headerRowRS}>
        <Text style={[styles.headerCellRS, { flex: 3.5 }]}>JOUEUR</Text>
        <View style={[styles.headerCellRS, { flex: 0.4 }]}>
          <Text style={styles.headerTextRS}> </Text>
        </View>
        <Text style={[styles.headerCellRS, { flex: 1 }]}>BRUT</Text>
        <Text style={[styles.headerCellRS, { flex: 1 }]}>NET</Text>
        <View style={[styles.headerCellRS, { flex: 2 }]}>
          <Text style={styles.headerTextRS}>RANG</Text>
          <View style={styles.subHeaderRowRS}>
            <Text style={[styles.subHeaderTextRS, { flex: 1 }]}>BRUT</Text>
            <Text style={[styles.subHeaderTextRS, { flex: 1 }]}>NET</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNormalPlayerRow = ({ item }: { item: GlobalPlayerRanking }) => {
    const isBreakLine = checkIfBreakLine(item);

    return (
      <View style={styles.row}>
        {/* Colonne Joueur avec série en HTML si présente */}
        <View style={[styles.cell, styles.playerCell]}>
          {renderPlayerName(item)}
        </View>

        {/* Bouton d'information ou cellule vide */}
        {isBreakLine ? (
          <View style={[styles.cell, styles.infoCell]}>
            <Text style={styles.emptyCell}></Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.cell, styles.infoCell]}
            onPress={() => {
              setSelectedPlayer(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.infoButton}>ℹ️</Text>
          </TouchableOpacity>
        )}

        {/* Colonnes de résultats (vides pour les lignes de break) */}
        {isBreakLine ? (
          <>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.emptyCell}></Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.emptyCell}></Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.emptyCell}></Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.emptyCell}></Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.scoreText}>{item.brut}</Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.scoreText}>{item.net}</Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.scoreText}>{item.bn}</Text>
            </View>
            <View style={[styles.cell, styles.scoreCell]}>
              <Text style={styles.scoreText}>{item["1"]}</Text>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderPlayerRowRS = ({ item }: { item: GlobalPlayerRankingRS }) => {
    const isBreakLine = isHtmlContent(item.nom_prenom) ||
                      item.nom_prenom.includes("Dames") ||
                      item.nom_prenom.includes("Messieurs") ||
                      item.serie?.toLowerCase()?.includes("série");

    return (
      <View style={styles.rowRS}>
        {/* Colonne Joueur */}
        <View style={[styles.cellRS, { flex: 3.0 }]}>
          {renderPlayerName(item)}
        </View>

        {/* Bouton d'information ou cellule vide (comme dans Eclectic) */}
        {isBreakLine ? (
          <View style={[styles.cellRS, styles.infoCellRS]}>
            <Text style={styles.emptyCell}></Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.cellRS, styles.infoCellRS]}
            onPress={() => {
              setSelectedPlayer(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.infoButton}>ℹ️</Text>
          </TouchableOpacity>
        )}

        {/* Autres colonnes */}
        <Text style={[styles.cellRS, { flex: 1 }]}>{item.brut}</Text>
        <Text style={[styles.cellRS, { flex: 1 }]}>{item.net}</Text>
        <Text style={[styles.cellRS, { flex: 1 }]}>{item.rank_brut}</Text>
        <Text style={[styles.cellRS, { flex: 1 }]}>{item.rank_net}</Text>
      </View>
    )
  };

  const renderPickers = () => {
    const sortOptions = isRingerScore
      ? [
          { label: "Nom", value: "nom" },
          { label: "Brut", value: "brut" },
          { label: "Net", value: "net" },
          { label: "Séries BRUT", value: "seriesBrut" },
          { label: "Séries NET", value: "seriesNet" }
        ]
      : [
          { label: "Séries", value: "series" },
          { label: "Nom", value: "nom" },
          { label: "Score", value: "brut-net" }
        ];

    return (
      <View style={isRingerScore ? styles.pickersRowRS : styles.pickersRow}>
        {!isRingerScore && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Trimestre:</Text>
            <Picker
              selectedValue={selectedTrimestre}
              style={styles.picker}
              onValueChange={handleTrimestreChange}
              enabled={!isLoading}
            >
              {trimestres.map((trimestre) => (
                <Picker.Item
                  key={`trimestre-${trimestre.value}`}
                  label={trimestre.label}
                  value={trimestre.value}
                />
              ))}
            </Picker>
          </View>
        )}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Classé par:</Text>
          <Picker
            selectedValue={sortBy}
            style={styles.picker}
            onValueChange={handleSortChange}
            enabled={!isLoading}
          >
            {sortOptions.map((option) => (
              <Picker.Item
                key={`sort-option-${option.value}`}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  const renderHoleScoresModal = () => {
    if (!selectedPlayer || !modalVisible) return null;

    // Type guard pour vérifier si c'est un joueur RingerScore
    const isRingerScorePlayer = (player: GlobalPlayerRanking | GlobalPlayerRankingRS): player is GlobalPlayerRankingRS => {
      return 'rank_brut' in player;
    };

    // Fonctions utilitaires pour les scores
    const getHoleScores = (item: GlobalPlayerRanking | GlobalPlayerRankingRS): number[] => {
      if (!item) return Array(18).fill(0);
      return item.score ? item.score.split(',').map(score => parseInt(score, 10) || 0) : Array(18).fill(0);
    };

    const getNetHoleScores = (item: GlobalPlayerRanking | GlobalPlayerRankingRS): number[] => {
      if (!item) return Array(18).fill(0);
      return item.score_net ? item.score_net.split(',').map(score => parseInt(score, 10) || 0) : Array(18).fill(0);
    };

    const holeScores = getHoleScores(selectedPlayer);
    const netHoleScores = getNetHoleScores(selectedPlayer);
    const totalScore = holeScores.reduce((sum, score) => sum + score, 0);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isHtmlContent(selectedPlayer.nom_prenom) ? (
                <RenderHTML
                  contentWidth={200}
                  source={{ html: selectedPlayer.nom_prenom }}
                  baseStyle={styles.modalTitleText}
                />
              ) : (
                selectedPlayer.nom_prenom
              )}
              {selectedPlayer && 'serie' in selectedPlayer && selectedPlayer.serie && isHtmlContent(selectedPlayer.serie) && (
                <RenderHTML
                  contentWidth={200}
                  source={{ html: selectedPlayer.serie }}
                  baseStyle={styles.modalSerieText}
                />
              )}
            </Text>

            <View style={styles.modalResultsRow}>
              <Text style={styles.modalResultText}>BRUT: {selectedPlayer.brut}</Text>
              <Text style={styles.modalResultText}>NET: {selectedPlayer.net}</Text>

              {isRingerScore ? (
                <Text style={styles.modalResultText}>
                  RANG: {isRingerScorePlayer(selectedPlayer) ?
                    `${selectedPlayer.rank_brut} / ${selectedPlayer.rank_net}` :
                    (selectedPlayer as GlobalPlayerRanking)["1"]}
                </Text>
              ) : (
                <>
                  <Text style={styles.modalResultText}>BN: {(selectedPlayer as GlobalPlayerRanking).bn}</Text>
                  <Text style={styles.modalResultText}>RANG: {(selectedPlayer as GlobalPlayerRanking)["1"]}</Text>
                </>
              )}
            </View>

            <Text style={styles.modalSubtitle}>Score: ({totalScore} coups joués)</Text>

            <View style={styles.modalHolesHeaderFixed}>
              <Text style={[styles.modalHoleHeaderText, { flex: 1.5 }]}>Trou</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Par</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Score</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Net</Text>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
              {holeScores.map((score: number, index: number) => {
                const par = Array.isArray(parcoursPars) && parcoursPars.length > index ?
                  parseInt(parcoursPars[index], 10) || 0 : 0;
                const isOverPar = score > par;
                return (
                  <View key={`modal-hole-${index}`} style={styles.modalHoleRow}>
                    <Text style={[styles.modalHoleCell, { flex: 1.5 }]}>{index + 1}</Text>
                    <Text style={[styles.modalHoleCell, { flex: 1 }]}>
                      {Array.isArray(parcoursPars) && parcoursPars.length > index ?
                        parcoursPars[index] : 'N/A'}
                    </Text>
                    <Text style={[styles.modalHoleCell, { flex: 1 }]}>{score}</Text>
                    <Text style={[
                      styles.modalHoleCell,
                      { flex: 1 },
                      isOverPar && styles.overParNetScore
                    ]}>
                      {netHoleScores[index]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{getCompetitionTitle()}</Text>
          </View>

          {/* Layout différent selon le mode */}
          {isRingerScore ? (
            <View style={styles.filtersAndButtonsContainerRS}>
              {renderPickers()}
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinishPress}
                disabled={isLoading}
              >
                <Text style={styles.finishButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.filtersContainer}>
                {renderPickers()}
              </View>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={handleFinishPress}
                  disabled={isLoading}
                >
                  <Text style={styles.finishButtonText}>Terminer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.tableContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" style={styles.loadingIndicator} />
          ) : isRingerScore ? (
            <>
              {renderRingerScoreHeader()}
              <FlatList
                ref={flatListRef}
                data={playersDataRS}
                renderItem={renderPlayerRowRS}
                keyExtractor={(item) => `line-${item.numLigne}`}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                updateCellsBatchingPeriod={50}
                windowSize={10}
                removeClippedSubviews={true}
                getItemLayout={(_data, index) => ({
                  length: 40,
                  offset: 40 * index,
                  index
                })}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={true}
              />
            </>
          ) : (
            <>
              {renderNormalHeader()}
              <FlatList
                ref={flatListRef}
                data={playersData}
                renderItem={renderNormalPlayerRow}
                keyExtractor={(item) => `line-${item.numLigne}`}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={true}
              />
            </>
          )}
          {renderHoleScoresModal()}
        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  titleContainer: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
  },
  filtersContainer: {
    marginBottom: 5,
  },
  pickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerContainer: {
    flex: 0.8,
    marginHorizontal: 5,
  },
  pickersRowRS: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
    fontWeight: '500',
  },
  picker: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',

  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  finishButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    paddingHorizontal: 20,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filtersAndButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
    // Layout pour isRingerScore (picker et bouton sur la même ligne)
  filtersAndButtonsContainerRS: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour le tableau normal
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 1,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  playerCell: {
    flex: 2,
    minWidth: '35%',
  },
  infoCell: {
    width: 30,
  },
  scoreCell: {
    flex: 1,
    minWidth: 30,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2c3e50',
  },
  playerName: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,

  },
  scoreText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  infoButton: {
    fontSize: 16,
    color: '#3498db',
  },
  // Styles pour le mode Ringer Score
  headerRowRS: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  headerCellRS: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  headerTextRS: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2c3e50',
  },
  subHeaderRowRS: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
    fontSize: 14,
  },
  subHeaderTextRS: {
    fontSize: 14,
    color: '#555',
  },
  rowRS: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 0,
  },
  cellRS: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    textAlign: 'center',
    fontSize: 12,
  },
  playerNameRS: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  // Styles pour la modale
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  modalResultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalResultText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  modalHolesHeaderFixed: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 5,
  },
  modalHoleHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    flex: 1,
  },
  modalScrollView: {
    maxHeight: 300,
    marginBottom: 10,
  },
  modalHoleRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHoleCell: {
    textAlign: 'center',
    fontSize: 14,
    padding: 5,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  overParNetScore: {
    color: 'red',
    fontWeight: 'bold',
  },
  categorieSerieInPlayerCell: {
    fontSize: 14,
    color: '#fd1818',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  serieText: {
    fontSize: 12,
    color: '#503a2c',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyCell: {
    color: 'transparent',
  },
  serieCell: {
    width: 60,
    minWidth: 60,
    maxWidth: 60,
  },
  serieTextRS: {
    fontSize: 12,
    color: '#503a2c',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  modalSerieText: {
    fontSize: 14,
    color: '#503a2c',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 5,
  },
  serieInPlayerCell: {
    fontSize: 12,
    color: '#503a2c',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Styles pour la colonne d'information dans RingerScore
  infoCellRS: {
    width: 25,
    minWidth: 25,
    maxWidth: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default DisplayRanking;


