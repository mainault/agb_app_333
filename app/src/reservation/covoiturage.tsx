import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from '../components/dropDown';
import CustomButton from '../components/CustomButton';
import { sendRequest } from '../functions/httpRequest';
import { showAlert } from '../utils/utilities';
import { getGlobalCovoiturageObject, getGlobalCovoiturageProperty, getGlobalJsonObject, setGlobalCovoiturageObject } from '../store/GlobalPropertiesManager';
import ScreenContainer from '../components/ScreenContainer';

const { width: screenWidth } = Dimensions.get('window');

const Covoiturage = () => {
    const router = useRouter();

    //paramètres inter-modules
    const params = useLocalSearchParams<{
        name: string;
        subMenuTitle: string;
        parentName: string;
        competitionType: string;
        competitionName: string,
        returnTo: any,
    }>();
    // État pour le type de covoiturage sélectionné
    const [selectedType, setSelectedType] = useState<string>('CONDUCTEUR');
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [playersOptions, setPlayersOptions] = useState([{ label: 'Sélectionnez un joueur', value: '' }]);
    const [isConducteur, setIsConducteur] = useState(false);
    // État pour gérer l'état des boutons
    const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({
        'valider-btn': true,
        'abandonner-btn': true,
    });

    // Fonction pour mettre à jour l'état d'un bouton
    const handleButtonState = (id: string, enabled: boolean) => {
        setButtonStates(prev => ({
            ...prev,
            [id]: enabled,
        }));
    };
    const fetchDataFromServer = async (donnees: any) => {
        try {
            setIsLoading(true);
            const response = await sendRequest(donnees);
            getServerResponse(response);
        } catch (error: any)  {
            console.error("Erreur :", error.message);
            showAlert("Erreur", "Problème de connexion.");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction de dispatch des réponses du serveur
    const getServerResponse = (jsonObject: any) => {
        switch (jsonObject.operationType) {
            case "getCurrentCovoiturage":
                if (jsonObject.status === "KO") {
                    showAlert("Gestion des erreurs", jsonObject.error);
                    router.replace('/');
                    break;
                }
                // Stocker les données globales
                setGlobalCovoiturageObject(jsonObject);
                // Remplir la dropdown avec les joueurs éligibles
                if (jsonObject.usersArray && jsonObject.usersArray.length > 0) {
                    const newPlayersOptions = jsonObject.usersArray.map((user: any) => ({
                        label: `${user.nom.replace(/<[^>]*>/g, '')} - ${user.prenom.replace(/<[^>]*>/g, '')} ${user.tp_short.replace(/<[^>]*>/g, '')}`,
                        value: user.statut + '_' + user.licence
                    }));

                    // Ajouter l'option par défaut
                    setPlayersOptions([
                        { label: 'Sélectionnez un joueur', value: '' },
                        ...newPlayersOptions
                    ]);
                    if (jsonObject.isConducteur) {
                        setIsConducteur(true);
                    }
                } else {
                    // Si aucun joueur n'est disponible, garder juste l'option par défaut
                    setPlayersOptions([{ label: 'Aucun joueur disponible', value: '' }]);
                }
                break;

            case "setCurrentCovoiturage":
                if (jsonObject.status === "KO") {
                    showAlert("Gestion des erreurs", jsonObject.error);
                    router.replace('/');
                    break;
                }
                const donnes = {
                    operationType: "sendCovoiturageMail",
                    nom_competition: jsonObject.nom_competition,
                    isEclectic: 'isAllTypes',
                    licence_source: jsonObject.licence_source,
                    licence_cible: jsonObject.licence_cible,
                    moveFromSource: jsonObject.moveFromSource,
                    moveFromCible: jsonObject.moveFromCible,
                };
                fetchDataFromServer(donnes);
                break;

            case "sendCovoiturageMail":
                // Retour à l'écran précédent avec les paramètres
                showAlert("Information", jsonObject.error);
                if (params.returnTo === 'resa') {
                    router.back();  // Retour simple à l'écran précédent
                }else{
                    router.replace('/');
                }
                break;

            default:
                 showAlert("Information", "Type d'opération non géré : " + jsonObject.operationType);
                break;
        }
    }

    /**
    * Fonction pour trouver un utilisateur dans usersArray par sa licence
    * @param {string} licence - La licence à rechercher
    * @returns {object|null} - L'utilisateur trouvé ou null si non trouvé
    */
    const findUserByLicence = (licence: string): any => {
        const covoiturageData = getGlobalCovoiturageObject();

        // Vérifier si les données existent et si usersArray n'est pas vide
        if (!covoiturageData?.usersArray || covoiturageData.usersArray.length === 0) {
            console.log("Aucun utilisateur disponible dans usersArray");
            return null;
        }

        // Rechercher l'utilisateur par licence
        return covoiturageData.usersArray.find((user: any) =>
            user.licence === licence
        ) || null;
    };


   //Vérifie si une licence existe dans les options de la dropdown
    const isAlreadyExist = (licence: string, dropdownOptions: Array<{ label: string, value: string }>): boolean => {
        // Si la licence est vide ou si les options sont vides, retourner false
        if (!licence || !dropdownOptions || dropdownOptions.length === 0) {
            return false;
        }

        // Parcourir les options pour trouver une correspondance
        return dropdownOptions.some(option =>
            option.value.includes(licence),
        );
    };

    // useEffect pour le chargement initial
    useEffect(() => {
        setIsConducteur(true);
        const donnees = {
            operationType: 'getCurrentCovoiturage',
            nom_competition: params.competitionName,
            isEclectic: 'isAllTypes',
            licence: getGlobalJsonObject().licence,
        };
        fetchDataFromServer(donnees);
    }, []);

    // Gestion du changement de type de covoiturage
    const handleTypeChange = (type: string) => {
        const newIsConducteur = type === "PASSAGER" ? false : true;
        setIsConducteur(newIsConducteur);
        setSelectedType(type);
    };

    //Abandonner
    const handleAbandonner = async () => {
        if( params.returnTo === 'resa'){
            router.back();
        }else{
            router.replace('/');
        }
    };

    // Gestion de la validation
    const handleValider = async () => {
        if (selectedType !== "ANNULATION" && !isConducteur) {
            if (selectedType === "PASSAGER" && playersOptions.length < 2) {
                showAlert("Gestion des erreurs", "Il n'y a pas de conducteur \n dans la liste");
                return;
            }
            if (selectedType === "PASSAGER" && selectedPlayer?.includes(getGlobalJsonObject().licence as any)) {
                showAlert("Erreur", "Vous ne pouvez être \n passager et conducteur à la fois");
                return;
            }
            if (selectedType === "PASSAGER" && !selectedPlayer) {
                showAlert("Gestion des erreurs", "Veuillez sélectionner un conducteur");
                return;
            }
            if (selectedType === "PASSAGER" && !selectedPlayer?.includes("C_")) {
                showAlert("Gestion des erreurs", "Le joueur sélectionné \n n'est pas un conducteur");
                return;
            }
            if (isAlreadyExist(getGlobalJsonObject().licence as any, playersOptions)) {
                showAlert("Gestion des erreurs", "Vous êtes conducteur \n vous ne pouvez pas être passager");
                return;
            }
        }
        const userData = selectedPlayer?.substring(selectedPlayer.indexOf('_') + 1);
        if(userData !== undefined && (isConducteur && (userData != getGlobalJsonObject().licence))){
            showAlert("Gestion des erreurs", "Vous ne pouvez pas être conducteur \n d'un autre conducteur");
            return;
        }
        /*
        if (isConducteur && selectedType !== "ANNULATION") {
            showAlert("Gestion des erreurs", "Il n'y aucune action possible \n dans ce contexte");
            return;
        }
        */
                                   console.log("Selected player for conducteur:", selectedPlayer);
        if (selectedType === "ANNULATION") {
            const choice = await new Promise<boolean>((resolve) => {
                showAlert("Confirmation", "Êtes-vous sûr de vouloir annuler votre participation ?", {
                    buttons: [
                        { text: "Non", onPress: () => resolve(false), style: 'cancel' },
                        { text: "Oui", onPress: () => resolve(true) },
                    ],
                });
            });

            // Si l'utilisateur a choisi "Non", on arrête l'exécution
            if (!choice) {
                return;
            }
            // Si on arrive ici, c'est que l'utilisateur a choisi "Oui"
        }
        // Préparation des données à envoyer
        let user = selectedType === "CONDUCTEUR" ? getGlobalJsonObject().licence : selectedPlayer?.substring(selectedPlayer.indexOf('_') + 1);
        user = selectedType === "ANNULATION" ? getGlobalJsonObject().licence : user;
        const donnees = {
            operationType: "setCurrentCovoiturage",
            nom_competition: params.competitionName,
            isEclectic: getGlobalJsonObject().isEclectic,
            licence_source: getGlobalJsonObject().licence,
            licence_cible: user,
            statut_covoiturage: selectedType.toLowerCase(),
            nom_prenom: getGlobalCovoiturageObject()?.nom_prenom,
            source: params.returnTo,
        };
        
        // Appel au serveur pour sauvegarder le covoiturage
        fetchDataFromServer(donnees);
    };


    return (
        <ScreenContainer showHeader={true}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Gestion du covoiturage</Text>
                {/* Première vue - Sélection du type de covoiturage */}
                <View style={styles.typeSelectionContainer}>
                    <Text style={styles.sectionTitle}>Type de covoiturage</Text>

                    <View style={styles.radioGroup}>
                        {['CONDUCTEUR', 'PASSAGER', 'ANNULATION'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={styles.radioRow}
                                onPress={() => handleTypeChange(type)}
                            >
                                <Text style={styles.radioLabel}>{type}</Text>
                                <View style={[
                                    styles.radioButton,
                                    selectedType === type && styles.selectedRadioButton
                                ]}>
                                    {selectedType === type && <View style={styles.radioButtonInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                {/* Deuxième vue - Sélection du joueur */}
                <View style={styles.playerSelectionContainer}>
                    <Text style={styles.sectionTitle}>Choisissez un conducteur dans la liste</Text>
                    <Text style={styles.departTitle}>Exemple choix horaire : 1D = Tranche 1 Début</Text>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <View style={styles.dropdownContainer}>
                            <Dropdown
                                selectedValue={selectedPlayer || ''}
                                onValueChange={setSelectedPlayer}
                                options={playersOptions}
                                placeholder={playersOptions.length > 1 ? "Choisissez un joueur..." : "Aucun joueur disponible"}
                                width={screenWidth * 0.9} // 90% de la largeur de l'écran
                                dropdownWidth={screenWidth * 0.9} // Même largeur pour le dropdown
                                disabled={isConducteur}
                            />
                        </View>
                    )}
                </View>
                {/* Troisième vue - Boutons d'action */}
                <View style={styles.buttonsContainer}>
                    <CustomButton
                        id="abandonner-btn"
                        title="Abandonner"
                        onPress={handleAbandonner}
                        buttonStates={buttonStates}
                        setButtonState={handleButtonState}
                    />
                    <CustomButton
                        id="valider-btn"
                        title="Valider"
                        onPress={handleValider}
                        buttonStates={buttonStates}
                        setButtonState={handleButtonState}

                    />
                </View>
            </ScrollView>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    departTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    typeSelectionContainer: {
        marginBottom: 30,
    },
    radioGroup: {
        marginVertical: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 5,
        paddingVertical: 5,
        backgroundColor: 'transparent',
        borderRadius: 8,
    },
    radioLabel: {
        fontSize: 16,
        color: '#333',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#726868',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedRadioButton: {
        borderColor: '#767776',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    playerSelectionContainer: {
        marginBottom: 30,
    },
    dropdownContainer: {
        width: '100%',
        alignItems: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 55,
        marginBottom: -25,
    },
});

export default Covoiturage;
