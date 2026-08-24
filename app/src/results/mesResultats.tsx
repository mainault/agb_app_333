import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Platform,
} from 'react-native';

import CustomHeader from '../components/CustomHeader';
import { sendRequest } from '../utils/api';
import { showAlert } from '../utils/utilities';
import { getGlobalJsonObject } from '../store/GlobalPropertiesManager';
import CustomFooter from '../components/CustomFooter';


type CompetitionClass =
  | 'Toutes'
  | 'Standard'
  | 'Eclectic'
  | 'Challenge Hiver'
  | 'Ringer Score';

type SortOrder = 'DESC' | 'ASC';

type ResultFilter =
  | 'Tous'
  | 'Scramble'
  | 'Compte pour l\'index';

type ResultItem = {
  id: string;
  date: string;
  competition: string;
  competitionClass: Exclude<CompetitionClass, 'Toutes'>;
  brut: number;
  net: number;
  sba: number;
  index: number;
  hcp: number;
  repere: string;
  comptePourIndex: boolean;
  formule: string;
};


export default function MesResultats() {
  const support = Platform.OS === 'android' ? 'APP_ANDROID' : 'APP_IOS';
  const globalJsonObject = getGlobalJsonObject();

  const [selectedClass, setSelectedClass] = useState<CompetitionClass>('Toutes');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [selectedFilter, setSelectedFilter] = useState<ResultFilter>('Tous');

  const [classModalVisible, setClassModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const classOptions: CompetitionClass[] = [
    'Toutes',
    'Standard',
    'Eclectic',
    'Challenge Hiver',
    'Ringer Score',
  ];

  const orderOptions: SortOrder[] = [
    'DESC',
    'ASC',
  ];

  const filterOptions: ResultFilter[] = [
    'Tous',
    'Scramble',
    'Compte pour l\'index',
  ];

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

      //=========================================================
      // Mes résultats
      //=========================================================
      //
      // Délègue l'exploitation des résultats
      // retournés par le backend.
      //
      case "getMyResults":
        processMyResults(jsonObject);
        break;
    }
  };

  /**
   * Exploite les résultats d'un joueur retournés par le backend.
   *
   * Cette fonction met à disposition de l'interface la liste
   * des résultats construite par le serveur.
   *
   * Le client ne reconstruit aucune règle métier relative aux
   * compétitions, aux scores ou à leur prise en compte pour
   * l'index.
   *
   * @param {any} jsonObject Contexte retourné par le backend.
   *
   * @returns {void}
   */
  const processMyResults = (jsonObject: any) => {

    if (jsonObject.status === "KO") {
      showAlert("Gestion des erreurs", jsonObject.error);
      return;
    }

    setResults(jsonObject.results || []);
  };

  const fetchMyResults = () => {
    const donnees = {
      operationType: "getMyResults",
      CRUD: "list",
      licence: globalJsonObject.licence,
      isAppMobile: true,
      support: support,
      isMobile: 0,
    };

    fetchDataFromServer(donnees);
  };

  useEffect(() => {
    fetchMyResults();
  }, []);

  const displayedResults = useMemo(() => {
    let filtered = selectedClass === 'Toutes'
      ? results
      : results.filter(item => item.competitionClass === selectedClass);

    if (selectedFilter === 'Scramble') {
      filtered = filtered.filter(item => item.formule.toLowerCase().startsWith('scramble'));
    }

    if (selectedFilter === 'Compte pour l\'index') {
      filtered = filtered.filter(item => item.comptePourIndex === true);
    }

    return [...filtered].sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/').map(Number);
      const [dayB, monthB, yearB] = b.date.split('/').map(Number);

      const dateA = new Date(yearA, monthA - 1, dayA).getTime();
      const dateB = new Date(yearB, monthB - 1, dayB).getTime();

      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });
  }, [results, selectedClass, selectedFilter, sortOrder]);

  function getRepereColor(repere: string): string {
    switch (repere.toLowerCase()) {
      case 'noir':
        return '#000000';

      case 'blanc':
        return '#FFFFFF';

      case 'jaune':
        return '#FFD700';

      case 'bleu':
        return '#0066CC';

      case 'rouge':
        return '#E00000';

      case 'violet':
        return '#800080';

      default:
        return '#808080';
    }
  }

  return (
    <View style={styles.root}>
      <CustomHeader showMainMenuButton={true} />

      <View style={styles.container}>
        <Text style={styles.title}>
          Mes résultats
        </Text>

        <View style={styles.filters}>
          <View style={styles.filter}>
            <Text style={styles.filterLabel}>
              Classe
            </Text>

            <Pressable
              style={styles.fakeDropdown}
              onPress={() => setClassModalVisible(true)}
            >
              <Text style={styles.dropdownValue}>
                {selectedClass}
              </Text>

              <Text>▼</Text>
            </Pressable>
          </View>

          <View style={styles.orderFilter}>
            <Text style={styles.filterLabel}>
              Ordre
            </Text>

            <Pressable
              style={styles.fakeDropdown}
              onPress={() => setOrderModalVisible(true)}
            >
              <Text style={styles.dropdownValue}>
                {sortOrder}
              </Text>

              <Text>▼</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.resultFilterRow}>
            <Text style={styles.resultFilterLabel}>Filtre</Text>

            <Pressable style={styles.resultFilterDropdown} onPress={() => setFilterModalVisible(true)}>
                <Text style={styles.dropdownValue}>{selectedFilter}</Text>
                <Text>▼</Text>
            </Pressable>
        </View>

        <Modal
          visible={classModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setClassModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setClassModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {classOptions.map(option => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedClass(option);
                    setClassModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={orderModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setOrderModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setOrderModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {orderOptions.map(option => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    setSortOrder(option);
                    setOrderModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setFilterModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {filterOptions.map(option => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedFilter(option);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                styles.indexIndicatorYes,
              ]}
            />

            <Text style={styles.legendText}>
              Compte pour l'index
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                styles.indexIndicatorNo,
              ]}
            />

            <Text style={styles.legendText}>
              Ne compte pas pour l'index
            </Text>
          </View>
        </View>

        <FlatList
          data={displayedResults}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.resultCard}>
              <View style={styles.competitionHeader}>
                <View
                  style={[
                    styles.indexDot,
                    {
                      backgroundColor:
                        item.comptePourIndex
                          ? 'green'
                          : 'gray',
                    },
                  ]}
                />

                <Text style={styles.date}>
                  {item.date}
                </Text>

                <Text style={styles.competition}>
                  {item.competition}
                </Text>
              </View>

              <View style={styles.labelsRow}>
                <Text style={styles.cell}>
                  Brut
                </Text>

                <Text style={styles.cell}>
                  Net
                </Text>

                <Text style={styles.cell}>
                  SBA
                </Text>

                <Text style={styles.cell}>
                  Index
                </Text>

                <Text style={styles.cell}>
                  HCP
                </Text>

                <Text style={styles.cell}>
                  Repère
                </Text>
              </View>

              <View style={styles.valuesRow}>
                <Text style={styles.cell}>
                  {item.brut}
                </Text>

                <Text style={styles.cell}>
                  {item.net}
                </Text>

                <Text style={styles.cell}>
                  {item.sba}
                </Text>

                <Text style={styles.cell}>
                  {item.index}
                </Text>

                <Text style={styles.cell}>
                  {item.hcp}
                </Text>

                <View style={styles.cell}>
                  <View
                    style={[
                      styles.repereDot,
                      {
                        backgroundColor:
                          getRepereColor(item.repere),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
        />
      </View>
      <CustomFooter />
    </View>
    
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#aacdeeff',
  },

  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },

  filters: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },

  filter: {
    flex: 1,
  },

  orderFilter: {
    width: 100,
  },

  resultFilter: {
    width: '65%',
  },

  filterLabel: {
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },

  fakeDropdown: {
    height: 38,
    borderWidth: 1,
borderColor: '#909090',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },

  legendText: {
    fontSize: 11,
  },

  list: {
    paddingBottom: 30,
  },

  resultCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#86888a',
  },

  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  date: {
    width: 86,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: '600',
  },

  competition: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: 4,
    paddingRight: 2,
  },

  indexIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },

  indexIndicatorYes: {
    backgroundColor: 'green',
  },

  indexIndicatorNo: {
    backgroundColor: 'gray',
  },

  labelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },

  valuesRow: {
    flexDirection: 'row',
  },

  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  dropdownValue: {
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '75%',
    backgroundColor: '#aacdeeff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',
    overflow: 'hidden',
  },

  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  modalOptionText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

  indexDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },

  repereDot: {
    width: 13,
    height: 13,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#777',
    alignSelf: 'center',
  },

  resultFilterRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
  },

  resultFilterLabel: {
    width: 70,
    fontSize: 14,
    textAlign: 'left',
    marginLeft: 15,
  },

  resultFilterDropdown: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#909090',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },



});