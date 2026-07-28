import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { router } from "expo-router";

import { sendRequest } from "../utils/api";
import { showAlert } from "../utils/utilities";

/**
 * Représentation d'une compétition retournée par le backend.
 *
 * Les libellés métier sont préparés par le serveur.
 * Le client mobile se limite à leur affichage.
 */
interface Competition {
    date: string;
    nomCompetition: string;
    sponsor: string;
    formule: string;
    cabaneDisponible: number;
}

/**
 * Écran public de consultation des compétitions déclarées.
 *
 * Le module :
 *
 *     - demande la liste des compétitions au backend ;
 *     - distribue les réponses selon leur operationType ;
 *     - affiche les informations retournées ;
 *     - permet de rafraîchir la liste.
 *
 * Aucune règle métier n'est reconstruite côté client.
 */
export default function CompetitionScreen() {
    const [competitions, setCompetitions] =
        useState<Competition[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    /**
     * Distribue les réponses retournées par le backend.
     *
     * @param jsonObject Réponse JSON retournée par le serveur.
     */
    const getServerResponse = (jsonObject: any) => {
        switch (jsonObject.operationType) {
            case "getPublicCompetitions":
                if (jsonObject.status === "KO") {
                    showAlert(
                        "Gestion des erreurs",
                        jsonObject.error
                    );
                    router.replace("/");
                    break;
                }

                setCompetitions(
                    Array.isArray(jsonObject.competitions)
                        ? jsonObject.competitions
                        : []
                );
                break;

            default:
                console.warn(
                    "Opération serveur non prise en charge :",
                    jsonObject.operationType
                );
                break;
        }
    };

    /**
     * Transmet une requête au backend.
     *
     * Toutes les transactions serveur du module passent par cette
     * fonction.
     *
     * @param donnees Données associées à l'opération demandée.
     */
    const fetchDataFromServer = async (
        donnees: any
    ) => {
        try {
            if (!isRefreshing) {
                setIsLoading(true);
            }

            const response =
                await sendRequest(donnees);

            getServerResponse(response);
        } catch (error: any) {
            console.error(
                "Erreur dans fetchDataFromServer :",
                error
            );

            await showAlert(
                "Erreur",
                "Problème de connexion."
            );
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    /**
     * Demande au backend toutes les compétitions déclarées.
     */
    const getPublicCompetitions = useCallback(() => {
        const donnees = {
            operationType: "getPublicCompetitions",
        };

        fetchDataFromServer(donnees);
    }, []);

    /**
     * Recharge la liste à la demande de l'utilisateur.
     */
    const refreshCompetitions = () => {
        setIsRefreshing(true);

        const donnees = {
            operationType: "getPublicCompetitions",
        };

        fetchDataFromServer(donnees);
    };

    /**
     * Retourne la clé d'affichage d'une compétition.
     */
    const getCompetitionKey = (
        item: Competition,
        index: number
    ) => {
        return `${item.date}-${item.nomCompetition}-${index}`;
    };

    /**
     * Affiche le voyant représentant la disponibilité de la cabane.
     */
    const renderCabaneIndicator = (
        cabaneDisponible: boolean
    ) => {
        return (
            <View
                accessibilityLabel={
                    cabaneDisponible
                        ? "Cabane disponible"
                        : "Cabane indisponible"
                }
                style={[
                    styles.cabaneIndicator,
                    cabaneDisponible
                        ? styles.cabaneDisponible
                        : styles.cabaneIndisponible,
                ]}
            />
        );
    };

    /**
     * Affiche une compétition.
     */
    const renderCompetition = ({
        item,
    }: {
        item: Competition;
    }) => {
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.competitionDate}>
                        {item.date}
                    </Text>

                    {renderCabaneIndicator(
                        item.cabaneDisponible === 1
                    )}
                </View>

                <Text style={styles.competitionName}>
                    {item.nomCompetition}
                </Text>

                <View style={styles.informationLine}>
                    <Text style={styles.informationLabel}>
                        Sponsor
                    </Text>

                    <Text style={styles.informationValue}>
                        {item.sponsor || "—"}
                    </Text>
                </View>

                <View style={styles.informationLine}>
                    <Text style={styles.informationLabel}>
                        Formule
                    </Text>

                    <Text style={styles.informationValue}>
                        {item.formule || "—"}
                    </Text>
                </View>
            </View>
        );
    };

    useEffect(() => {
        getPublicCompetitions();
    }, [getPublicCompetitions]);

    return (
        <View style={styles.container}>
            <View style={styles.competitionHeader}>
                <Text style={styles.competitionTitreTitle}>
                    Compétitions
                </Text>
            </View>

            <View style={styles.competitionHeaderTitle}>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        {renderCabaneIndicator(true)}

                        <Text style={styles.legendText}>
                            Cabane prévue
                        </Text>
                    </View>

                    <View style={styles.legendItem}>
                        {renderCabaneIndicator(false)}

                        <Text style={styles.legendText}>
                            Cabane non prévue
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.listContainer}>
                {isLoading && !isRefreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator
                            size="large"
                            color="#0000ff"
                        />

                        <Text style={styles.loadingText}>
                            Chargement des compétitions…
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={competitions}
                        keyExtractor={getCompetitionKey}
                        renderItem={renderCompetition}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={refreshCompetitions}
                            />
                        }
                        contentContainerStyle={
                            competitions.length === 0
                                ? styles.emptyContainer
                                : styles.listContent
                        }
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                Aucune compétition déclarée.
                            </Text>
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    /*
     * Enveloppe identique à l'écran « Liste des inscrits ».
     * Le flex inférieur à 1 laisse apparaître le pied de page
     * fourni par le layout général de l'application.
     */
    container: {
        marginTop: 40,
        flex: 0.93,
        backgroundColor: "#dee2e6",
    },

    competitionHeader: {
        marginTop: 0,
        padding: 10,
        backgroundColor: "rgb(228, 234, 240)",
        borderBottomWidth: 1,
        borderBottomColor: "#dee2e6",
        minHeight: 44,
    },

    competitionHeaderTitle: {
        paddingVertical: 4,
        minHeight: 42,
        justifyContent: "center",
    },

    competitionTitreTitle: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        color: "#0a7ef1",
    },

    legend: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        columnGap: 18,
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    legendText: {
        marginLeft: 6,
        fontSize: 14,
    },

    listContainer: {
        flex: 1,
        marginTop: 5,
        backgroundColor: "#ecf2f8",
        borderRadius: 1,
        marginHorizontal: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },

    listContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 20,
    },

    loaderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: "#343a40",
    },

    cabaneIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#3f3f3f",
    },

    cabaneDisponible: {
        backgroundColor: "#31a24c",
    },

    cabaneIndisponible: {
        backgroundColor: "#d83b3b",
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 9,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#d8dce2",
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },

    competitionDate: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000000",
    },

    competitionName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 9,
        color: "#000000",
    },

    informationLine: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 3,
    },

    informationLabel: {
        width: 72,
        fontSize: 13,
        fontWeight: "bold",
        color: "#000000",
    },

    informationValue: {
        flex: 1,
        fontSize: 13,
        color: "#000000",
    },

    emptyContainer: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },

    emptyText: {
        fontSize: 16,
        textAlign: "center",
        color: "#6c757d",
    },
});