import { Alert } from 'react-native';
import {  Request, ReponseAPI } from '../types/SendRequestTypes';
  
export async function sendRequest(donnees: Request, signal?: AbortSignal): Promise<ReponseAPI<any>> {
  const url = 'https://masoftware.ddns.net/agbCMS/httpInterface/ClientRequest.php';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donnees), // Envoie l'objet clé-valeur
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const reponseJson: ReponseAPI<any> = await response.json();
    return reponseJson;
  } catch (erreur: any) {
      Alert.alert('Erreur lors de la requête:', erreur.toString());
    throw erreur;
  }
}

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const httpRequests = () => {
  return null; // ou une redirection si nécessaire
};

export default httpRequests; // Export par défaut requis par expo-router