// src/utils/urlParser.ts
import { URLQueryParams, PaymentResultParams } from '../types/navigation';

export const parsePaymentResultParams = (queryParams: URLQueryParams): PaymentResultParams => {
  return {
    status: Array.isArray(queryParams.status) ? queryParams.status[0] : queryParams.status || 'default',
    nom_competition: Array.isArray(queryParams.nom_competition) ? queryParams.nom_competition[0] : queryParams.nom_competition || '',
    prenom: Array.isArray(queryParams.prenom) ? queryParams.prenom[0] : queryParams.prenom || '',
    montant: Array.isArray(queryParams.montant) ? queryParams.montant[0] : queryParams.montant || '0',
    isEclectic: Array.isArray(queryParams.isEclectic)
      ? queryParams.isEclectic[0] === 'true'
      : queryParams.isEclectic === 'true',
    montantBrut: Array.isArray(queryParams.montantBrut) ? queryParams.montantBrut[0] : queryParams.montantBrut || '0',
    isResynchronized: Array.isArray(queryParams.isResynchronized)
      ? queryParams.isResynchronized[0] === 'true'
      : queryParams.isResynchronized === 'true',
  };
};

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const urlParserRoute = () => {
  return null; // ou une redirection si nécessaire
};

export default urlParserRoute; // Export par défaut requis par expo-router