import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { getGlobalJsonObjectForRanking, getGlobalProperties, setGlobalProperty } from '../store/GlobalPropertiesManager';
import { GlobalPlayerRanking, GlobalPlayerRankingRS } from '../store/GlobalStore';
import { sendRequest } from '../utils/api';
import { showAlert } from '../utils/utilities';
import Dropdown from '../components/dropDown';
import CustomHeader from '../components/CustomHeader';
import CustomFooter from '../components/CustomFooter';


interface ScoreCardHole {
  hole: number;
  par: number;
  score: number;
  brut: number;
  net: number;
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
    score: number;
    brut: number;
    net: number;
  };
  holes: ScoreCardHole[];
}

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
  const [selectedScoreCard, setSelectedScoreCard] = useState<ScoreCard | null>(null);
  const flatListRef = useRef<FlatList<any>>(null);
  const pendingPlayerRef = useRef<GlobalPlayerRanking | GlobalPlayerRankingRS | null>(null);
  const isRingerScore = getGlobalJsonObjectForRanking().isEclectic === "isRingerScore";
  const isEclectic = getGlobalJsonObjectForRanking().isEclectic === "isEclectic" ||
                   getGlobalJsonObjectForRanking().isEclectic === "isEclectic-IS";

  const truncatedPlayersRef = useRef<Set<number>>(new Set());
  const support = Platform.OS === 'android' ? 'APP_ANDROID' : 'APP_IOS';

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

  const getServerResponse = async (jsonObject: any) => {
    setIsLoading(false);
    const operationType = jsonObject.operationType;
    if (jsonObject.status === "KO") {
      if (operationType === "getUserCurrentQuarterEclecticScores") {
        pendingPlayerRef.current = null;
        setSelectedScoreCard(null);
        showAlert("Gestion des Erreurs", jsonObject.error);
        return;
      }
      setPlayersData([]);
      setPlayersDataRS([]);
      setTrimestres([]);
      setParcoursPars([]);
      setSelectedPlayer(null);
      setSelectedScoreCard(null);
      pendingPlayerRef.current = null;
      await showAlert("Gestion des Erreurs", jsonObject.error);
      router.replace('/');
      return;
    }

    switch (operationType) {
      case "getUserCurrentQuarterEclecticScores": {
        const pendingPlayer = pendingPlayerRef.current;
        if (!pendingPlayer) {
          return;
        }
        const scoreCard = (jsonObject.scoreCards ?? []).find(
          (card: ScoreCard) =>
            card.licence === pendingPlayer.licence &&
            card.tour === pendingPlayer.tour
        );
        if (!scoreCard) {
          pendingPlayerRef.current = null;
          setSelectedScoreCard(null);
          showAlert("Carte de score", "La carte de score de ce joueur n’est pas disponible.");
          return;
        }

        setSelectedPlayer(pendingPlayer);
        setSelectedScoreCard(scoreCard);
        setModalVisible(true);
        pendingPlayerRef.current = null;
        break;
      }

      case "getRanking":
        if (jsonObject.nbrPlayers) {
          setGlobalProperty("nbrPlayersForRanking", jsonObject.nbrPlayers);
        }
        if (jsonObject.nbrTrimestres) {
          const formattedTrimestres = jsonObject.nbrTrimestres.map(
            (item: { trimestre: string }) => ({
              label: item.trimestre,
              value: item.trimestre,
            })
          );
          setTrimestres([
            { label: "Tous", value: "tous" },
            ...formattedTrimestres,
          ]);
        }
        if (jsonObject.parcoursPars) {
          setParcoursPars(jsonObject.parcoursPars);
          setGlobalProperty("parcoursPars", jsonObject.parcoursPars);
        }
        if (isRingerScore) {
          setPlayersDataRS([...(jsonObject.mergedRanking ?? [])]);
        } else {
          setPlayersData([...(jsonObject.mergedRanking ?? [])]);
        }
        break;

      default:
        break;
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
      support: support,
      isMobile: 0,
    };
    fetchDataFromServer(donnees);
  }, [sortBy, selectedTrimestre]);

  const getCompetitionTitle = () => {
    const nbrPlayers = Number(getGlobalProperties().nbrPlayersForRanking ?? 0);
    return `Classement - ${nbrPlayers} joueur${nbrPlayers > 1 ? "s" : ""}`;
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

    const isSerieBreak = content.serie?.toLowerCase().includes("série");

    if (isSerieBreak && content.serie) {
      const serieText = extractTextFromHtml(content.serie);

      return (
        <Text
          style={styles.serieBreakText}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {serieText}
        </Text>
      );
    }
    const isCategoryBreak =
      isHtmlContent(content.nom_prenom) ||
      content.nom_prenom.includes("Dames") ||
      content.nom_prenom.includes("Messieurs");

    if (isCategoryBreak) {
      return (
        <RenderHTML
          contentWidth={Dimensions.get('window').width}
          source={{ html: content.nom_prenom }}
          baseStyle={styles.categorieSerieInPlayerCell}
        />
      );
    }

    return (
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          if (truncatedPlayersRef.current.has(content.numLigne)) {
            showAlert("", content.nom_prenom);
          }
        }}
      >
        {/* Mesure dans exactement la même largeur */}
        <Text
          style={[styles.playerName, styles.measurePlayerName]}
          onTextLayout={(event) => {
            if (event.nativeEvent.lines.length > 1) {
              truncatedPlayersRef.current.add(content.numLigne);
            } else {
              truncatedPlayersRef.current.delete(content.numLigne);
            }
          }}
        >
          {content.nom_prenom}
        </Text>

        {/* Affichage réel */}
        <Text
          style={styles.playerName}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {content.nom_prenom}
        </Text>
      </TouchableOpacity>
    );
  };


  const renderNormalHeader = () => {
    return (
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.playerCell]}>
          <Text style={styles.headerText}>JOUEUR</Text>
        </View>
        <View style={[styles.headerCell, styles.infoCell]}>
          <Text style={styles.headerText}> </Text>
        </View>
        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text
            style={styles.headerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            BRUT
          </Text>
        </View>

        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text
            style={styles.headerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            NET
          </Text>
        </View>

        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text
            style={styles.headerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            BN
          </Text>
        </View>

        <View style={[styles.headerCell, styles.scoreCell]}>
          <Text
            style={styles.headerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            RANG
          </Text>
        </View>
      </View>
    );
  };

  const renderRingerScoreHeader = () => {
    return (
      <View style={styles.headerRowRS}>

        <View style={[styles.headerCellRS, { flex: 4.8 }]}>
          <Text
            style={styles.headerTextRS}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            JOUEUR
          </Text>
        </View>

        <View style={[styles.headerCellRS, styles.infoCellRS]} />

        <View style={[styles.headerCellRS, { flex: 1 }]}>
          <Text
            style={[styles.headerTextRS, { fontSize: 13 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            BRUT
          </Text>
        </View>

        <View style={[styles.headerCellRS, { flex: 1 }]}>
          <Text
            style={[styles.headerTextRS, { fontSize: 13 }]}
            numberOfLines={1}
          >
            NET
          </Text>
        </View>

        <View style={[styles.headerCellRS, { flex: 2 }]}>
          <Text style={styles.headerTextRS}>
            RANG
          </Text>

          <View style={styles.subHeaderRowRS}>
            <Text
              style={[styles.subHeaderTextRS, { flex: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              BRUT
            </Text>

            <Text
              style={[styles.subHeaderTextRS, { flex: 1 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              NET
            </Text>
          </View>
        </View>

      </View>
    );
  };

  const handlePlayerInfoPress = (
    item: GlobalPlayerRanking | GlobalPlayerRankingRS
  ) => {
    pendingPlayerRef.current = item;
    setSelectedPlayer(null);
    setSelectedScoreCard(null);

    const donnees = {
      operationType: "getUserCurrentQuarterEclecticScores",
      CRUD: "list",
      isEclectic: getGlobalJsonObjectForRanking().isEclectic,
      licence: item.licence,
      trimestre: selectedTrimestre === "tous" ? "" : selectedTrimestre,
      tour: item.tour,
      isAppMobile: true,
      support: support,
      isMobile: 0,
    };
    fetchDataFromServer(donnees);
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
              onPress={() => handlePlayerInfoPress(item)}
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
              <Text style={styles.scoreText}>
                {sortBy === "series" ? item.index_min : item["1"]}
              </Text>
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
        <View style={[styles.cellRS, { flex: 4.8 }]}>
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
              onPress={() => handlePlayerInfoPress(item)}
          >
              <Text style={styles.infoButton}>ℹ️</Text>
          </TouchableOpacity>
        )}

        {/* Autres colonnes */}
        {isBreakLine ? (
          <>
            <Text style={[styles.cellRS, { flex: 1 }]}></Text>
            <Text style={[styles.cellRS, { flex: 1 }]}></Text>
            <Text style={[styles.cellRS, { flex: 1 }]}></Text>
            <Text style={[styles.cellRS, { flex: 1 }]}></Text>
          </>
        ) : (
          <>
            <Text style={[styles.cellRS, { flex: 1 }]}>{item.brut}</Text>
            <Text style={[styles.cellRS, { flex: 1 }]}>{item.net}</Text>
            <Text style={[styles.cellRS, { flex: 1 }]}>{item.rank_brut}</Text>
            <Text style={[styles.cellRS, { flex: 1 }]}>{item.rank_net}</Text>
          </>
        )}
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

    const screenWidth = Dimensions.get('window').width;
    const dropdownWidth = (screenWidth - 60) / 2;

    return (
      <View style={isRingerScore ? styles.pickersRowRS : styles.pickersRow}>
        {!isRingerScore && (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Trimestre:</Text>
            <Dropdown
              selectedValue={selectedTrimestre}
              onValueChange={handleTrimestreChange}
              options={trimestres}
              placeholder="Trimestre"
              width={dropdownWidth}
              dropdownWidth={dropdownWidth}
              disabled={isLoading}
            />
          </View>
        )}

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Classé par:</Text>
          <Dropdown
            selectedValue={sortBy}
            onValueChange={handleSortChange}
            options={sortOptions}
            placeholder="Classé par"
            width={dropdownWidth}
            dropdownWidth={dropdownWidth}
            disabled={isLoading}
          />
        </View>
      </View>
    );
  };

  const renderHoleScoresModal = () => {
    if (!selectedPlayer || !selectedScoreCard || !modalVisible) return null;

    const isRingerScorePlayer = (
      player: GlobalPlayerRanking | GlobalPlayerRankingRS
    ): player is GlobalPlayerRankingRS => {
      return 'rank_brut' in player;
    };

    const closeModal = () => {
      setModalVisible(false);
      setSelectedPlayer(null);
      setSelectedScoreCard(null);
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
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

              {selectedPlayer &&
                'serie' in selectedPlayer &&
                selectedPlayer.serie &&
                isHtmlContent(selectedPlayer.serie) && (
                  <RenderHTML
                    contentWidth={200}
                    source={{ html: selectedPlayer.serie }}
                    baseStyle={styles.modalSerieText}
                  />
                )}
            </Text>

            <View style={styles.modalResultsRow}>
              <Text style={styles.modalResultText}>
                BRUT: {selectedScoreCard.totals.brut}
              </Text>

              <Text style={styles.modalResultText}>
                NET: {selectedScoreCard.totals.net}
              </Text>

              {isRingerScore ? (
                <Text style={styles.modalResultText}>
                  RANG:{' '}
                  {isRingerScorePlayer(selectedPlayer)
                    ? `${selectedPlayer.rank_brut} / ${selectedPlayer.rank_net}`
                    : (selectedPlayer as GlobalPlayerRanking)['1']}
                </Text>
              ) : (
                <>
                  <Text style={styles.modalResultText}>
                    BN: {(selectedPlayer as GlobalPlayerRanking).bn}
                  </Text>
                  <Text style={styles.modalResultText}>
                    RANG: {(selectedPlayer as GlobalPlayerRanking)['1']}
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.modalSubtitle}>
              Score : ({selectedScoreCard.totals.score} coups joués)
            </Text>

            <View style={styles.modalHolesHeaderFixed}>
              <Text style={[styles.modalHoleHeaderText, { flex: 1.2 }]}>Trou</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Par</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Score</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Brut</Text>
              <Text style={[styles.modalHoleHeaderText, { flex: 1 }]}>Net</Text>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {selectedScoreCard.holes.map((hole) => {
                const isOverPar = hole.score > hole.par;
                const isUnderPar = hole.score < hole.par;

                return (
                  <View
                    key={`modal-hole-${hole.hole}`}
                    style={styles.modalHoleRow}
                  >
                    <Text style={[styles.modalHoleCell, { flex: 1.2 }]}>
                      {hole.hole}
                    </Text>

                    <Text style={[styles.modalHoleCell, { flex: 1 }]}>
                      {hole.par}
                    </Text>

                    <Text style={[styles.modalHoleCell, { flex: 1 }]}>
                      {hole.score}
                    </Text>

                    <Text style={[styles.modalHoleCell, { flex: 1 }]}>
                      {hole.brut}
                    </Text>

                    <View style={[styles.modalHoleNetCell, { flex: 1 }]}>
                      <Text
                        style={[
                          styles.modalHoleNetText,
                          isOverPar && styles.overParNetScore,
                          isUnderPar && styles.underParNetScore,
                        ]}
                      >
                        {hole.net}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.root}>
      <CustomHeader showMainMenuButton={true} />

      <View style={styles.container}>
        <View
          style={[
            styles.header,
            isRingerScore && styles.headerRS
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {getCompetitionTitle()}
            </Text>
          </View>

          <View style={styles.filtersContainer}>
            {renderPickers()}
          </View>
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
      <CustomFooter />
    </View>
  );
};
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#aacdeeff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  titleContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
  },
  filtersContainer: {
    marginBottom: 0,
  },
  pickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  pickerContainer: {
    flex: 1,
  },
  pickersRowRS: {
    flexDirection: 'row',
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
    fontWeight: '500',
  },
  picker: {
    minHeight: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',

  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  flatListContent: {
    paddingBottom: 0,
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
    flex: 3,
    minWidth: '30%',
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
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
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
    color: 'red',
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
  modalHoleNetCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalHoleNetText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#2c3e50',
  },

  underParNetScore: {
    color: 'green',
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: 'green',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRS: {
    paddingBottom: 5,
  },
  serieBreakText: {
    fontSize: 14,
    color: 'blue',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  measurePlayerName: {
    position: 'absolute',
    opacity: 0,
  },
});

export default DisplayRanking;


