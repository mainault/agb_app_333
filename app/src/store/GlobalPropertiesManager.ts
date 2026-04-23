
import { set } from 'lodash-es';


// data pour validateUserLogin
import { GlobalJsonObject, initialGlobalJsonObject, initialGlobalJsonObjectForRanking, GlobalAsTarifs, GlobalCurrentCompetition, GlobalCovoiturageObject, GlobalAppVersionObject} from './GlobalStore';

// Variable globale privée
let globalJsonObject: GlobalJsonObject = { ...initialGlobalJsonObject };

// Fonction pour mettre à jour l'objet global
export const setGlobalJsonObject = (newValue: GlobalJsonObject) => {
  globalJsonObject = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalJsonObject = (): GlobalJsonObject => {
  return globalJsonObject;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalJsonObject  = () => {
  globalJsonObject = { ...initialGlobalJsonObject };
};


// data pour getResaMember
import { GlobalResaMember, initialGlobalResaMember } from './GlobalStore';

// Variable globale privée
let globalResaMember: GlobalResaMember = { ...initialGlobalResaMember };

// Fonction pour mettre à jour l'objet global
export const setGlobalResaMember = (newValue: GlobalResaMember) => {
  globalResaMember = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalResaMember = (): GlobalResaMember => {
  return globalResaMember;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalResaMember = () => {
  globalResaMember = { ...initialGlobalResaMember };
};


// data pour globalProperties
import { GlobalProperties, initialGlobalProperties } from './GlobalStore';

// Variable globale privée
let globalProperties: GlobalProperties = { ...initialGlobalProperties };

// Fonction pour mettre à jour l'objet global
export const setGlobalProperties = (newValue: GlobalProperties) => {
  globalProperties = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalProperties= (): GlobalProperties => {
  return globalProperties;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalProperties = () => {
  globalProperties = { ...initialGlobalProperties };
};

// Fonction pour mettre à jour une propriété spécifique
export const setGlobalProperty_ = <K extends keyof GlobalProperties>(
  property: K,
  value: GlobalProperties[K]
) => {
  globalProperties[property] = value;
};

export const setGlobalProperty = (path: string, value: any) => {
  set(globalProperties, path, value);
};


// data pour globalProperties
import { GlobalReturnResaMember, initialGlobalReturnResaMember } from './GlobalStore';

// Variable globale privée
let globalReturnResaMember: GlobalReturnResaMember = { ...initialGlobalReturnResaMember };

// Fonction pour obtenir l'objet global
export const getGlobalReturnResaMember= (): GlobalReturnResaMember => {
  return globalReturnResaMember;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalReturnResaMember = () => {
  globalReturnResaMember = { ...initialGlobalReturnResaMember };
};

// Fonction pour mettre à jour une propriété spécifique
export const setGlobalReturnResaMember_ = <K extends keyof GlobalReturnResaMember>(
  property: K,
  value: GlobalReturnResaMember[K]
) => {
  globalReturnResaMember[property] = value;
};

export const setGlobalReturnResaMember = (path: string, value: any) => {
  set(globalReturnResaMember, path, value);
};

// Fonction pour mettre à jour l'objet global
export const setGlobalReturnResaMemberAll= (newValue: GlobalResaMember) => {
  globalResaMember = newValue;
};


// data pour GlobalPlayersList
import { GlobalPlayersList, initialGlobalPlayersList } from './GlobalStore';

// Variable globale privée
let globalPlayersList: GlobalPlayersList = { ...initialGlobalPlayersList };

// Fonction pour obtenir l'objet global
export const getGlobalPlayersList= (): GlobalPlayersList => {
  return globalPlayersList;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalPlayersList= () => {
  globalPlayersList = { ...initialGlobalPlayersList };
};

// Fonction pour mettre à jour une propriété spécifique
export const GlobalPlayersList_ = <K extends keyof GlobalPlayersList>(
  property: K,
  value: GlobalPlayersList[K]
) => {
  globalPlayersList[property] = value;
};

export const setGlobalPlayersList = (path: string, value: any) => {
  set(globalPlayersList, path, value);
};

// Fonction pour mettre à jour l'objet global
export const setGlobalPlayersListAll= (newValue: GlobalPlayersList) => {
  globalPlayersList = newValue;
};


// data pour globalPaymentsLists
import { GlobalPaymentsList, initialGlobalPaymentsList } from './GlobalStore';

// Variable globale privée
let globalPaymentsList: GlobalPaymentsList = { ...initialGlobalPaymentsList };

// Fonction pour obtenir l'objet global
export const getGlobalPaymentsList= (): GlobalPaymentsList => {
  return globalPaymentsList;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalPaymentsList= () => {
  globalPaymentsList = { ...initialGlobalPaymentsList };
};

// Fonction pour mettre à jour une propriété spécifique
export const GlobalPaymentsList_ = <K extends keyof GlobalPaymentsList>(
  property: K,
  value: GlobalPaymentsList[K]
) => {
  globalPaymentsList[property] = value;
};

export const setGlobalPaymentsList = (path: string, value: any) => {
  set(globalPlayersList, path, value);
};

// Fonction pour mettre à jour l'objet global
export const setGlobalPaymentsListAll= (newValue: GlobalPaymentsList) => {
  globalPaymentsList = newValue;
};

// data pour allUsersList
// GlobalPropertiesManager.ts
import { GlobalAllUsersList, initialGlobalAllUsersList, User } from './GlobalStore';

// Variable globale privée
let globalAllUsersList: GlobalAllUsersList = { ...initialGlobalAllUsersList };

// Fonction pour mettre à jour l'objet global
export const setGlobalUsersList = (newUsers: User[]) => {
  globalAllUsersList = {
    ...globalAllUsersList,
    allUsersList: [...newUsers],
  };
};

// Fonction pour obtenir l'objet global
export const getGlobalUsersList = (): GlobalAllUsersList => {
  return { ...globalAllUsersList };
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalUsersList = () => {
  globalAllUsersList = { ...initialGlobalAllUsersList };
};

// data pour teamLeader
import { GlobalTeamLeader, initialGlobalTeamLeader } from './GlobalStore';

// Variable globale privée
let globalTeamLeader: GlobalTeamLeader = { ...initialGlobalTeamLeader };

// Fonction pour mettre à jour l'objet global
export const setGlobalTeamLeader = (newValue: GlobalTeamLeader) => {
  globalTeamLeader = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalTeamLeader = (): GlobalTeamLeader => {
  return globalTeamLeader;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalTeamLeader = () => {
  globalTeamLeader = { ...initialGlobalTeamLeader };
};

// data pour getIdentMember
import { GlobalIdentMember, initialGlobalIdentMember } from './GlobalStore';

// Variable globale privée
let globalIdentMember: GlobalIdentMember = { ...initialGlobalIdentMember };

// Fonction pour mettre à jour l'objet global
export const setGlobalIdentMember = (newValue: GlobalIdentMember) => {
  globalIdentMember = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalIdentMember = (): GlobalIdentMember => {
  return globalIdentMember;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalIdentMember = () => {
  globalIdentMember = { ...initialGlobalIdentMember };
};

// data pour GlobalOrphanList
import { GlobalOrphanList, initialGlobalOrphanList, OrphanList } from './GlobalStore';

// Variable globale privée
let globalAllOrphanList: GlobalOrphanList = { ...initialGlobalOrphanList };

// Fonction pour mettre à jour l'objet global
export const setGlobalOrphanList = (newOrphan: OrphanList[]) => {
  globalAllOrphanList = {
    ...globalAllOrphanList,
    allOrphanList: [...newOrphan],
  };
};

// Fonction pour obtenir l'objet global
export const getGlobalOrphanList = (): GlobalOrphanList => {
  return { ...globalAllOrphanList };
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalOrphanList = () => {
  globalAllOrphanList = { ...initialGlobalOrphanList };
};

// data pour GlobalUserOrphanList
import { GlobalUserOrphanList, initialGlobalUserOrphanList } from './GlobalStore';

// Variable globale privée
let globalUserOrphanList: GlobalUserOrphanList = { ...initialGlobalUserOrphanList };

// Fonction pour mettre à jour l'objet global
export const setGlobalUserOrphanList = (newValue: GlobalUserOrphanList) => {
  globalUserOrphanList = newValue;
};

// Fonction pour obtenir l'objet global
export const getGlobalUserOrphanList = (): GlobalUserOrphanList => {
  return globalUserOrphanList;
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalUserOrphanList= () => {
  globalUserOrphanList = { ...initialGlobalUserOrphanList };
};


import { GlobalPlayerRanking } from './GlobalStore';

// Variable globale pour stocker le classement complet
let globalPlayerRanking: Record<string, GlobalPlayerRanking> = {};

// Initialisation comme un Record vide
const initialGlobalPlayerRanking: Record<string, GlobalPlayerRanking> = {};

// Setter simplifié pour mettre à jour TOUT le classement
export const setGlobalPlayerRanking = (newRanking: Record<string, GlobalPlayerRanking>) => {
  // Vérifier si les données ont réellement changé
  if (JSON.stringify(globalPlayerRanking) !== JSON.stringify(newRanking)) {
    globalPlayerRanking = { ...newRanking };
  }
};

// Getter pour obtenir tout le classement
export const getGlobalPlayerRanking = (): Record<string, GlobalPlayerRanking> => {
  return { ...globalPlayerRanking };
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalPlayerRanking = () => {
  globalPlayerRanking = { ...initialGlobalPlayerRanking };
};

// data pour GlobalPlayerRankingRS
import { GlobalPlayerRankingRS } from './GlobalStore';

let globalPlayerRankingRS: GlobalPlayerRankingRS[] = [];

export const getGlobalPlayerRankingRS = (): GlobalPlayerRankingRS[] => {
  return globalPlayerRankingRS;
};

export const setGlobalPlayerRankingRS = (ranking: GlobalPlayerRankingRS[]) => {
  globalPlayerRankingRS = ranking;
};

export const resetGlobalPlayerRankingRS = () => {
  globalPlayerRankingRS = [];
};

// Fonction utilitaire pour parser les scores
export const parseScores = (scoreString: string): number[] => {
  if (!scoreString) return Array(18).fill(0);
  return scoreString.split(',').map(score => parseInt(score.trim()) || 0);
};

// GlobalJsonObjectForRanking
import { GlobalJsonObjectForRanking } from './GlobalStore';

// Variable globale pour stocker le classement complet
let globalJsonObjectForRanking: GlobalJsonObjectForRanking = { ...initialGlobalJsonObjectForRanking };

// Setter simplifié pour mettre à jour l'objet global
export const setGlobalJsonObjectForRanking = (newObject: GlobalJsonObjectForRanking) => {
  globalJsonObjectForRanking = newObject;
};

// Getter pour obtenir l'objet global
export const getGlobalJsonObjectForRanking = (): GlobalJsonObjectForRanking => {
  return { ...globalJsonObjectForRanking };
};

// Fonction pour réinitialiser l'objet global
export const resetGlobalJsonObjectForRanking = () => {
  globalJsonObjectForRanking = { ...initialGlobalJsonObjectForRanking };
};

// GlobalPlayerForScores
import { GlobalPlayerForScores } from './GlobalStore';

// Variable globale pour stocker le classement complet
let globalPlayerForScores: Record<string, GlobalPlayerForScores> = {};

// Setter simplifié pour mettre à jour TOUT le classement
export const setGlobalPlayerForScores = (newScores: Record<string, GlobalPlayerForScores>) => {
  globalPlayerForScores = { ...newScores };
};

// Getter pour obtenir tout le classement
export const getGlobalPlayerForScores = (): Record<string, GlobalPlayerForScores> => {
  return { ...globalPlayerForScores };
};

// Fonction utilitaire pour parser les scores
export const parsePlayerScores = (scoreString: string): number[] => {
  if (!scoreString) return Array(18).fill(0);
  return scoreString.split(',').map(score => parseInt(score.trim()) || 0);
};

// Dans GlobalPropertiesManager.ts (ou un fichier similaire)

// Variable globale pour stocker les tarifs
let globalAsTarifs: Record<string, GlobalAsTarifs> = {};

// Setter pour mettre à jour TOUS les tarifs
export const setGlobalAsTarifs = (newTarifs: Record<string, GlobalAsTarifs>) => {
  globalAsTarifs = { ...newTarifs };
};

// Getter pour obtenir tous les tarifs
export const getGlobalAsTarifs = (): Record<string, GlobalAsTarifs> => {
  return { ...globalAsTarifs };
};

// Setter pour mettre à jour un tarif spécifique par clé
export const setGlobalAsTarif = (key: string, tarif: GlobalAsTarifs) => {
  globalAsTarifs = {
    ...globalAsTarifs,
    [key]: tarif,
  };
};

// Getter pour obtenir un tarif spécifique par clé
export const getGlobalAsTarif = (key: string): GlobalAsTarifs | undefined => {
  return globalAsTarifs[key];
};

// Fonction pour réinitialiser les tarifs
export const resetGlobalAsTarifs = () => {
  globalAsTarifs = {};
};

// Variable globale pour stocker la compétition courante
let globalCurrentCompetition: GlobalCurrentCompetition | null = null;

// Setter pour mettre à jour la compétition courante
export const setGlobalCurrentCompetition = (competition: GlobalCurrentCompetition) => {
  globalCurrentCompetition = { ...competition };
};

// Getter pour obtenir la compétition courante
export const getGlobalCurrentCompetition = (): GlobalCurrentCompetition | null => {
  return globalCurrentCompetition ? { ...globalCurrentCompetition } : null;
};

// Fonction pour réinitialiser la compétition courante
export const resetGlobalCurrentCompetition = () => {
  globalCurrentCompetition = null;
};

// Setter pour mettre à jour une propriété spécifique de la compétition courante
export const setGlobalCurrentCompetitionProperty = <K extends keyof GlobalCurrentCompetition>(
  property: K,
  value: GlobalCurrentCompetition[K]
) => {
  if (globalCurrentCompetition) {
    globalCurrentCompetition = {
      ...globalCurrentCompetition,
      [property]: value
    };
  }
};

// Getter pour obtenir une propriété spécifique de la compétition courante
export const getGlobalCurrentCompetitionProperty = <K extends keyof GlobalCurrentCompetition>(
  property: K
): GlobalCurrentCompetition[K] | undefined => {
  return globalCurrentCompetition?.[property];
};


// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const globalpropertiesManagerRoute = () => {
  return null; // ou une redirection si nécessaire
};

// Variable globale pour stocker l'objet covoiturage
let globalCovoiturageObject: GlobalCovoiturageObject | null = null;

// Setter pour mettre à jour l'objet covoiturage complet
export const setGlobalCovoiturageObject = (covoiturage: GlobalCovoiturageObject) => {
  globalCovoiturageObject = { ...covoiturage };
};

// Getter pour obtenir l'objet covoiturage complet
export const getGlobalCovoiturageObject = (): GlobalCovoiturageObject | null => {
  return globalCovoiturageObject ? { ...globalCovoiturageObject } : null;
};

// Setter pour mettre à jour une propriété spécifique
export const setGlobalCovoiturageProperty = <K extends keyof GlobalCovoiturageObject>(
  property: K,
  value: GlobalCovoiturageObject[K]
) => {
  if (globalCovoiturageObject) {
    globalCovoiturageObject = {
      ...globalCovoiturageObject,
      [property]: value
    };
  }
};

// Getter pour obtenir une propriété spécifique
export const getGlobalCovoiturageProperty = <K extends keyof GlobalCovoiturageObject>(
  property: K
): GlobalCovoiturageObject[K] | undefined => {
  return globalCovoiturageObject?.[property];
};

// Fonction pour réinitialiser l'objet covoiturage
export const resetGlobalCovoiturageObject = () => {
  globalCovoiturageObject = {
    operationType: "getCurrentCovoiturage",
    status: "",
    error: "",
    currentCovoiturage: [],
    usersArray: [],
    licence: "",
    nom_prenom: ""
  };
};

// Variable globale pour stocker l'objet AppVersion
let globalAppVersionObject: GlobalAppVersionObject | null = null;

// Setter pour mettre à jour l'objet covoiturage complet
export const setGlobalAppVersionObject = (appVersion: GlobalAppVersionObject) => {
  globalAppVersionObject = { ...appVersion };
};

// Getter pour obtenir l'objet covoiturage complet
export const getGlobalAppVersionObject = (): GlobalAppVersionObject | null => {
  return globalAppVersionObject ? { ...globalAppVersionObject } : null;
};

// Setter pour mettre à jour une propriété spécifique
export const setGlobalAppVersionProperty = <K extends keyof GlobalAppVersionObject>(
  property: K,
  value: GlobalAppVersionObject[K]
) => {
  if (globalAppVersionObject) {
    globalAppVersionObject = {
      ...globalAppVersionObject,
      [property]: value
    };
  }
};

// Getter pour obtenir une propriété spécifique
export const getGlobalAppVersionProperty = <K extends keyof GlobalAppVersionObject>(
  property: K
): GlobalAppVersionObject[K] | undefined => {
  return globalAppVersionObject?.[property];
};

// Fonction pour réinitialiser l'objet version de l'application
export const resetGlobalAppVersionObject = () => {
  globalAppVersionObject = {
    latestVersion: "",
    minVersion: "",
    force_update: false,
    message: "",
    features: []
  };
};










export default globalpropertiesManagerRoute; // Export par défaut requis par expo-router