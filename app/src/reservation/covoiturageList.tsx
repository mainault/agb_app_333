import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { sendRequest } from "../utils/api";
import { showAlert } from "../utils/utilities";
import { getGlobalJsonObject } from "../store/GlobalPropertiesManager";
import CustomButton from "../components/CustomButton";
import ScreenContainer from "../components/ScreenContainer";


type Passager = {
  id: string;
  nom: string;
};

type Conducteur = {
  id: string;
  nom: string;
  type: "conducteur";
  open?: boolean;
  data?: Passager[];
};

export default function CovoiturageScreen() {
  const params = useLocalSearchParams<{
    menuTitle?: string;
    parentMenuName?: string;
    competitionType?: string;
    competitionName?: string;
  }>();

  const [data, setData] = useState<Conducteur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({ 'quit-btn': true, }); 
  const setButtonState = (id: string, enabled: boolean) => {
    setButtonStates(prev => ({
        ...prev,
        [id]: enabled,
    }));
  };
    
  const toggle = (id: string) => {
    setOpenMap(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchCovoiturages = async () => {
    try {
      setIsLoading(true);
      const donnees = {
        operationType: "getListeCovoiturage",
        isMobile: "1",
        currentCompetition: params.competitionName ?? getGlobalJsonObject()?.nom_competition,
      };
      console.log("donnees envoyées pour getListeCovoiturage :", donnees);
      const response = await sendRequest(donnees);
      getServerResponse(response);
    } catch (error) {
      console.error("Erreur getListeCovoiturage :", error);
      showAlert("Erreur", "Impossible de récupérer la liste des covoiturages.");
    } finally {
      setIsLoading(false);
    }
  };

  const getServerResponse = (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      showAlert("Erreur", jsonObject.error);
      router.replace("/");
      return;
    }

    switch (jsonObject.operationType) {
      case "getListeCovoiturage":
        setData(jsonObject.liste || []);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    fetchCovoiturages();
  }, []);

  const renderConducteur = ({ item }: { item: Conducteur }) => {
  const open = openMap[item.id];
  const passagers = item.data ?? [];

  return (
      <View style={styles.card}>
      <Pressable onPress={() => toggle(item.id)} style={styles.driverRow}>
          <Text style={styles.driverText}>
          {open ? "▼" : "▶"} 🚗 {item.nom}
          </Text>
      </Pressable>

      {open && (
          <View style={styles.passengerContainer}>
          {passagers.length > 0 ? (
              passagers.map(p => (
              <Text key={p.id} style={styles.passengerText}>
                  👤 {p.nom}
              </Text>
              ))
          ) : (
              <Text style={styles.emptyPassengerText}>
              Aucun passager
              </Text>
          )}
          </View>
      )}
      </View>
    );
  };

  return (
    <ScreenContainer showHeader={true}>
      <View style={styles.container}>
        <FlatList
          style={styles.list}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderConducteur}
          ListHeaderComponent={
            <>
              <Text style={styles.header}>Liste des covoiturages</Text>
              <Text style={styles.subHeader}>
                {params.competitionName ?? getGlobalJsonObject()?.nom_competition}
              </Text>
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator size="large" color="#3366ff" />
            ) : (
              <Text style={styles.emptyText}>
                Aucun covoiturage trouvé pour cette compétition.
              </Text>
            )
          }
          contentContainerStyle={styles.listContent}
        />

        {/* FOOTER FIXE */}
        <View style={styles.footer}>
          <CustomButton
            id="quit-btn"
            title="Quitter"
            onPress={() => router.replace("/")}
            buttonStates={buttonStates}
            setButtonState={setButtonState}
          />
        </View>

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3366ff",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 6,
  },
  card: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 8,
    marginLeft: 25,
  },

  driverRow: {
    paddingVertical: 6,
  },

  driverText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3366ff",
  },

  passengerContainer: {
    paddingLeft: 20,
    marginTop: 4,
  },
  passengerText: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "#666",
  },
  emptyPassengerText: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginVertical: 2,
  },
  subHeader: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    color: "#3366ff",
    fontWeight: "bold",
  },
  container: {
    height: "93%",
    backgroundColor: "#dee2e6",

  },
  list: {

  },
  listContent: {

  },
  footer: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dee2e6",
  },
});