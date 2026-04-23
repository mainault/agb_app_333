import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { getGlobalJsonObject, getGlobalPlayersList, setGlobalPlayersListAll, setGlobalProperty } from '../store/GlobalPropertiesManager';
import { showAlert } from '../utils/utilities';
import { sendRequest } from '../utils/api';

interface Player {
  title: string;
  whs_index: string;
  serie: string;
  cb?: string;
  repere?: string;
  licence?: string;
}

const PlayerSeriesList = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const params = useLocalSearchParams();
  const [initialLoad, setInitialLoad] = useState(false);

  const globalJsonObject = useRef(params.globalJsonObject
    ? JSON.parse(params.globalJsonObject as string)
    : getGlobalJsonObject()).current;

  const fetchDataFromServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      const response = await sendRequest(donnees);
      getServerResponse(response);
    } catch (error) {
      console.error("Erreur dans fetchDataFromServer:", error);
      await showAlert("Erreur", "Problème de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const getServerResponse = (jsonObject: any) => {
    if (jsonObject.operationType === "getCompetitionPlayers") {
      if (jsonObject.status === "KO") {
        showAlert("Gestion des erreurs", jsonObject.message);
        return;
      }
      setGlobalPlayersListAll(jsonObject || []);

      // On ignore la première ligne de données
      const playersList = jsonObject.playersList || [];
      setPlayers(playersList.length > 0 ? playersList.slice(1) : []);
      setGlobalProperty('playersList', playersList);
    }
  };

  useEffect(() => {
    if (initialLoad) return;
    setInitialLoad(true);

    if (!globalJsonObject?.nom_competition) {
      console.error("Données de compétition manquantes");
      return;
    }

    const donnees = {
      accessType: "resa",
      action: "",
      isEclectic: globalJsonObject.isEclectic,
      nom_competition: globalJsonObject.nom_competition,
      operationType: "getCompetitionPlayers"
    };
    fetchDataFromServer(donnees);
  }, []);

  const formatDateCompetition = () => {
    if (!globalJsonObject?.date_competition) return "";
    const day = globalJsonObject.date_competition.slice(0, 2);
    const month = globalJsonObject.date_competition.slice(3, 5);
    const year = globalJsonObject.date_competition.slice(6, 10);
    return `${day}-${month}-${year}`;
  };

  // Fonction pour vérifier si le titre contient du HTML
  const containsHtml = (title: string) => {
    return /<[^>]*>/.test(title);
  };

  // Fonction pour extraire le contenu HTML
  const extractHtmlContent = (title: string) => {
    const regex = />([^<]*)</g;
    const matches = [];
    let match;

    while ((match = regex.exec(title)) !== null) {
      if (match[1].trim()) {
        matches.push(match[1].trim());
      }
    }

    return matches.length > 0 ? matches.join(' ') : null;
  };

  // Fonction pour obtenir la couleur de la pastille selon le repère
  const getRepereColor = (repere?: string) => {
    if (!repere) return 'white';

    const lowerRepere = repere.toLowerCase();
    if (lowerRepere.includes('blanc')) return 'white';
    if (lowerRepere.includes('jaune')) return '#FFD700'; // Or/Jaune
    if (lowerRepere.includes('bleu')) return '#007bff'; // Bleu
    if (lowerRepere.includes('rouge')) return '#dc3545'; // Rouge
    return '#f8f9fa'; // Couleur par défaut (gris clair)
  };

  // Rendu d'une ligne de joueur
  const renderPlayerRow = (item: Player) => {
    const isHtml = containsHtml(item.title);
    const htmlContent = isHtml ? extractHtmlContent(item.title) : null;

    if (isHtml && htmlContent) {
      return (
        <View style={styles.fullWidthHtmlRow}>
          <Text style={htmlContent.includes('--- D') || htmlContent.includes('--- M') || htmlContent.includes('--- F')
             ? styles.fullWidthHtmlTextBold : styles.fullWidthHtmlText} numberOfLines={1} ellipsizeMode="tail">
            {htmlContent}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.playerRow}>
        <View style={styles.playerNameContainer}>
          <Text style={styles.playerText} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
        </View>
        <Text style={styles.indexText}>{item.whs_index}</Text>
        <Text style={styles.serieText}>{item.serie}</Text>
        <View style={styles.repereContainer}>
          {item.repere ? (
            <View style={[
              styles.repereDot,
              { backgroundColor: getRepereColor(item.repere) }
            ]} />
          ) : (
            <Text style={styles.repereText}>-</Text>
          )}
        </View>
      </View>
    );
  };

  // En-tête de la liste
  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.headerText, styles.joueurHeader]}>Joueur</Text>
      <Text style={[styles.headerText, styles.indexHeader]}>Index</Text>
      <Text style={[styles.headerText, styles.serieHeader]}>Série</Text>
      <Text style={[styles.headerText, styles.repereHeader]}>Repère</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.competitionHeader}>
        <Text style={styles.competitionTitreTitle}>Liste des inscrits</Text>
      </View>
      <View style={styles.competitionHeaderTitle}>
        <Text style={styles.competitionTitle}>{globalJsonObject?.nom_competition}
          
        </Text>
        <Text style={styles.nbrPlayersRow}>
          <Text style={styles.dateText}> {formatDateCompetition()}</Text> - 
          <Text style={styles.playersCountText}> {getGlobalPlayersList().nbrPlayers}</Text> <Text style={styles.playersText}> joueurs</Text>
        </Text>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
        ) : (
          <>
            {renderHeader()}
            {players.length > 0 ? (
              <FlatList
                data={players}
                renderItem={({ item }) => renderPlayerRow(item)}
                keyExtractor={(item, index) => `${item.licence || item.whs_index}-${index}`}
              />
            ) : (
              <Text style={styles.emptyText}>Aucun joueur trouvé.</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flex: .93,
    backgroundColor: '#dee2e6',
  },
  competitionHeader: {
    marginTop: 0,
    padding: 10,
    backgroundColor: 'rgb(228, 234, 240)',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    height: 40,
  },
  competitionHeaderTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    height:60,
  },
  competitionTitle: {
    fontSize: 17,
    fontWeight: '600',
    width: "100%",
    textAlign: 'center',
    color: '#0a7ef1',
  },
  competitionTitreTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0a7ef1',
    height: 40,

  },
  listContainer: {
    flex: 1,
    marginTop: 5,
    backgroundColor: '#ecf2f8',
    borderRadius: 1,
    marginHorizontal: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: '#aacdeeff',
  },
  headerText: {
    fontWeight: '600',
    textAlign: 'center',
    color: '#28292b',
    fontSize: 16,
  },
  dateText: {
    color: 'blue',
    fontWeight: '500',
    fontSize: 16,
  },
  nbrPlayersRow: {
    paddingTop: 5,
    flexDirection: 'row',
    textAlign: 'center',
    flex: 1,
  },
  playersCountText: {
    color: '#dc3545',
    fontWeight: '500',
    fontSize: 17,
  },
  playersText: {
    color: '#0a7ef1',
    fontWeight: '500',
    fontSize: 17,
  },
  joueurHeader: {
    flex: 2,
  },
  indexHeader: {
    flex: 1,
  },
  serieHeader: {
    flex: 1,
  },
  repereHeader: {
    flex: 0.8,
  },
  fullWidthHtmlTextBold: {
    color: 'red',
    fontSize: 16,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  fullWidthHtmlRow: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNameContainer: {
    flex: 2,
  },
  playerText: {
    color: '#343a40',
    fontSize: 13,
    fontWeight: '500',
  },
  fullWidthHtmlText: {
    color: 'blue',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: -10,
  },
  indexText: {
    flex: 1,
    textAlign: 'center',
    color: '#343a40',
    fontSize: 13,
    fontWeight: '500',
  },
  serieText: {
    flex: 1,
    textAlign: 'center',
    color: '#343a40',
    fontSize: 13,
    fontWeight: '500',
  },
  repereContainer: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repereDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  repereText: {
    color: '#343a40',
    fontSize: 13,
    fontWeight: '500',
  },
  loader: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#6c757d',
  },
});

export default PlayerSeriesList;
