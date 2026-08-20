import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CustomHeader from '../components/CustomHeader';
import { sendRequest } from '../utils/api';
import { showAlert } from '../utils/utilities';
import { getGlobalJsonObject } from '../store/GlobalPropertiesManager';


type Carpool = {
  role: 'Conducteur' | 'Passager';
  conducteur: string;
  passagers: string[];
};

type ReservationItem = {
  id: string;
  date: string;
  competition: string;
  competitionClass: string;
  tranche: string;
  periode: string;
  index: number | null;
  repere: string;
  nbrInscrits: number;
  partenaires: string[];
  paidOnline: boolean;
  covoiturage: Carpool | null;
};


export default function MesReservations() {
  const support = Platform.OS === 'android' ? 'APP_ANDROID' : 'APP_IOS';
  const globalJsonObject = getGlobalJsonObject();

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      // Mes réservations
      //=========================================================
      //
      // Délègue l'exploitation des réservations
      // retournées par le backend.
      //
      case "getMyReservations":
        processMyReservations(jsonObject);
        break;
    }
  };

  /**
   * Exploite les réservations d'un joueur
   * retournées par le backend.
   *
   * Cette fonction met à disposition de
   * l'interface la liste des réservations
   * construites par le serveur.
   *
   * Le client ne reconstruit aucune règle
   * métier relative aux réservations, aux
   * équipes, au paiement ou au covoiturage.
   *
   * @param {any} jsonObject
   * Contexte retourné par le backend.
   *
   * @returns {void}
   */
  const processMyReservations = (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      showAlert("Gestion des erreurs", jsonObject.error);
      return;
    }

    setReservations(jsonObject.reservations || []);
  };

  const fetchMyReservations = () => {
    const donnees = {
      operationType: "getMyReservations",
      CRUD: "list",
      licence: globalJsonObject.licence,
      isAppMobile: true,
      support: support,
      isMobile: 1,
    };

    fetchDataFromServer(donnees);
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  function getRepereColor(repere: string): string {
    switch ((repere || '').toLowerCase()) {
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

      case 'orange':
        return '#FFA500';

      default:
        return '#808080';
    }
  }

  function getTranchePeriode(item: ReservationItem): string {
    if( item.tranche.includes("SHOTGUN")) { // Si SHOTGUN pas de période et suppression des caractères '- ' en début du champ item.tranche
      return item.tranche.substring(2);
    }
    if (item.tranche !== "" && item.periode !== "") {
      return item.tranche + " - " + item.periode;
    }

    if (item.tranche !== "") {
      return item.tranche;
    }

    return item.periode;
  }

  function renderPartners(item: ReservationItem) {
    if (!item.partenaires || item.partenaires.length === 0) {
      return null;
    }

    return (
      <View style={styles.optionalBlock}>
        {item.partenaires.map((partner, index) => (
          <View style={styles.detailRow} key={index}>
            <Text style={styles.detailLabel}>
              {index === 0
                ? item.partenaires.length > 1
                  ? "Partenaires"
                  : "Partenaire"
                : ""}
            </Text>

            <Text style={styles.detailValue}>
              {partner}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  function renderCarpool(item: ReservationItem) {
    if (!item.covoiturage) {
      return null;
    }

    const carpool = item.covoiturage;

    return (
      <View style={styles.optionalBlock}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            Covoiturage
          </Text>

          <Text style={styles.detailValue}>
            {carpool.role}
          </Text>
        </View>

        {carpool.role === "Passager" && carpool.conducteur !== "" && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Conducteur
            </Text>

            <Text style={styles.detailValue}>
              {carpool.conducteur}
            </Text>
          </View>
        )}

        {carpool.role === "Conducteur" &&
          carpool.passagers.map((passenger, index) => (
            <View style={styles.detailRow} key={index}>
              <Text style={styles.detailLabel}>
                {index === 0 ? "Passagers" : ""}
              </Text>

              <Text style={styles.detailValue}>
                {passenger}
              </Text>
            </View>
          ))}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CustomHeader showMainMenuButton={true} />

      <View style={styles.container}>
        <Text style={styles.title}>
          Mes réservations
        </Text>

        {!isLoading && reservations.length === 0 && (
          <Text style={styles.emptyText}>
            Aucune réservation en cours
          </Text>
        )}

        <FlatList
          data={reservations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.reservationCard}>
              <View style={styles.competitionHeader}>
                <Text style={styles.date}>
                  {item.date}
                </Text>

                <Text style={styles.competition}>
                  {item.competition}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Classe
                </Text>

                <Text style={styles.detailValue}>
                  {item.competitionClass}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Tranche / période
                </Text>

                <Text style={styles.detailValue}>
                  {getTranchePeriode(item)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Index
                </Text>

                <Text style={styles.detailValue}>
                  {item.index ?? "-"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Repère
                </Text>

                <View style={styles.repereContainer}>
                  <View
                    style={[
                      styles.repereDot,
                      {
                        backgroundColor:
                          getRepereColor(item.repere),
                      },
                    ]}
                  />

                  <Text style={styles.detailValue}>
                    {item.repere}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Payé en ligne
                </Text>

                <Text
                  style={[
                    styles.detailValue,
                    item.paidOnline && { color: "green", fontWeight: "700" },
                  ]}
                >
                  {item.paidOnline ? "OUI" : "NON"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Nombre d'inscrits
                </Text>

                <Text style={styles.detailValue}>
                  {item.nbrInscrits}
                </Text>
              </View>

              {renderPartners(item)}

              {renderCarpool(item)}
            </View>
          )}
        />
        <View style={styles.footer}>
        </View>
      </View>
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

  list: {
    paddingBottom: 30,
  },

  reservationCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#86888a',
  },

  competitionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  date: {
    width: 82,
    fontSize: 14,
    fontWeight: '700',
  },

  competition: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    paddingLeft: 4,
    paddingRight: 2,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },

  detailLabel: {
    width: 145,
    fontSize: 13,
    fontWeight: '600',
  },

  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },

  optionalBlock: {
    marginTop: 8,
  },

  repereContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  repereDot: {
    width: 13,
    height: 13,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#777',
    marginRight: 7,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 30,
  },
  footer: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7db9ea',
    marginHorizontal: -12,
  },

});