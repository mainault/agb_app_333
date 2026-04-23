// src/types/navigation.ts
export interface PaymentResultParams {
  status: string;
  nom_competition: string;
  prenom: string;
  montant: string;
  isEclectic: boolean;
  montantBrut: string;
  isResynchronized: boolean;
}

export interface URLQueryParams {
  [key: string]: string | string[] | undefined;
}

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const navigationsRoute = () => {
  return null; // ou une redirection si nécessaire
};

export default navigationsRoute; // Export par défaut requis par expo-router