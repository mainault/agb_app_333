import Constants from 'expo-constants';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { Checkbox, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import CarouselModal from '../components/CarouselModal';
import CustomAlert from '../components/CustomAlert';
import CustomButton from '../components/CustomButton';
import RepasModal from '../components/RepasModal';
import ScreenContainer from '../components/ScreenContainer';

import { WebViewNavigation } from 'react-native-webview';
import {
  getGlobalJsonObject,
  getGlobalOrphanList,
  getGlobalPaymentsList,
  getGlobalPlayersList,
  getGlobalProperties,
  getGlobalResaMember,
  getGlobalReturnResaMember,
  getGlobalUsersList,
  resetGlobalOrphanList,
  resetGlobalResaMember,
  setGlobalCurrentCompetition,
  setGlobalOrphanList,
  setGlobalPaymentsListAll,
  setGlobalPlayersListAll,
  setGlobalProperty,
  setGlobalResaMember,
  setGlobalReturnResaMemberAll,
  setGlobalTeamLeader,
  setGlobalUserOrphanList,
  setGlobalUsersList
} from '../store/GlobalPropertiesManager';
import { OrphanList } from '../store/GlobalStore';
import { PaymentsPlayer, Player } from '../types/playersList';
import { showConfirmAlert } from '../utils/alert';
import { sendRequest } from '../utils/api';
import { showAlert } from '../utils/utilities';

// Fonction utilitaire pour nettoyer le HTML et extraire le texte entre les tirets
const extractPeriodeFromHtml = (htmlString: string): string | null => {
  if (!htmlString) return null;

  try {
    // Supprimer les balises HTML
    const textContent = htmlString.replace(/<[^>]*>/g, "").trim();

    // Extraire la partie entre les tirets (format "--- Début ---")
    const match = textContent.match(/--- (.+) ---/);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Si pas de format --- texte ---, retourner le texte brut
    return textContent;
  } catch (error) {
    console.error("Erreur lors de l'extraction de la période:", error);
    return null;
  }
};

// Interfaces
interface Joueur {
  id: string;
  nom: string;
  repere?: string;
}

interface DropdownItem {
  label: string;
  value: string;
  repere: string;
  licence?: string;
  civilite?: string;
  isOrphaneTeam?: boolean;
  teamInfo?: {
    nbrJoueurs: number;
    nbrJoueursMax: number;
  };
}

interface Option {
  id: number;
  label: string;
  isActive: boolean;
}

interface Tranche {
  id: number;
  title: string;
  isActive: boolean;
  options: Option[];
  selectedOption?: number;
}

interface CustomSearchableDropdownProps {
  index: number;
  disabled: boolean;
  value: string | null;
  selectedRepere: string;
}

interface DropdownsState {
  dropdown_1: boolean;
  dropdown_2: boolean;
  dropdown_3: boolean;
  dropdown_4: boolean;
}

type DropdownKey = keyof DropdownsState;


const RADIO_OPTIONS = [
  { id: "blanc", label: "Blanc" },
  { id: "jaune", label: "Jaune" },
  { id: "bleu", label: "Bleu" },
  { id: "rouge", label: "Rouge" },
];

const ResaScreen = () => {
  const params = useLocalSearchParams<{
    menuTitle: string;
    parentMenuName: string;
    competitionType: string;
    competitionName: string;
    competitionKey: string,
    covoiturageResult?: string; // retour depuis covoiturage
  }>();

  // États
  const [allowClose, setAllowClose] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const dataReceived = useRef(false);
  const [modalRepasVisible, setModalRepasVisible] = useState(false);
  const [isCarouselModalVisible, setIsCarouselModalVisible] = useState(false);
  const [nbrDaysCancelRefunded, setNbrDaysCancelRefunded] = useState<string | null>(null);
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({
    'valider-btn': true,
    'abandonner-btn': true,
    'desinscrire-btn': true,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'succeeded' | 'failed' | null>(null);
  const navigation = useNavigation();
  const [isWaitingCovoiturage, setIsWaitingCovoiturage] = useState(false);
  const covoituragePromiseRef = useRef<{ resolve: (value: boolean) => void } | null>(null);
  const covoiturageResultRef = useRef<((value: boolean) => void) | null>(null);
  const [isPaymentSucceed, setPaymentSucceed] = useState<(Boolean)>(false);
  const [selectedRepere, setSelectedRepere] = useState<string>("blanc");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>([]);
  const initialRender = useRef(true);
  const [disabledDropdowns, setDisabledDropdowns] = useState<DropdownsState>(() => {
    const formule = getGlobalJsonObject().formule;
    const isScramble = formule.includes("Scramble");
    const isNewTeam = !getGlobalProperties().members || getGlobalProperties().members.length === 0;

    if (isScramble && isNewTeam) {
      // Pour une nouvelle équipe Scramble, activer les dropdowns nécessaires
      const maxPlayers = formule.includes("Scramble à 2") ? 2 : 4;
      return {
        dropdown_1: true,   // Désactivée (capitaine)
        dropdown_2: false,  // Activée pour le 2ème joueur
        dropdown_3: maxPlayers >= 3 ? false : true,  // Activée si Scramble à 4
        dropdown_4: maxPlayers >= 4 ? false : true,  // Activée si Scramble à 4
      };
    }
    // Cas par défaut
    return {
      dropdown_1: true,
      dropdown_2: true,
      dropdown_3: true,
      dropdown_4: true,
    };
  });
  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0)
  const paymentProcessing = useRef(false);
  //const [isTransitioning, setIsTransitioning] = useState(false);
  function getDropdownKey(index: number): keyof DropdownsState {
    switch(index) {
      case 0: return 'dropdown_1';
      case 1: return 'dropdown_2';
      case 2: return 'dropdown_3';
      case 3: return 'dropdown_4';
      default: throw new Error(`Index de dropdown invalide: ${index}`);
    }
  }

  // Références
  const searchInputRef = useRef<TextInput>(null);

  // Initialisation des tranches
  const [tranches, setTranches] = useState<Tranche[]>([
    {
      id: 1,
      title: "Tranche 1",
      isActive: true,
      options: [
        { id: 1, label: "Début", isActive: true },
        { id: 2, label: "Milieu", isActive: true },
        { id: 3, label: "Fin", isActive: true },
      ],
      selectedOption: undefined,
    },
    {
      id: 2,
      title: "Tranche 2",
      isActive: false,
      options: [
        { id: 1, label: "Début", isActive: false },
        { id: 2, label: "Milieu", isActive: false },
        { id: 3, label: "Fin", isActive: false },
      ],
      selectedOption: undefined,
    },
    {
      id: 3,
      title: "Tranche 3",
      isActive: false,
      options: [
        { id: 1, label: "Début", isActive: false },
        { id: 2, label: "Milieu", isActive: false },
        { id: 3, label: "Fin", isActive: false },
      ],
      selectedOption: undefined,
    },
  ]);
  const [selectedValues, setSelectedJoueurs] = useState<(string | null)[]>([null, null, null, null]);
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [repasData, setRepasData] = useState<{id: string; nom: string; dejeune: boolean}[]>([]);
  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [paymentsPlayerData, setPaymentsPlayerData] = useState<PaymentsPlayer[]>([]);
  const [resaTeamData, setResaTeamDataState] = useState<any>(null);
  const [resaData, setResaDataState] = useState<any>(null);
  const [resaRecord, setResaRecord] = useState<any>(null);
  const [teamMembersRemoveData, setTeamMembersRemoveData] = useState<any>(null);
  const [joueursSelectionnes, setJoueursSelectionnes] = useState<{
    id: string;
    nom: string;
    civilite: string;
    licence: string;
    repere: string;
  }[]>([]);

  // Fonction pour obtenir les membres de l'équipe depuis getGlobalJsonProperties().members
  const getTeamMembersFromCompetition = (): any[] => {
    const members = getGlobalProperties().members;
    return Array.isArray(members) ? members : [];
  };

  // Fonction pour obtenir les tranches depuis getGlobalJsonObject()
  const getTranchesFromGlobal = (): any[] => {
    const tranches = getGlobalJsonObject().tranche;
    return Array.isArray(tranches) ? tranches : [];
  };

  // Fonction pour vérifier si c'est une nouvelle équipe
  const isNewTeam = () => {
    return !getGlobalProperties().members ||
      getGlobalProperties().members.length === 0 ||
      getGlobalProperties().newTeamResa === true;
  };

  // Fonction pour obtenir la période depuis getGlobalJsonObject()
  const getPeriodeFromGlobal = (): string | null => {
    const periodeHtml = getGlobalJsonObject().periode?.title;
    if (!periodeHtml) return null;
    return extractPeriodeFromHtml(periodeHtml);
  };

  // Fonction pour convertir le texte de période en ID
  const getPeriodeIdFromText = (periodeText: string | null): number | null => {
    if (!periodeText) return null;

    const lowerText = periodeText.toLowerCase();
    if (lowerText.includes('début')) return 1;
    if (lowerText.includes('milieu')) return 2;
    if (lowerText.includes('fin')) return 3;

    return null;
  };

  // Fonction pour trouver une période par ID
  const findPeriodeById = (periodeId: number): { id: number; label: string } | undefined => {
    const options = [
      { id: 1, label: "Début" },
      { id: 2, label: "Milieu" },
      { id: 3, label: "Fin" }
    ];
    return options.find(p => p.id === periodeId);
  };

  // Fonction pour nettoyer le HTML
  const cleanHtml = (htmlString: string): string => {
    if (!htmlString) return "";
    return htmlString.replace(/<[^>]*>/g, "");
  };

  // Fonction pour mettre à jour l'état d'un bouton
  const setButtonState = (id: string, enabled: boolean) => {
    setButtonStates(prev => ({
      ...prev,
      [id]: enabled,
    }));
  };

  // Fonction pour obtenir le repère d'un joueur
  const getPlayerRepere = (licence: string | null): string => {
    if (!licence) return "blanc";

    const allUsersList = getGlobalUsersList().allUsersList || [];
    const user = allUsersList.find((u: any) => u.licence === licence);
    return user?.repere || "blanc";
  };


  // Fonction pour obtenir les données des dropdowns
  const getDropdownData = (index: number): DropdownItem[] => {
    const formule = getGlobalJsonObject().formule;
    const isScramble = formule.includes("Scramble");
    const allUsersList = getGlobalUsersList().allUsersList || [];
    const selectedPlayerIds = selectedValues.filter(Boolean) as string[];
    const teamMembers = getTeamMembersFromCompetition();
    const connectedUserLicence = getGlobalJsonObject().licence;
    const orphanList = getGlobalOrphanList().allOrphanList || [];
    const isIncompleteMode = getGlobalProperties().menuEquipeIncomplete;
    const isTeamIncomplete = getGlobalProperties().isComplete === 'incomplete';
    const isTeamLeader = getGlobalJsonObject().licence === getGlobalProperties().members?.[0]?.licence;
    const isNewTeam = !getGlobalProperties().members || getGlobalProperties().members.length === 0;

    // Item vide par défaut
    const emptyItem: DropdownItem = {
      label: index === 0 ? "Sélectionnez un joueur" : " ",
      value: "",
      repere: "blanc",
      licence: "",
      civilite: ""
    };

    // Cas pour la première dropdown (index 0)
    if (index === 0) {
      // En mode incomplet (parties orphelines), afficher les équipes orphelines
      if (isIncompleteMode) {
        return [
          {
            label: "Sélectionnez une équipe",
            value: "",
            repere: "blanc",
            licence: "",
            civilite: "",
            isOrphaneTeam: false
          },
          ...orphanList.map((orphan: OrphanList) => ({
            label: `${orphan.nom} - ${orphan.prenom}`,
            value: orphan.licence,
            repere: orphan.repere || 'blanc',
            licence: orphan.licence,
            civilite: orphan.civilite || '',
            isOrphaneTeam: true
          }))
        ];
      }

      // Sinon, afficher le joueur connecté (team leader)
      const connectedUser = allUsersList.find((u: any) => u.licence === connectedUserLicence);
      if (connectedUser) {
        return [{
          label: `${connectedUser.nom} - ${connectedUser.prenom}`,
          value: connectedUser.licence,
          repere: connectedUser.repere || 'blanc',
          licence: connectedUser.licence,
          civilite: connectedUser.civilite || ''
        }];
      }
      return [{
        label: `${getGlobalJsonObject().teamLeaderNom || ''} - ${getGlobalJsonObject().teamLeaderPrenom || ''}`.trim() || "Vous",
        value: getGlobalJsonObject().licence as any,
        repere: getGlobalProperties().repere || 'blanc',
        licence: getGlobalJsonObject().licence as any,
        civilite: getGlobalJsonObject().civilite || ''
      }];
    }
    // FIN DU CAS index === 0

    // ===== DEBUT DU CAS index > 0 =====
    else {
      const currentSelection = selectedValues[index];
      const playerItems: DropdownItem[] = [];

      // 1. Ajouter le joueur actuellement sélectionné dans cette dropdown (s'il y en a un)
      if (currentSelection && currentSelection !== "") {
        const user = allUsersList.find((u: any) => u.licence === currentSelection);
        if (user) {
          playerItems.push({
            label: `${user.nom} - ${user.prenom}`,
            value: user.licence,
            repere: user.repere || 'blanc',
            licence: user.licence,
            civilite: user.civilite || ''
          });
        }
      }

      // 2. Ajouter les membres de l'équipe (s'ils ne sont pas déjà sélectionnés ailleurs)
      teamMembers.forEach((member: any) => {
        if (member.licence &&
            member.licence !== currentSelection &&
            member.licence !== connectedUserLicence &&
            !selectedPlayerIds.includes(member.licence)) {
          const user = allUsersList.find((u: any) => u.licence === member.licence);
          if (user) {
            playerItems.push({
              label: `${user.nom} - ${user.prenom}`,
              value: user.licence,
              repere: user.repere || 'blanc',
              licence: user.licence,
              civilite: user.civilite || ''
            });
          }
        }
      });

      // 3. Ajouter tous les joueurs disponibles pour les équipes incomplètes ou nouvelles équipes
      if (isScramble && (isNewTeam || index > 0)) {
        allUsersList.forEach(user => {
          if (user.licence === connectedUserLicence) return;
          if (selectedPlayerIds.includes(user.licence)) return;

          if (!playerItems.some(item => item.value === user.licence)) {
            playerItems.push({
              label: `${user.nom} - ${user.prenom}`,
              value: user.licence,
              repere: user.repere || 'blanc',
              licence: user.licence,
              civilite: user.civilite || ''
            });
          }
        });
      }

      // Cas spécial : Nouvelle équipe ou team leader complétant son équipe
      if (isNewTeam || (isTeamIncomplete && isTeamLeader)) {
        allUsersList.forEach(user => {
          if (user.licence === connectedUserLicence) return;
          if (selectedPlayerIds.includes(user.licence)) return;

          // Vérifier que le joueur n'est pas déjà dans playerItems
          if (!playerItems.some(item => item.value === user.licence)) {
            playerItems.push({
              label: `${user.nom} - ${user.prenom}`,
              value: user.licence,
              repere: user.repere || 'blanc',
              licence: user.licence,
              civilite: user.civilite || ''
            });
          }
        });
      }
      // Cas normal : Équipe existante complète
      else {
        // Ajouter seulement les joueurs qui pourraient remplacer le joueur actuel
        allUsersList.forEach(user => {
          if (user.licence === connectedUserLicence) return;
          if (user.licence === currentSelection) return; // Pas besoin de se proposer soi-même
          if (!playerItems.some(item => item.value === user.licence)) {
            playerItems.push({
              label: `${user.nom} - ${user.prenom}`,
              value: user.licence,
              repere: user.repere || 'blanc',
              licence: user.licence,
              civilite: user.civilite || ''
            });
          }
        });
      }

      // Retourner la liste avec un item vide en premier
      return [emptyItem, ...playerItems];
    }
    // ===== FIN DU CAS index > 0 =====
  };



  // Fonction pour configurer les dropdowns en fonction de la formule
  const configureDropdownsBasedOnFormule = () => {
    const formule = getGlobalJsonObject().formule;
    const members = getGlobalProperties().members || [];
    const isIncompleteMode = getGlobalProperties().menuEquipeIncomplete;
    const isTeamIncomplete = getGlobalProperties().isComplete === 'incomplete';
    const isTeamLeader = getGlobalJsonObject().licence === getGlobalProperties().members?.[0]?.licence;
    const isScramble = formule.includes("Scramble");
    const isNewTeam = !getGlobalProperties().members || getGlobalProperties().members.length === 0;

    let dropdowns: DropdownsState = {
      dropdown_1: true,   // Désactivée par défaut pour le capitaine
      dropdown_2: true,   // Désactivée par défaut
      dropdown_3: true,   // Désactivée par défaut
      dropdown_4: true,   // Désactivée par défaut
    };

    if (isScramble) {
      const maxPlayers = formule.includes("Scramble à 2") ? 2 : 4;

      if (isIncompleteMode) {
        dropdowns = {
          dropdown_1: false,  // Activée pour sélectionner une équipe
          dropdown_2: true,   // Désactivée
          dropdown_3: true,   // Désactivée
          dropdown_4: true,   // Désactivée
        };
      }
      else if (isNewTeam) {
        dropdowns = {
          dropdown_1: true,   // Désactivée (capitaine)
          dropdown_2: false,  // Activée pour ajouter le 2ème joueur
          dropdown_3: maxPlayers >= 3 ? false : true,  // Activée si Scramble à 4
          dropdown_4: maxPlayers >= 4 ? false : true,  // Activée si Scramble à 4
        };
      }
      else if (isTeamIncomplete && isTeamLeader) {
        dropdowns = {
          dropdown_1: true,  // Toujours désactivée (team leader)
          dropdown_2: dropdowns.dropdown_2 === true && (getGlobalProperties().formule.includes("2") && getGlobalProperties().members.length < 2)  ? false : true, 
          dropdown_3: dropdowns.dropdown_3 === false && (getGlobalProperties().formule.includes("3") && getGlobalProperties().members.length < 3)  ? false : true, 
          dropdown_4: dropdowns.dropdown_4 === false && (getGlobalProperties().formule.includes("4") && getGlobalProperties().members.length < 4)  ? false : true, 
        };
      }
      else if (isTeamLeader) {
        // Si c'est le capitaine, activer les dropdowns des membres pour permettre la désinscription
        dropdowns = {
          dropdown_1: true,  // Désactivée (capitaine)
          dropdown_2: members.length > 1 ? false : true,  // Activée si le 2ème joueur existe
          dropdown_3: members.length > 2 ? false : true,  // Activée si le 3ème joueur existe
          dropdown_4: members.length > 3 ? false : true,  // Activée si le 4ème joueur existe
        };
      }
      else {
        dropdowns = {
          dropdown_1: true,
          dropdown_2: true,
          dropdown_3: true,
          dropdown_4: true,
        };
      }
    }
    setDisabledDropdowns(dropdowns);
  };


  // Fonction pour initialiser les dropdowns avec les joueurs déjà inscrits
  const initializeTeamMembers = () => {
    const allUsersList = getGlobalUsersList().allUsersList || [];
    const teamMembers = getTeamMembersFromCompetition();
    const newSelectedValues = ["", "", "", ""];
    // Si c'est une partie standard (1 joueur), on prend le team leader
    if (!teamMembers.length || !getGlobalJsonObject().formule.includes("Scramble")) {
      const connectedUser: any = allUsersList.find((u: any) => u.licence === getGlobalJsonObject().licence);
      const nomPrenom = connectedUser.nom + ' - ' + connectedUser.prenom;
      if (connectedUser) {
        newSelectedValues[0] = connectedUser.licence;
        setJoueursSelectionnes([{
          id: connectedUser.licence,
          nom: nomPrenom,
          civilite: connectedUser.civilite || '',
          licence: connectedUser.licence,
          repere: connectedUser.repere || 'blanc'
        }]);
      }
    } else {
      // Cas Scramble : on prend les membres de l'équipe
      const newJoueursSelectionnes = teamMembers.map((member: any) => {
        const user: any = allUsersList.find((u: any) => u.licence === member.licence);
        const nomPrenom = user.nom + ' - ' + user.prenom;
        return {
          id: member.licence,
          nom: nomPrenom,
          civilite: user?.civilite || '',
          licence: member.licence,
          repere: user?.repere || 'blanc'
        };
      });
      setJoueursSelectionnes(newJoueursSelectionnes);
      teamMembers.forEach((member: any, index: number) => {
        if (index < 4 && member?.licence) {
          newSelectedValues[index] = member.licence;
        }
      });
    }

    setSelectedJoueurs(newSelectedValues);
  };

  // Fonction pour trouver une tranche par ID
  const findTrancheById = (trancheId: number): any | undefined => {
    try {
      const globalTranches = getTranchesFromGlobal();
      if (!Array.isArray(globalTranches)) {
        console.warn("getTranchesFromGlobal() n'a pas retourné un tableau valide");
        return undefined;
      }
      return globalTranches.find((t: any) => t.id == trancheId);
    } catch (error) {
      console.error("Erreur dans findTrancheById:", error);
      return undefined;
    }
  };

  // Fonction displayResaManagement
  const displayResaManagement = (jsonObject: any) => {
    setGlobalProperty('repere', getPlayerRepere(getGlobalJsonObject().licence));
    setGlobalProperty('isPEL', getGlobalJsonObject().isPEL_enabled);
    setGlobalProperty('newTeamManagement', true);
    setSelectedRepere(getGlobalProperties().repere || 'blanc');
    const formule = getGlobalJsonObject().formule;
    const isScramble = formule.includes("Scramble");
    // Mettre à jour selectedValues avec la licence du capitaine
    if (jsonObject.identMember && jsonObject.identMember.licence) {
      const newSelectedValues = [...selectedValues];
      newSelectedValues[0] = jsonObject.identMember.licence; // Mettre à jour avec la licence du capitaine
      setSelectedJoueurs(newSelectedValues);
    }

    // Initialiser les dropdowns avec les joueurs déjà inscrits
    initializeTeamMembers();

    // Configurer les dropdowns
    configureDropdownsBasedOnFormule();
    // Récupération des données de période et tranche
    const periodeText = getPeriodeFromGlobal();
    const trancheId = getGlobalJsonObject().tranche?.id;
    const trancheTitle = getGlobalJsonObject().tranche?.title;
    const donnees = {
      operationType: "getTranches",
      isEclectic: getGlobalJsonObject().isEclectic,
      nom_competition: getGlobalJsonObject().nom_competition,
      isMassResaAccess: getGlobalProperties().isMassResaAccess,
      isActionForCompetitionTerminated: getGlobalProperties().isActionForCompetitionTerminated
    };
    fetchDataFromServer(donnees);
  };

  // Gestion de la sélection des périodes
  const setTranchePeriode = (trancheId: any, optionId: number) => {
    if (getGlobalProperties().shotgun) return;

    setTranches(prevTranches =>
      prevTranches.map(tranche => {
        if (tranche.id === trancheId) {
          return {
            ...tranche,
            selectedOption: optionId
            
          };
        }
        return {
          ...tranche,
          selectedOption: undefined
        };
      })
    );
    const periode = findPeriodeById(optionId);
    if (periode) {
      setGlobalProperty('numTranche', trancheId);
      setGlobalProperty('labelPeriode', periode.label);
    } else {
      console.warn(`Période avec ID ${optionId} non trouvée`);
    }
  };

  // Fonction pour ouvrir la modal de dropdown
  const openDropdownModal = (index: number) => {
    const formule = getGlobalJsonObject().formule;
    const menuEquipeIncomplete = getGlobalProperties().menuEquipeIncomplete;
    const dropdownKey = getDropdownKey(index);
    // Ne pas bloquer l'ouverture de la première dropdown en mode incomplet
    if (disabledDropdowns[dropdownKey] && !(menuEquipeIncomplete && index === 0)) {
      return;
    }

    const dropdownItems = getDropdownData(index);
    setFilteredItems(dropdownItems);
    setActiveDropdownIndex(index);
    setSearchText('');
    setDropdownModalVisible(true);
  };


  // Fonction pour fermer la modal de dropdown
  const closeDropdownModal = () => {
    Keyboard.dismiss();
    setDropdownModalVisible(false);
  };

  // Fonction pour filtrer les items
  const filterItems = (text: string) => {
    setSearchText(text);
    if (!activeDropdownIndex) return;

    const dropdownItems = getDropdownData(activeDropdownIndex);
    if (text.trim() === '') {
      setFilteredItems(dropdownItems);
    } else {
      setFilteredItems(
        dropdownItems.filter(item =>
          item.label.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  // Composant personnalisé pour les dropdowns
  const CustomSearchableDropdown = React.memo(({ index, disabled, value, selectedRepere }: CustomSearchableDropdownProps) => {
    const formule = getGlobalJsonObject().formule;
    const menuEquipeIncomplete = getGlobalProperties().menuEquipeIncomplete;
    const dropdownKey = getDropdownKey(index);
    const isDisabled = disabledDropdowns[dropdownKey] && !(menuEquipeIncomplete && index === 0);

    const getSelectedLabel = () => {
      if (menuEquipeIncomplete && index === 0) {
        if (!value) return "Sélectionnez une équipe";
        const orphanList = getGlobalOrphanList().allOrphanList || [];
        const selectedOrphan = orphanList.find(orphan => orphan.licence === value);
        if (selectedOrphan) return `${selectedOrphan.nom} - ${selectedOrphan.prenom}`;
        return "Équipe sélectionnée";
      }

      if (!value && index === 0) {
        return `${getGlobalJsonObject().teamLeaderNom || ''} - ${getGlobalJsonObject().teamLeaderPrenom || ''}`.trim() || "Vous";
      }
      if (!value) return "Sélectionnez un joueur...";

      const allUsersList = getGlobalUsersList().allUsersList || [];
      const user = allUsersList.find((u: any) => u.licence === value);
      return user ? `${user.nom} - ${user.prenom}` : "Joueur inconnu";
    };

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[
            styles.dropdown,
            isDisabled && styles.disabledDropdown,
            index === 0 && styles.connectedPlayerDropdown,
            value && styles.selectedDropdown,
          ]}
          disabled={isDisabled}
          onPress={() => {
            if (!isDisabled) {
              openDropdownModal(index);
            }
          }}
        >
          <Text style={value ? styles.selectedTextStyle : styles.placeholderStyle}>
            {getSelectedLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    );
  });





  // Modal pour les dropdowns
  const DropdownModal = () => {
    if (!dropdownModalVisible || activeDropdownIndex === null) return null;
      return (
        <Modal
          visible={dropdownModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeDropdownModal}
        >
          <TouchableWithoutFeedback onPress={closeDropdownModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.dropdownModalContainer}>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Rechercher un joueur..."
                    value={searchText}
                    onChangeText={filterItems}
                    autoFocus={true}
                  />
                  <FlatList
                    data={filteredItems}
                    keyExtractor={(item, idx) => idx.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          selectedValues[activeDropdownIndex!] === item.value && styles.selectedItem
                        ]}
                        onPress={() => {
                          handleDropDownChange(activeDropdownIndex!, item.value);
                          closeDropdownModal();
                        }}
                      >
                        <View style={styles.playerItemContainer}>
                          <Text style={styles.itemText}>{item.label}</Text>
                          <View style={[styles.playerRepereIndicatorModal, {
                            backgroundColor: item.repere === "blanc" ? "#FFFFFF" :
                                          item.repere === "jaune" ? "#FFFF00" :
                                          item.repere === "bleu" ? "#0000FF" :
                                          "#FF0000",
                            borderColor: "#000000",
                          }]}>
                            <Text style={{
                              color: item.repere === "blanc" || item.repere === "jaune" ? "#000000" : "#FFFFFF",
                              fontSize: 10,
                              fontWeight: 'bold'
                            }}>
                              {item.repere.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      );
  };


  // Fonction fetchDataFromServer
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

  // Fonction getServerResponse
  const getServerResponse = (jsonObject: any) => {
    setIsLoading(false);
    switch(jsonObject.operationType) {
      case "getCurrentCompetition":
        if (jsonObject.status === "KO") {
          showAlert("Gestion des erreurs",jsonObject.error);
          router.replace('/');
          break;
        }
        setGlobalCurrentCompetition(jsonObject);
        displayCBPayment();
        break;
      case "getOrphanList":
        if (jsonObject.status === "KO") {
          showAlert("Gestion des erreurs",jsonObject.error);
          router.replace('/');
          break;
        }
        getOrphanList(jsonObject);
        break;
      case "getResaMember":
        getResaMember(jsonObject);
        break;

      case "getTranches":
        setTranchesManagement(jsonObject);
        break;

      case "setResaMember":
        setResaMember(jsonObject);
        break;

      case 'sendResaMail':
        sendResaMail(jsonObject);
        break;

      case 'getCompetitionPlayers':
        getCompetitionPlayers(jsonObject);
        break;

      case 'removeResaUser':
        getRemoveResaUser(jsonObject);
        break;

      case "cbPaymentInitPayment":
        if (jsonObject.status === "KO") {
          showAlert(jsonObject.error, "OK");
          break;
        }
        // Ouvrir l'URL de paiement
        setPaymentUrl(jsonObject.redirectUrl); 
        break;

      case "validateTeamLeader":
        validateTeamLeader(jsonObject);
        break;

      case "setMassResaTeam":
        setMassResaTeam(jsonObject);
        break;
        
      case "sendTeamResaMail":
        if (jsonObject.status === "KO") {
          showAlert(jsonObject.error, "OK");
          break;
        }
        if(getGlobalProperties().sous_menu === "desinscription"){
          router.replace("/");
          break;
        } 
        const dataForPlayersList = {
          operationType: 'getCompetitionPlayers',
          isEclectic: getGlobalJsonObject().isEclectic,
          nom_competition: getGlobalJsonObject().nom_competition,
          action: 'displayList',
          isFromCBReturn: getGlobalJsonObject().isPEL_enabled ? true : false,
          accessType: 'resa',
        };
        fetchDataFromServer(dataForPlayersList);
        break;

        case "sendTeamResaMailRemoveMember":
          if (jsonObject.status === "KO") {
            showAlert(jsonObject.error, "OK");
          }
          break;
          
        default:
        break;
    }
  };

  // Fonction getResaMember
  const getResaMember = (jsonObject: any) => {
    setGlobalProperty('shotgun', jsonObject.duree_trou == '0');
    if(jsonObject.status === "KO") {
      setGlobalProperty('tranche_duree', jsonObject.tranche_duree);
      setGlobalProperty('duree_trou', parseInt(jsonObject.duree_trou));
      setGlobalProperty('nbre_joueurs', jsonObject.nbre_joueurs);
      calculateJauge();
    }
    setGlobalProperty('validateTeamLeaderObject', null);
    if (jsonObject.status === "OK") {
      setGlobalProperty('validateTeamLeaderObject', jsonObject);
    }
    resetGlobalResaMember();
    setGlobalResaMember(jsonObject);
    if(params.menuTitle === "desinscription") {
      showConfirmAlert({
        title: "Suppression",
        message: "Vous êtes sur le point de vous désinscrire ?",
        onConfirm: () => { router.replace("/"); },
        onCancel: () => {},
      });
    }
    const usersArray = jsonObject.usersArray || [];
    setGlobalUsersList(usersArray); // Passez le tableau d'utilisateurs
    // Mettre à jour le repère du joueur
    setGlobalProperty('licence', getGlobalJsonObject().licence);
    setGlobalProperty('teamLeaderNomPrenom', getGlobalJsonObject().teamLeaderNom + ' - ' + getGlobalJsonObject().teamLeaderPrenom);
    if(jsonObject.identMember){
      setGlobalProperty('repere', jsonObject.identMember[0].repere);
    }else{
      setGlobalProperty('repere', jsonObject.repere);
    }
    displayResaManagement(jsonObject);
  };

  // Fonction pour récupérer la liste des parties incomplètes
  const getOrphanList = (jsonObject: any) => {
    const orphanList = jsonObject.orphanList || [];
    resetGlobalOrphanList();
    setGlobalOrphanList(orphanList);
    setGlobalUserOrphanList(jsonObject.user);

    // Rafraîchir les données de la première dropdown
    const dropdownItems = getDropdownData(0);
    setFilteredItems(dropdownItems);

    // Reconfigurer les dropdowns pour s'assurer que la première est activée en mode incomplet
    configureDropdownsBasedOnFormule();
  };


  // Fonction pour gérer le changement de dropdown
  const handleDropDownChange = (index: number, value: string | null) => {
    const newSelectedValues = [...selectedValues];
    newSelectedValues[index] = value;
    setSelectedJoueurs(newSelectedValues);

    // Vérifiez que vous êtes bien en mode incomplet et que c'est la première dropdown
    if (index === 0 && value && getGlobalProperties().menuEquipeIncomplete) {
      const dropdownItems = getDropdownData(index);
      const selectedItem = dropdownItems.find(item => item.value === value);

      if (selectedItem?.isOrphaneTeam) {
        setIsLoading(true);
        const donnees = {
          operationType: "validateTeamLeader",
          licence: value,
          nom_competition: getGlobalJsonObject().nom_competition,
          isMobile: "1",
          isEclectic: getGlobalJsonObject().isEclectic,
        };
        fetchDataFromServer(donnees);
      } else {
      }
    } else {
    }
  };

  // Fonction validateTeamLeader
  const validateTeamLeader = async (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      await showAlert("Gestion des erreurs", jsonObject.error);
      return;
    }
    if (jsonObject.newTeamMember === "NO" && jsonObject.newTeamLeader === "YES") {
      await showAlert("Gestion des erreurs", jsonObject.teamLeaderNomPrenom + " \nest déjà dans une équipe");
      return;
    }

    // Mettre à jour les propriétés globales
    setGlobalProperty('newTeamResa', jsonObject.newTeamLeader === "YES");
    setGlobalTeamLeader(jsonObject);

    const isIncompleteMode = getGlobalProperties().menuEquipeIncomplete;

    // Mettre à jour les membres dans GlobalProperties
    if (jsonObject.identMember && Array.isArray(jsonObject.identMember)) {
      
      let updatedMembers = [...jsonObject.identMember];

      // Si on est en mode incomplet, ajouter le joueur connecté à la liste des membres
      if (isIncompleteMode) {
        const allUsersList = getGlobalUsersList().allUsersList || [];
        const connectedUserLicence = getGlobalJsonObject().licence;
        const connectedUserAlreadyInTeam = updatedMembers.some(member => member.licence === connectedUserLicence);
        // Si le joueur connecté n'est pas déjà dans l'équipe, l'ajouter
        if (!connectedUserAlreadyInTeam) {
          
          const connectedUser = allUsersList.find((u: any) => u.licence === connectedUserLicence);
          if (connectedUser) {
            updatedMembers.push({
              licence: connectedUser.licence,
              nom: connectedUser.nom,
              prenom: connectedUser.prenom,
              repere: connectedUser.repere,
              civilite: connectedUser.civilite
            });
          }
        }
        setGlobalProperty('members', updatedMembers);
      } else {
        setGlobalProperty('members', jsonObject.identMember);
      }

    }

    if (isIncompleteMode) {
      // Mode partie incomplète : on rejoint une équipe orpheline
      // Mettre à jour selectedValues avec la licence du capitaine
      const newSelectedValues = [...selectedValues];
      newSelectedValues[0] = jsonObject.identMember[0].licence; // Mettre à jour avec la licence du capitaine
      setSelectedJoueurs(newSelectedValues);

      // Désactiver le mode incomplet
      setGlobalProperty('menuEquipeIncomplete', false);
      setGlobalProperty('isComplete', 'complete');
      // Désactiver toutes les dropdowns sauf la première
      setDisabledDropdowns({
        dropdown_1: true,  // Désactivée (équipe sélectionnée)
        dropdown_2: true,   // Désactivée
        dropdown_3: true,   // Désactivée
        dropdown_4: true,   // Désactivée
      });

      // Mettre à jour les dropdowns pour refléter les membres de l'équipe
      const updatedMembers = getGlobalProperties().members;
      if (updatedMembers && updatedMembers.length > 0) {
        const newSelectedValues = [...selectedValues];
        updatedMembers.forEach((member: any, index: number) => {
          if (index < 4) { // Limiter aux 4 premières dropdowns
            newSelectedValues[index] = member.licence;
          }
        });
        setSelectedJoueurs(newSelectedValues);
      }

      // Configurer les dropdowns pour désactiver celles qui sont déjà remplies
      const newDisabledDropdowns = { ...disabledDropdowns };
      updatedMembers.forEach((_, index: number) => {
        if (index < 4) {
          const dropdownKey = getDropdownKey(index);
          newDisabledDropdowns[dropdownKey] = true; // Désactiver les dropdowns remplies
        }
      });
      setDisabledDropdowns(newDisabledDropdowns);

      // Reconfigurer les dropdowns pour refléter la nouvelle composition de l'équipe
      configureDropdownsBasedOnFormule();
    } else {
      // Mode scramble classique
      initializeTeamMembers();
    }
    const teamMembers = getGlobalProperties().members;
    if (teamMembers.length > 0) {
      const allUsersList = getGlobalUsersList().allUsersList || [];
      const firstMember = allUsersList.find((u: any) => u.licence === teamMembers[0].licence);
      setGlobalProperty('licence', teamMembers[0].licence);
      setGlobalProperty('teamLeaderNomPrenom', jsonObject.nom_prenom);
      setGlobalProperty('repere', getGlobalProperties().members[0].repere);
    } else {
      setGlobalProperty('licence', jsonObject.licence);
      setGlobalProperty('teamLeaderNomPrenom', jsonObject.nom_prenom);
    }
    
    displayResaManagement(jsonObject);
  };

  // Fonction setResaMember
  const setResaMember = (jsonObject: any) => {
    if(jsonObject.status == "KO") {
      showAlert("Erreur", jsonObject.error);
      return;
    }
    setGlobalProperty('periode', null);
    setGlobalReturnResaMemberAll(jsonObject);
    let _tranche = null;
    if(getGlobalResaMember().duree_trou == '0'){
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf("TRANCHE") + 8, jsonObject.tranche.indexOf("</span>"));
    }else{
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf(">") + 1,jsonObject.tranche.indexOf("</"));
    }
    if(getGlobalReturnResaMember().isResaRepas === true && jsonObject.action !== "terminate"){
        setGlobalProperty('sendMailClosure', null);
    }else {
      const sendMailClosure = {
        operationType: jsonObject.nbrOfPlayers > 1 ? "sendTeamResaMail" : "sendResaMail",
        action: jsonObject.action,
        massResa: 'NO',
        recipient: jsonObject.email,
        recipientName: jsonObject.userName,
        subject: 'Confirmation inscription compétition',
        identMember: jsonObject.identMembers,
        prenom: jsonObject.prenom,
        competition: jsonObject.nom_competition,
        date: jsonObject.date_competition,
        tranche: _tranche,
        periode: getGlobalProperties().labelPeriode,
        duree_trou: getGlobalProperties().duree_trou,
        isResaRepas: jsonObject.isResaRepas,
        resa_repas: (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
        resaMenuLicences: [],
        resaMenu: [],
        isResaMenu: '0',
        licence: jsonObject.licence,
        isMobile: '1',
        isComplete: getGlobalProperties().isComplete,
        isEclectic: getGlobalJsonObject().isEclectic,
        repere: selectedRepere,
      };
      fetchDataFromServer(sendMailClosure);
    }
  };

  // Fonction calculateJauge
  const calculateJauge = () => {
    if(getGlobalProperties().duree_trou == 0) {
      setGlobalProperty('jauge', Math.round((2 * getGlobalProperties().nbre_joueurs) * 18));
    } else {
      setGlobalProperty('jauge', Math.round((getGlobalProperties().tranche_duree / getGlobalProperties().duree_trou)) * getGlobalProperties().nbre_joueurs);
    }
  };

  // Fonction setTranchesManagement
  const setTranchesManagement = (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      showAlert("Erreur", jsonObject.error);
      return;
    }

    // Mettre à jour les propriétés globales
    setGlobalProperty('trancheId', jsonObject.id);
    setGlobalProperty('tranche_duree', parseInt(jsonObject.tranche_duree));
    setGlobalProperty('duree_trou', parseInt(jsonObject.duree_trou));
    setGlobalProperty('nbre_joueurs', parseInt(jsonObject.nbre_joueurs));
    calculateJauge();

    // Récupérer les IDs de tranche et la période depuis les propriétés globales
    const globalTrancheIds = getGlobalProperties().trancheId || [];
    const periodeText = getPeriodeFromGlobal();
    const periodeId = periodeText ? getPeriodeIdFromText(periodeText) : null;
    const nbTranches = jsonObject.tranches?.length || 0;

    // Mettre à jour les tranches avec les bonnes informations
    const updatedTranches: any = tranches.map((tranche, index) => {
      const rawTitle = jsonObject.tranches?.[index];
      const cleanTitle = rawTitle ? cleanHtml(rawTitle) : `Tranche ${index + 1}`;
      // Récupérer l'ID de tranche correspondant depuis le tableau global
      const trancheId = globalTrancheIds[index] || tranche.id;
      const options = tranche.options.map(option => ({
        ...option,
        isActive: index < nbTranches && !(getGlobalProperties().shotgun && option.id !== 1),
      }));

      // Sélectionner automatiquement la période si elle correspond à cette tranche
      let selectedOption = tranche.selectedOption;
      if (getGlobalProperties().shotgun && index === 0) {
        selectedOption = 1;
      } else if (periodeId && index === 0) {
        // Si nous avons une période globale et que c'est la première tranche,
        // nous la sélectionnons automatiquement
        selectedOption = periodeId;
      }
      return {
        ...tranche,
        id: trancheId, // Utiliser l'ID de tranche du tableau global
        title: cleanTitle,
        isActive: index < nbTranches && (index === 0 || !getGlobalProperties().shotgun),
        options: options,
        selectedOption: selectedOption,
      };
    });
    setTranches(updatedTranches);
    if(getGlobalJsonObject().asAlreadyRESA === '1'){
      setTranchePeriode(getGlobalResaMember().tranche.id, getPeriodeIdFromText(getGlobalResaMember().position.title) as any);
    }

    // Gestion spécifique pour le mode shotgun
    if (getGlobalProperties().shotgun) {
      const firstTrancheId = globalTrancheIds[0] || 1;
      setGlobalProperty('numTranche', firstTrancheId);
      setGlobalProperty('labelPeriode', "Début");
    } else if (periodeId) {
      // Si nous avons une période globale, nous la sélectionnons dans la première tranche
      const firstTrancheId = globalTrancheIds[0] || 1;
      setGlobalProperty('numTranche', firstTrancheId);
      setGlobalProperty('labelPeriode', periodeText || "Début");
    }
  };


  // Fonction setResa
  const setResa = async (repas: any, flag: boolean) => {
    if (getGlobalProperties().teamLeaderNomPrenom == null) {
      const confirmed = await showAlert("Attention", "Vous devez sélectionner toute l'équipe");
      return;
    }

    const teamNumber = getGlobalProperties().teamNumber;
    if (teamNumber === 2 && selectedValues[1] === null) {
      await showAlert("Attention", "Vous devez sélectionner le 2ème joueur pour un scramble à 2.");
      return;
    } else if (teamNumber === 4 && (selectedValues[1] === null || selectedValues[2] === null || selectedValues[3] === null)) {
      await showAlert("Attention", "Vous devez sélectionner les 3 autres joueurs pour un scramble à 4.");
      return;
    }

    let menu = null;
    switch (getGlobalJsonObject().isEclectic) {
      case "isEclectic": menu = "Eclectic"; break;
      case "isRingerScore": menu = "RingerScore"; break;
      case "isEclectic-IS": menu = "Eclectic-IS"; break;
      default: menu = "Standard"; break;
    }

    if(getGlobalProperties().labelPeriode === null) {
      await showAlert("Attention", 'Vous devez sélectionner une tranche et une période');
      return;
    }

    const hasChanged = JSON.stringify(getGlobalProperties().allResaRepas) !== JSON.stringify(getGlobalProperties().allResaRepasSave);
    const setResaMemberData = {
      operationType: 'setResaMember',
      action: "terminate",
      isMobile: "1",
      nom_competition: getGlobalJsonObject().nom_competition,
      memberName: getGlobalProperties().teamLeaderNomPrenom,
      tranche: getGlobalProperties().trancheId ? getGlobalProperties().trancheId[0] : null,
      periode: getGlobalProperties().shotgun ? "Début" : getGlobalProperties().labelPeriode,
      jauge: getGlobalProperties().jauge,
      licence: getGlobalJsonObject().licence,
      civilite: getGlobalJsonObject().civilite,
      resa_repas: (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
      isEclectic: getGlobalJsonObject().isEclectic,
      isResaRepas: getGlobalJsonObject().isResaRepas == '1' ? true : false,
      menu_choice: '',
      isResaMenu: false,
      resaMenuLicences: selectedValues.filter(val => val !== null),
      resaMenu: ['0'],
      resaRepasUpdate: hasChanged,
      menu: menu,
      sous_menu: "Inscription - User",
      repere: selectedRepere
    };
    fetchDataFromServer(setResaMemberData);
  };

  // Fonction sendResaMail
  const sendResaMail = async (jsonObject: any) => {
    if(jsonObject.status == 'KO'){
      showAlert("Gestion des erreurs", jsonObject.error);
      return;
    }
    if(getGlobalProperties().sous_menu === "desinscription"){
      return;
    }
    if (getGlobalProperties().isMultiCompetitions > 1) {
      if (jsonObject.massResa === "YES") {
        // Gestion spécifique pour les réservations multiples
      }
    }
    if(getGlobalJsonObject().covoiturage === '1'){
      setIsWaitingCovoiturage(true);
      try {
        // Attendre le retour du covoiturage
        await navigateToCovoiturage();
      } catch (error) {
        console.error("Erreur dans le flux covoiturage:", error);
      }
    }
    let dataForPlayersList = null;
    if (jsonObject.action !== "removeUser" && (getGlobalJsonObject().isAlreadyPaid == true || getGlobalProperties().isPEL == false)) {
      setGlobalProperty('repasChecked', jsonObject.resa_repas);
      if (jsonObject.massResa == "NO") {
          dataForPlayersList = {
              operationType: 'getCompetitionPlayers',
              isEclectic: getGlobalJsonObject().isEclectic,
              nom_competition: getGlobalJsonObject().nom_competition,
              action: 'displayList',
              isFromCBReturn: getGlobalJsonObject().isPEL_enabled ? true : false,
              accessType: 'resa',
          };
          fetchDataFromServer(dataForPlayersList);
      }
    } else {
      setIsAlertVisible(true);
    }
  };

  // Fonction pour naviguer vers covoiturage et attendre le retour
  const navigateToCovoiturage = async () => {
    return new Promise<boolean>((resolve) => {
      // Stocker la fonction de résolution
      covoituragePromiseRef.current = { resolve };
      // Utilisez linkBuilder pour créer une URL typée
      const href = {
        pathname: 'src/reservation/covoiturage',
        params: {
          menuTitle: params.menuTitle,
          parentMenuName: params.parentMenuName,
          competitionType: params.competitionType,
          competitionName: params.competitionName,
          covoiturageResult: params.covoiturageResult,
          returnTo: "resa",
        }
      } as const;
      router.push(href as any);
    });
  };
  // Fonction getCompetitionPlayers
  const getCompetitionPlayers = (jsonObject: any) => {
    if(jsonObject.status == 'KO') {
      showAlert("Erreur", jsonObject.error);
      return;
    }
    try {
      setGlobalPlayersListAll(jsonObject);
      let playersList = getGlobalPlayersList().playersList;
      setGlobalPaymentsListAll(jsonObject);

      const transformedDataPayments = getGlobalPaymentsList().paymentsList.map(paymentPlayer => ({
        ...paymentPlayer,
        licence: paymentPlayer.licence,
      }));

      const transformedData = playersList.map(player => ({
        ...player,
        title: player.title,
        whs_index: player.whs_index,
        serie: player.serie,
        cb: '',
        licence: player.licence,
      }));

      setPlayersData(transformedData);
      setPaymentsPlayerData(transformedDataPayments);

      setGlobalProperty('transformedData', transformedData);
      setGlobalProperty('transformedDataPayments', transformedDataPayments);
      router.replace({
        pathname: '/src/reservation/displayListPlayers' as any,
        params: {
          data: JSON.stringify(transformedData),
          paymentsData: JSON.stringify(transformedDataPayments)
        },
      });
    } catch (error) {
      console.error("Erreur dans getCompetitionPlayers:", error);
      //setIsTransitioning(false);
      showAlert("Erreur", "Une erreur est survenue lors du traitement des données");
    }
  };

  // Fonction getRemoveResaUser
  const getRemoveResaUser = async (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      await showAlert("Erreur", jsonObject.error);
      return;
    }
    let _tranche = null;
    if(getGlobalResaMember().duree_trou == '0'){
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf("TRANCHE") + 8, jsonObject.tranche.indexOf("</span>"));
    }else{
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf(">") + 1,jsonObject.tranche.indexOf("</"));
    }
    const donnees = {
        operationType: "sendResaMail",
        action: jsonObject.action,
        massResa: 'NO',
        recipient: jsonObject.email,
        recipientName: jsonObject.userName,
        subject: 'Confirmation désinscription compétition',
        identMember: jsonObject.identMembers,
        prenom: jsonObject.prenom,
        competition: jsonObject.nom_competition,
        date: jsonObject.date_competition,
        tranche: _tranche,
        periode: getGlobalResaMember().position.title?.substring(getGlobalResaMember().position.title?.indexOf('>') as any + 1, getGlobalResaMember().position.title?.indexOf('</')) || '',
        duree_trou: getGlobalProperties().duree_trou,
        isResaRepas: jsonObject.isResaRepas,
        resa_repas: (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
        resaMenuLicences: [],
        resaMenu: [],
        isResaMenu: '0',
        licence: jsonObject.licence,
        isMobile: '1',
        isComplete: getGlobalProperties().isComplete,
        isEclectic: getGlobalJsonObject().isEclectic,
        repere: selectedRepere,
      };
      fetchDataFromServer(donnees);
    if(getGlobalProperties().sous_menu !== "desinscription") {
      router.replace('/');
    }
  };

  // Fonction sendPaymentRequest
  const sendPaymentRequest = () => {
    let montant: number = parseNumber(getGlobalJsonObject().tarif_as);
    if (getGlobalJsonObject().isPelGolf == "1") {
      montant = parseNumber(getGlobalJsonObject().currentGolfTarif);
    }
    montant = getGlobalProperties().repasChecked === "1" ? montant + parseNumber(getGlobalJsonObject().prix_repas) : montant;
    let data = {
      operationType: 'cbPaymentInitPayment',
      targetSite: getGlobalProperties().site,
      currentUrl: "isAppMobile",
      body: {
        totalAmount: montant,
        initialAmount: montant,
        itemName: getGlobalJsonObject().nom_competition,
        backUrl: '',
        errorUrl: '',
        returnUrl: '',
        containsDonation: false,
        payer: {
          firstName: getGlobalJsonObject().teamLeaderPrenom,
          lastName: getGlobalJsonObject().teamLeaderNom,
          email: getGlobalJsonObject().email,
          dateOfBirth: '',
          address: (getGlobalJsonObject()?.adresse_1 || '') + (getGlobalJsonObject()?.adresse_2 || '') + (getGlobalJsonObject()?.adresse_3 || ''),
          city: getGlobalJsonObject().ville,
          zipCode: getGlobalJsonObject().code_postal,
          country: 'FRA',
          companyName: '',
        },
        metadata: {
          licence: getGlobalJsonObject().licence,
          nom_competition: getGlobalJsonObject().nom_competition,
          isEclectic: getGlobalJsonObject().isEclectic,
          isOlpTransaction: false,
          isMobile: "1",
          targetSite: getGlobalProperties().site,
          tarif: getGlobalJsonObject().tarif_label,
          isAppMobile: "1",
        },
      }
    };
    fetchDataFromServer(data);
  };

  // Fonction convertBooleanToNumberArray
  function convertBooleanToNumberArray(booleanArray: boolean[]): number[] {
    return booleanArray.map(value => value ? 1 : 0);
  }

  // Fonction parseNumber
  function parseNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'string') {
      return parseFloat(value) || 0;
    }
    return value;
  };

  // Fonction pour récupérer la tranche et la période sélectionnées
  const getSelectedTrancheAndPeriode = (): { trancheId: number | null; periodeLabel: string } => {
    // Vérifier d'abord si une période est sélectionnée dans l'interface
    for (const tranche of tranches) {
      if (tranche.selectedOption !== undefined) {
        const selectedOption = tranche.options.find(option => option.id === tranche.selectedOption);
        if (selectedOption) {
          return {
            trancheId: tranche.id,
            periodeLabel: selectedOption.label
          };
        }
      }
    }

    // Si aucune période n'est sélectionnée dans l'UI, vérifier la période globale
    const periodeText = getPeriodeFromGlobal();
    if (periodeText) {
      return {
        trancheId: 1, // Par défaut tranche 1 si période globale existe
        periodeLabel: periodeText
      };
    }

    return { trancheId: null, periodeLabel: 'Aucune période sélectionnée' };
  };

  const setMassResaTeam = async (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      await showAlert("Erreur", jsonObject.error);
      return;
    }
    let mailAction = null;
    if (jsonObject.action === "removeTeam") {
      mailAction = "Confirmation désinscription compétition";
    } else {
      if (getGlobalProperties().isComplete === 'complete') {
        setGlobalProperty('isComplete', "normal");
      }
      mailAction = "Confirmation inscription compétition";
    }
    let _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf(">") + 1, jsonObject.tranche.indexOf("</"));
    if (jsonObject.removedMembers.length > 0) {
      const removedMembersRemoveData = {
          operationType: "sendTeamResaMailRemoveMember",
          action: "removeUser",
          subject: "Confirmation désinscription compétition",
          isEclectic: getGlobalJsonObject().isEclectic,
          identMember: jsonObject.identMember,
          removedMembers: jsonObject.removedMembers || [],
          competition: jsonObject.nom_competition,
          date: jsonObject.date_competition,
          tranche: _tranche,
          periode: jsonObject.periode.substring(jsonObject.periode.indexOf('>--') + 2, jsonObject.periode.indexOf('-<')),
          duree_trou: getGlobalProperties().duree_trou,
          isMobile: "1",
      };
      setTeamMembersRemoveData(removedMembersRemoveData);
    }
    const _resaRepas = (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(',');
    const donnees = {
      operationType: 'sendTeamResaMail',
      action: jsonObject.action,
      massResa: jsonObject.teamResa,
      recipient: jsonObject.email,
      recipientName: jsonObject.userName,
      subject: mailAction,
      identMember: jsonObject.identMember,
      competition: jsonObject.nom_competition,
      date: jsonObject.date_competition,
      tranche: _tranche,
      periode: jsonObject.periode.substring(jsonObject.periode.indexOf('>--') + 2, jsonObject.periode.indexOf('-<')),
      duree_trou: getGlobalProperties().duree_trou,
      isResaRepas: jsonObject.isResaRepas === "1" ? true : false,
      resa_repas: getGlobalProperties().allResaRepas.length == 4 ? getGlobalProperties().allResaRepas : (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
      menu_choice: [],
      isResaMenu: false,
      resaMenuLicences: [],
      nbrScramblePlayers: getGlobalProperties().nbrScramblePlayers,
      isComplete: getGlobalProperties().isComplete,
      resaMenu: [],
      isEclectic: getGlobalJsonObject().isEclectic,
      removedMembers: jsonObject.removedMembers || [],
    };

    fetchDataFromServer(donnees);
  };
  // Effet pour gérer l'envoi des mails de suppression des membres d'équipe après la mise à jour de l'équipe
  useEffect(() => {
      if (teamMembersRemoveData) {
        fetchDataFromServer(teamMembersRemoveData);
        setTeamMembersRemoveData(null);
      }
  }, [teamMembersRemoveData]);
  
  const getNumberOfUsedDropdowns = (): number => {
  // On suppose que selectedValues est accessible dans ce contexte
    return selectedValues.filter(value => value && value.trim() !== "").length;
  } ;

  const handleValidate = async () => {
    const { trancheId, periodeLabel } = getSelectedTrancheAndPeriode();
    const currentMembers = getGlobalProperties().members || [];
    // Déterminer les membres actuels et les nouvelles sélections
    const currentMemberLicences = currentMembers.map((member: any) => member.licence);
    const newSelectedLicences = selectedValues.filter(val => val !== null && val !== "");

    // Identifier les membres supprimés
    const removedLicences = currentMemberLicences.filter(licence => !newSelectedLicences.includes(licence));

    // Récupérer les membres complets depuis getGlobalProperties().members
    const removedMembers = getGlobalProperties().members
      .filter((member: any) => removedLicences.includes(member.licence));

    // Identifier les nouveaux membres
    const addedMembers = newSelectedLicences.filter(licence => !currentMemberLicences.includes(licence));
      if (trancheId === null) {
        showAlert("Attention", "Vous devez sélectionner une période.");
        return;
      }

    const uniqueSelectedPlayers = [...new Set(selectedValues.filter(Boolean))];
    if (uniqueSelectedPlayers.length !== selectedValues.filter(Boolean).length) {
      showAlert("Erreur", "Un joueur ne peut pas être sélectionné plusieurs fois.");
      return;
    }

    const formule = getGlobalJsonObject().formule;
    const isScramble = formule.includes("Scramble");
    const allUsersList = getGlobalUsersList().allUsersList || [];

    let joueursSelectionnes: Array<{
      id: string;
      nom: string;
      civilite: string;
      licence: string;
      repere: string;
    }> = [];

    if (isScramble) {
      joueursSelectionnes = selectedValues
        .filter(val => val !== null && val !== "")
        .map(val => {
          const user = allUsersList.find((u: any) => u.licence === val);
          return {
            id: val!,
            nom: user ? `${user.nom} - ${user.prenom}` : "Inconnu",
            civilite: user?.civilite || '',
            licence: val!,
            repere: user?.repere || 'blanc'
          };
        });
    } else {
      const connectedUser = allUsersList.find((u: any) => u.licence === getGlobalJsonObject().licence);
      if (connectedUser) {
        joueursSelectionnes = [{
          id: getGlobalJsonObject().licence || '',
          nom: `${getGlobalJsonObject().teamLeaderNom || ''} - ${getGlobalJsonObject().teamLeaderPrenom || ''}`.trim() || "Vous",
          civilite: getGlobalJsonObject().civilite || '',
          licence: getGlobalJsonObject().licence || '',
          repere: connectedUser.repere || 'blanc'
        }];
      }
    }

    const teamNumber = getGlobalProperties().teamNumber || 1;
    const selectedPlayersCount = selectedValues.filter(val => val !== null && val !== "").length;


    if (formule.includes("Scramble")) {
      if (formule.includes("Scramble à 2") && selectedPlayersCount < 2) {
        setGlobalProperty('isIncomplete', true);
        setGlobalProperty('isComplete', "incomplete");
      } else if (formule.includes("Scramble à 4") && selectedPlayersCount < 4) {
        setGlobalProperty('isIncomplete', true);
        setGlobalProperty('isComplete', "incomplete");
      } else {
        setGlobalProperty('isComplete', "complete");
      }
    }
    setJoueursSelectionnes(joueursSelectionnes);
    if (formule.includes("Scramble")) {
      const setResaTeamData = {
        operationType: 'setMassResaTeam',
        createTeam: getGlobalProperties().newTeamResa === false ? 'NO' : 'YES',
        teamResa: 'YES',
        action: 'addUser',
        nbrOfPlayers: joueursSelectionnes.length,
        isMobile: '1',
        updateTeam: 'OK',
        nom_competition: getGlobalJsonObject().nom_competition,
        teamLeader: getGlobalProperties().teamLeaderNomPrenom,
        teamLeaderLicence: joueursSelectionnes[0]?.licence || '',
        tranche: trancheId,
        periode: periodeLabel,
        jauge: getGlobalProperties().jauge,
        licence_1: joueursSelectionnes[0]?.licence || '',
        licence_2: joueursSelectionnes[1]?.licence || '',
        licence_3: joueursSelectionnes[2]?.licence || '',
        licence_4: joueursSelectionnes[3]?.licence || '',
        civilite_1: joueursSelectionnes[0]?.civilite || '',
        civilite_2: joueursSelectionnes[1]?.civilite || '',
        civilite_3: joueursSelectionnes[2]?.civilite || '',
        civilite_4: joueursSelectionnes[3]?.civilite || '',
        resa_repas: (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
        isResaRepas: getGlobalJsonObject().isResaRepas,
        isResaMenu: false,
        resaMenuLicences: [],
        resaMenu: [],
        initialNbrPlayers: getGlobalProperties().initialNbrPlayers,
        nbrScramblePlayers: getGlobalProperties().nbrScramblePlayers,
        isEclectic: getGlobalJsonObject().isEclectic,
        menu: getGlobalProperties().menu,
        sous_menu: getGlobalProperties().sous_menu,
        removedMembers: removedMembers,
      };
      setResaTeamDataState(setResaTeamData);
      setResaRecord(setResaTeamData);
    } else {
      const setResaMemberData = {
        operationType: 'setResaMember',
        action: "terminate",
        isMobile: "1",
        nom_competition: getGlobalJsonObject().nom_competition,
        memberName: getGlobalProperties().teamLeaderNomPrenom,
        tranche: trancheId,
        periode: periodeLabel,
        jauge: getGlobalProperties().jauge,
        licence: getGlobalJsonObject().licence,
        civilite: getGlobalJsonObject().civilite,
        resa_repas: (getGlobalProperties().allResaRepas || [false, false, false, false]).map((item: any) => item ? '1' : '0').join(','),
        isEclectic: getGlobalJsonObject().isEclectic,
        isResaRepas: getGlobalJsonObject().isResaRepas == '1' ? true : false,
        menu_choice: '',
        isResaMenu: false,
        resaMenuLicences: selectedValues.filter(val => val !== null),
        resaMenu: ['0'],
        resaRepasUpdate: false,
        menu: getGlobalProperties().menu,
        sous_menu: "Inscription - User",
        repere: selectedRepere
      };
      setResaDataState(setResaMemberData);
      setResaRecord(setResaMemberData);
    }
    if (formule.includes("Scramble")) {
      // Configuration des dropdowns pour une nouvelle équipe Scramble
      const maxPlayers = formule.includes("Scramble à 2") ? 2 : 4;
      const newDropdowns: DropdownsState = {
        dropdown_1: true,   // Désactivée (capitaine)
        dropdown_2: false,  // Activée pour le 2ème joueur
        dropdown_3: maxPlayers >= 3 ? false : true,  // Activée si Scramble à 4
        dropdown_4: maxPlayers >= 4 ? false : true,  // Activée si Scramble à 4
      };
      setDisabledDropdowns(newDropdowns);
    }
    if (getGlobalJsonObject().isResaRepas == '1') {
      // Reconfigurer les dropdowns avant d'ouvrir la modal
      configureDropdownsBasedOnFormule();

      setGlobalProperty('source', 'userResa');
      setGlobalProperty('nbrRepas', getNumberOfUsedDropdowns());
      setGlobalProperty('repere', selectedRepere);
      setGlobalProperty('tranche', trancheId);
      setGlobalProperty('periode', periodeLabel);
      setModalRepasVisible(true);
    }
  };

  // Utiliser un useEffect pour envoyer les données de réservation au serveur lorsque resaRecord est mis à jour
  useEffect(() => {
    if (resaRecord && getGlobalJsonObject().isResaRepas != '1') {
      fetchDataFromServer(resaRecord);
    }
  } , [resaRecord]);
  
  // Utilisez un useEffect pour gérer la validation des repas après la fermeture de la modal
  useEffect(() => {
    // Ignorer le premier rendu et si la modal est encore visible
    if (initialRender.current || modalRepasVisible) {
      initialRender.current = false;
      return;
    }

    // Vérifier que nous avons bien des données à envoyer
    const hasDataToSend = getGlobalJsonObject().formule.includes("Scramble") ? !!resaTeamData : !!resaData;
    if (!hasDataToSend) {
      return;
    }

    // Préparer les données de repas
    const repasArray = Array(4).fill(0).map((_, index) =>
      index < getNumberOfUsedDropdowns() ? (getGlobalProperties().allResaRepas?.[index] ? 1 : 0) : 0
    );

    // Mettre à jour allResaRepas uniquement si nécessaire
    const currentRepasArray = getGlobalProperties().allResaRepas || [];
    const repasArrayString = repasArray.join(',');
    const currentRepasArrayString = currentRepasArray.join(',');

    if (repasArrayString === currentRepasArrayString) {
      return; // Éviter de refaire la même requête
    }

    setGlobalProperty('allResaRepas', repasArray);

    // Envoyer les données
    if (getGlobalJsonObject().isResaRepas && getNumberOfUsedDropdowns() > 0) {
      if (getGlobalJsonObject().formule.includes("Scramble") && resaTeamData) {
        const dataToSend = {
          ...resaTeamData,
          resa_repas: repasArray.join(',')
        };
        fetchDataFromServer(dataToSend);
        // Réinitialiser les données après envoi pour éviter les doubles envois
        setResaTeamDataState(null);
      } else if (resaData) {
        const dataToSend = {
          ...resaData,
          resa_repas: repasArray.join(',')
        };
        fetchDataFromServer(dataToSend);
        // Réinitialiser les données après envoi pour éviter les doubles envois
        setResaDataState(null);
      }
    }
  }, [modalRepasVisible]); 

  // Gestion de la désinscription d'une RESA
  const handleRemove = async () => {
    let menu;
    switch (getGlobalJsonObject().isEclectic) {
      case "isEclectic": menu = "Eclectic"; break;
      case "isRingerScore": menu = "RingerScore"; break;
      case "isEclectic-IS": menu = "Eclectic-IS"; break;
      default: menu = "Standard"; break;
    }

    const confirmed = await showAlert("Confirmation", "Êtes-vous sûr de vouloir vous désinscrire ?", {
      buttons: [
        { text: "Non", onPress: () => false, style: 'cancel' },
        { text: "Oui", onPress: () => true },
      ],
      }).then((choice) => {
        if(choice){
          const data = {
            operationType: 'removeResaUser',
            action: "removeUser",
            nom_competition: getGlobalJsonObject().nom_competition,
            licence: getGlobalJsonObject().licence,
            sendMail: true,
            isEclectic: getGlobalJsonObject().isEclectic,
            isMobile: '1',
            menu: menu,
            sous_menu: "Désinscription - User",
            repere: selectedRepere
          };
          fetchDataFromServer(data);
        }}
      );
  };

  const handleCancel = () => {
    router.replace("/");
  };

  const handleModalClosed = () => {
    setModalRepasVisible(false);
  };

  const handleRepasValidation = (data: {id: string; nom: string; dejeune: boolean}[]) => {
    const repasArray = Array(4).fill(false).map((_, i) => data[i]?.dejeune ?? false);
    setGlobalProperty('allResaRepas', repasArray);
    setModalRepasVisible(false);
  };

  const confirmerPaiement = () => {
    setIsAlertVisible(false);
    displayCBPayment();
  };

  const annulerPaiement = () => {
    let dataForPlayersList = null;
    setIsAlertVisible(false);
    dataForPlayersList = {
      operationType: 'getCompetitionPlayers',
      isEclectic: getGlobalJsonObject().isEclectic,
      nom_competition: getGlobalJsonObject().nom_competition,
      action: 'displayList',
      isFromCBReturn: getGlobalJsonObject().isPEL_enabled ? true : false,
      accessType: 'resa',
    };
    fetchDataFromServer(dataForPlayersList);
  };

  const displayCBPayment = () => {
    setIsAlertVisible(false);
    const days = getGlobalJsonObject().nbrDaysCancelRefunded ?? 'N/A';
    setNbrDaysCancelRefunded(days);
    setIsCarouselModalVisible(true);
  };

  const handleCarouselModalAbandon = () => {
    setIsCarouselModalVisible(false);
    if(params.competitionKey === "OLP"){
      router.replace('/');
    }
  };

  const handleCarouselModalContinue = () => {
    setIsCarouselModalVisible(false);
    sendPaymentRequest();
  };

  /*
  const isInDevelopment = () => {
    return !Constants.expoConfig?.extra?.releaseChannel || Constants.expoConfig?.extra?.releaseChannel === 'default';
  };

  if (isInDevelopment()) {
    setGlobalProperty('site', 'dev');
  } else {
    setGlobalProperty('site', 'production');
  }
  */

  const env = Constants.expoConfig?.extra?.env;
  setGlobalProperty('site', env === 'development' ? 'dev' : 'production');

  // Construction des données initiales à envoyer au serveur en fonction du type de menu choisi
  let donnees: any = null;
  if(params.competitionKey === "OLP"){
      donnees = {
      operationType: "getCurrentCompetition",
      isEclectic: params.competitionType,
      action: "olpTransaction",
      list: "no",
      isMultiCompetition: 1,
      currentCompetition: params.competitionName,
    };
  }else{
    if(params.menuTitle === 'Liste des inscrits') {
      donnees = {
        operationType: "getCompetitionPlayers",
        isEclectic: getGlobalJsonObject().isEclectic,
        nom_competition: getGlobalJsonObject().nom_competition,
        action: 'displayList',
        isFromCBReturn: false,
        accessType: 'resa',
      };
    }else{
      if (getGlobalProperties().menuEquipeIncomplete) {
        donnees = {
            operationType: "getOrphanList",
            nom_competition: getGlobalJsonObject().nom_competition,
            isMobile: "1",
            formule: getGlobalJsonObject().isEclectic,
            teamNumber: getGlobalProperties().nbrScramblePlayers,
            licence: getGlobalJsonObject().licence,
            isScramble: getGlobalProperties().isScramble
        };
      }else if(getGlobalJsonObject().formule.indexOf("Scramble") > -1) {
        setGlobalProperty('newTeamManagement', getGlobalJsonObject().teamLeader === 'KO');
        donnees = {
          operationType: "validateTeamLeader",
          licence: getGlobalJsonObject().licence,
          nom_competition: getGlobalJsonObject().nom_competition,
          isEclectic: getGlobalJsonObject().isEclectic,
          isMobile: "1",
        };
      } else {
        donnees = {
          operationType: "getResaMember",
          licence: getGlobalJsonObject().licence,
          nom_competition: getGlobalJsonObject().nom_competition,
          isEclectic: getGlobalJsonObject().isEclectic,
          isMobile: "1",
        };
      };
    }
  }
  // useEffect pour initialiser les membres de l'équipe
  useEffect(() => {
    const teamMembers = getTeamMembersFromCompetition();
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      initializeTeamMembers();
    }
  }, [getGlobalJsonObject().members]);

  // useEffect pour le chargement initial
  useEffect(() => {
    fetchDataFromServer(donnees);
  }, []);

  // Ajoutez ce useEffect pour reconfigurer après le chargement des données
  useEffect(() => {
    if (!isLoading) {
      configureDropdownsBasedOnFormule();
    }
  }, [isLoading]);

  // Écouteur pour détecter le retour du covoiturage
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isWaitingCovoiturage && covoituragePromiseRef.current) {
        // Résoudre la promesse quand on revient sur l'écran
        covoituragePromiseRef.current.resolve(true);
        covoituragePromiseRef.current = null;
        setIsWaitingCovoiturage(false);
      }
    });
    return unsubscribe;
  }, [isWaitingCovoiturage]);

  const fetchCompetitionPlayersAndPrepareData = async () => {
    const dataForPlayersList = {
      operationType: 'getCompetitionPlayers',
      isEclectic: getGlobalJsonObject().isEclectic,
      nom_competition: getGlobalJsonObject().nom_competition,
      action: 'displayList',
      isFromCBReturn: !!getGlobalJsonObject().isPEL_enabled,
      accessType: 'resa',
    };
    fetchDataFromServer(dataForPlayersList);
  };

  // Écran de transition
  /*
  if (isTransitioning) {
    return (
      <View style={styles.transitionOverlay}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.transitionText}>Chargement en cours...</Text>
      </View>
    );
  }
  */
  // Rendu du composant

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.url.includes("retour-paiement-en-ligne")) {
      const queryString = navState.url.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const status = params.get("status") as 'succeeded' | 'failed' | null;

      setPaymentUrl(null);

      if (status) {
        setPaymentStatus(status);
        setShowConfirmation(true);
      }
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(false);

    if (paymentStatus === "succeeded") {
      fetchCompetitionPlayersAndPrepareData();
    } else {
      router.replace("/");
    }

    // Réinitialiser le statut après confirmation
    setPaymentStatus(null);
  };


  return (
    <ScreenContainer showHeader={true}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.globalContainer}>
          <View style={styles.competitionTitleContainer}>
            <Text style={styles.competitionTitle}>{params.competitionName} - {getGlobalJsonObject().date_competition}</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
            <View style={styles.dropdownsContainer}>
              {Array.from({ length: 4 }).map((_, index) => {
                const dropdownKey = getDropdownKey(index);
                return (
                  <View key={dropdownKey} style={styles.dropdownWithLabel}>
                    <Text style={[styles.dropdownLabel, selectedValues[index] && styles.selectedDropdownLabel]}>
                      {`Joueur ${index + 1}`}
                    </Text>
                    <CustomSearchableDropdown
                      index={index}
                      disabled={disabledDropdowns[dropdownKey]}
                      value={selectedValues[index]}
                      selectedRepere={index === 0 ? selectedRepere : getPlayerRepere(selectedValues[index])}
                    />
                    {selectedValues[index] && (
                      <View style={[styles.playerRepereIndicator, {
                        backgroundColor: getPlayerRepere(selectedValues[index]) === "blanc" ? "#FFFFFF" :
                                      getPlayerRepere(selectedValues[index]) === "jaune" ? "#FFFF00" :
                                      getPlayerRepere(selectedValues[index]) === "bleu" ? "#0000FF" : "#FF0000",
                        borderColor: "#000000",
                        marginLeft: 10,
                      }]}>
                        <Text style={{
                          color: getPlayerRepere(selectedValues[index]) === "blanc" ||
                                getPlayerRepere(selectedValues[index]) === "jaune" ? "#000000" : "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {getPlayerRepere(selectedValues[index]).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
              <DropdownModal />
              <View style={styles.tranchesContainer}>
                {tranches.map((tranche) => (
                  <View
                    key={tranche.id}
                    style={[
                      styles.trancheContainer,
                      !tranche.isActive && styles.disabledTrancheContainer
                    ]}
                  >
                    <Text style={[
                      styles.trancheTitle,
                      !tranche.isActive && styles.disabledTrancheTitle
                    ]}>
                      {tranche.title}
                    </Text>

                    <View style={styles.optionsContainer}>
                      {tranche.options.map((option) => (
                        <View key={option.id} style={styles.optionItem}>
                          <Checkbox
                            status={tranche.selectedOption === option.id ? 'checked' : 'unchecked'}
                            onPress={() => !getGlobalProperties().shotgun && setTranchePeriode(tranche.id, option.id)}
                            disabled={!tranche.isActive || !option.isActive || getGlobalProperties().shotgun}
                            color="#099237ff"
                            uncheckedColor="#181717ff"
                          />
                          <Text style={[
                            styles.optionLabel,
                            (!tranche.isActive || !option.isActive || getGlobalProperties().shotgun) && styles.disabledOptionLabel
                          ]}>
                            {option.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {(
                <View style={styles.radioButtonContainer}>
                  <Text style={styles.radioTitre}>Vous pouvez changer le repère (Joueur 1)</Text>
                  <RadioButton.Group
                    onValueChange={(value) => {
                      setSelectedRepere(value);
                    }}
                    value={selectedRepere}
                  >
                    <View style={styles.radioContainer}>
                      {RADIO_OPTIONS.map((option) => (
                        <View key={option.id} style={styles.radioItem}>
                          <RadioButton.Item
                            value={option.id}
                            label={option.label}
                            style={{ paddingHorizontal: 0 }}
                            labelStyle={styles.radioLabel}
                            color="#099237ff"
                            uncheckedColor="#181717ff"
                          />
                        </View>
                      ))}
                    </View>
                  </RadioButton.Group>
                </View>
              )}

              <RepasModal
                visible={modalRepasVisible}
                onClose={handleModalClosed}
                onValidate={handleRepasValidation}
                joueurs={joueursSelectionnes.map(j => ({
                  id: j.id,
                  nom: j.nom
                }))}
                nbJoueursMax={getGlobalProperties().teamNumber || 1}
                selectedValues= {selectedValues as any} // Passe les valeurs sélectionnées
              />

              <CustomAlert
                visible={isAlertVisible}
                onClose={annulerPaiement}
                title="Paiement en ligne"
                message="Payez en ligne votre droit de jeu"
                onConfirm={confirmerPaiement}
              />

              <CarouselModal
                visible={isCarouselModalVisible}
                onClose={() => setIsCarouselModalVisible(false)}
                onAbandon={handleCarouselModalAbandon}
                onContinue={handleCarouselModalContinue}
                image1={require('../../../assets/images/pel_1-tuto 1.png')}
                image2={require('../../../assets/images/pel_1-tuto 2.png')}
                nbrDaysCancelRefunded={nbrDaysCancelRefunded}
              />

              <View style={styles.buttonsContainer}>
                <CustomButton
                  id="desinscrire-btn"
                  title="Désinscrire"
                  onPress={handleRemove}
                  buttonStates={buttonStates}
                  setButtonState={setButtonState}
                />
                <CustomButton
                  id="valider-btn"
                  title="Valider"
                  onPress={handleValidate}
                  buttonStates={buttonStates}
                  setButtonState={setButtonState}
                />
                <CustomButton
                  id="abandonner-btn"
                  title="Abandonner"
                  onPress={handleCancel}
                  buttonStates={buttonStates}
                  setButtonState={setButtonState}
                />
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
      {/* WebView pour le paiement (superposé) */}
      <Modal
        visible={!!paymentUrl && !showConfirmation}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {paymentUrl && (
            <WebView
              style={{ flex: 1 }}
              source={{ uri: paymentUrl }}
              originWhitelist={["*"]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onNavigationStateChange={handleNavigationStateChange}
              onError={(e) => {
                setPaymentUrl(null);
                Alert.alert(
                  "Gestion des erreurs",
                  "Une erreur est survenue lors du traitement du paiement.",
                  [{ text: "OK", onPress: () => router.replace("/") }]
                );
              }}

              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color="#0000ff"
                  style={{ flex: 1 }}
                />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
      {/* Modal de confirmation */}
      <Modal
        visible={showConfirmation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationContainer}>
            <View style={styles.confirmationContent}>
              {paymentStatus === "succeeded" ? (
                <>
                  <Text style={styles.confirmationTitle}>Paiement réussi</Text>
                  <Text style={styles.confirmationMessage}>
                    Merci {getGlobalJsonObject().teamLeaderPrenom}
                  </Text>
                  <Text style={styles.confirmationMessage}>
                    Pour votre paiement en ligne.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.confirmationTitle}>Paiement annulé</Text>
                  <Text style={styles.confirmationMessage}>
                    Désolé {getGlobalJsonObject().teamLeaderPrenom}
                  </Text>
                  <Text style={styles.confirmationMessage}>
                    Votre paiement n'a pas abouti.
                  </Text>
                </>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    height: '79.5%',
    backgroundColor: '#aacdeeff',
  },
  globalContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: -45
  },
  competitionTitleContainer: {
    marginBottom: 10,
    marginTop: 0,
    alignItems: 'center',
  },
  competitionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1232e2ff',
  },
  dropdownsContainer: {
    marginBottom: 0,
  },
  dropdownWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownLabel: {
    marginRight: 10,
    fontSize: 15,
    fontWeight: 'bold',
    width: 80,
  },
  selectedDropdownLabel: {
    color: '#099237ff',
    fontWeight: 'bold',
  },
  dropdownContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    flex: 1,
    height: 37,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  selectedDropdown: {
    borderColor: '#099237ff',
    borderWidth: 2,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
    borderColor: '#ccc',
  },
  connectedPlayerDropdown: {
    backgroundColor: '#e6f7ff',
    borderColor: '#87ceeb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: '80%',
    width: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    marginBottom: 10,
  },
  dropdownList: {
    height: "60%",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 40,
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#333',
    
  },
  emptyListContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  playerRepereIndicator: {
    borderColor: "#000000",
    borderWidth: 1,
    marginLeft: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  playerRepereIndicatorModal: {
    borderColor: "#000000",
    borderWidth: 1,
    marginLeft: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  playerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  radioButtonContainer: {
    marginBottom: 5,
    marginTop: 0,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginHorizontal: -10,
    marginBottom: 0,
  },
  radioTitre: {
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 0,
    fontSize: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    width: '22%',
  },
  radioLabel: {
    marginLeft: 2,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tranchesContainer: {
    marginVertical: 5,
  },
  trancheContainer: {
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#878ef1ff',
    borderRadius: 5,
    padding: 8,
    paddingBottom: 0,
    marginTop: 0,
  },
  disabledTrancheContainer: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  trancheTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  disabledTrancheTitle: {
    color: '#888',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  disabledOptionLabel: {
    color: '#888',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  transitionText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  confirmationContent: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },


});

export default ResaScreen;
