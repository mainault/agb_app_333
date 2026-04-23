// types.ts
export interface Player {
  title: any;
  whs_index: any;
  serie: any;
  cb: any;
}

export interface PaymentsPlayer {
  licence: any,
}

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const playersList = () => {
  return null; // ou une redirection si nécessaire
};

export default playersList; // Export par défaut requis par expo-router