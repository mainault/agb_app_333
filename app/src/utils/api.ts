import { Alert } from "react-native";
import { ReponseAPI } from "../types/SendRequestTypes";
import { config } from '../config';

// Fonction pour gérer les requêtes API avec gestion de session
export async function sendRequest(donnees: any, operationType?: string): Promise<ReponseAPI> {
  type AppEnv = 'development' | 'preview' | 'production';
  const rawEnv = (process.env.EXPO_PUBLIC_APP_ENV || '')
    .trim()
    .toLowerCase();
  const ENV: AppEnv = rawEnv === 'production' || rawEnv === 'preview' ? (rawEnv as AppEnv) : 'development';
  const baseUrl = config[ENV].apiUrl;
  const url = operationType ? `${baseUrl}?operationType=${operationType}` : baseUrl;
  console.log(`sendRequest - URL: ${url}, Données:`, donnees);
  try {
    // 2. Préparer les en-têtes de la requête
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'ReactNative',
    };

    // 4. Envoyer la requête au serveur
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(donnees || {}),
      credentials: 'include',
    });

    //console.log("Statut HTTP de la réponse :", response.status);

    // 5. Lire la réponse brute pour diagnostiquer d'éventuelles erreurs
    const responseText = await response.text();
    //console.log("Réponse brute du serveur :", responseText);

    // 6. Vérifier si la réponse est valide
    if (!response.ok) {
      // Essayer de parser la réponse comme JSON pour extraire les détails de l'erreur
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.error) {
          throw new Error(`Erreur serveur: ${errorJson.error}`);
        } else {
          throw new Error(`Erreur HTTP ${response.status}: ${JSON.stringify(errorJson)}`);
        }
      } catch (parseError) {
        // Si la réponse n'est pas un JSON valide, utiliser le texte brut
        throw new Error(`Erreur HTTP ${response.status}: ${responseText.substring(0, 200)}...`);
      }
    }

    // 7. Parser la réponse en JSON
    let responseJson;
    try {
      responseJson = JSON.parse(responseText);
    } catch (parseError: any) {
      // Si la réponse n'est pas un JSON valide
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Contenu de la réponse:", responseText);
      throw new Error(`Erreur de parsing JSON: ${parseError.message}. Contenu: ${responseText.substring(0, 200)}...`);
    }

    return responseJson;
  } catch (erreur: any) {
    console.error("Erreur complète:", erreur);
    // Afficher une alerte avec le message d'erreur
    let errorMessage = "Une erreur est survenue.";
    if (erreur.message) {
      errorMessage = erreur.message;
    }
    Alert.alert("Erreur", errorMessage);
    throw erreur;
  }
}

// Export par défaut requis par expo-router (même si ce fichier n'est pas une route)
export default {};