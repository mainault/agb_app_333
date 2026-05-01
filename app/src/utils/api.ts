import { Alert } from "react-native";
import { ReponseAPI } from "../types/SendRequestTypes";
import { appConfig } from "../config";

// Fonction pour gérer les requêtes API avec gestion de session
export async function sendRequest(
  donnees: any,
  operationType?: string
): Promise<ReponseAPI> {
  const baseUrl = appConfig.apiUrl;
  const url = operationType
    ? `${baseUrl}?operationType=${operationType}`
    : baseUrl;

  try {
    // 1. Préparer les en-têtes de la requête
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Requested-With": "ReactNative",
    };

    // 2. Envoyer la requête au serveur
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(donnees || {}),
      credentials: "include",
    });

    // 3. Lire la réponse brute
    const responseText = await response.text();

    // 4. Gestion erreurs HTTP
    if (!response.ok) {
      try {
        const errorJson = JSON.parse(responseText);

        if (errorJson.error) {
          throw new Error(`Erreur serveur: ${errorJson.error}`);
        } else {
          throw new Error(
            `Erreur HTTP ${response.status}: ${JSON.stringify(errorJson)}`
          );
        }
      } catch {
        throw new Error(
          `Erreur HTTP ${response.status}: ${responseText.substring(0, 200)}...`
        );
      }
    }

    // 5. Parsing JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError: any) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Contenu de la réponse:", responseText);

      throw new Error(
        `Erreur de parsing JSON: ${parseError.message}. Contenu: ${responseText.substring(
          0,
          200
        )}...`
      );
    }
  } catch (erreur: any) {
    console.error("Erreur complète:", erreur);

    const errorMessage =
      erreur?.message || "Une erreur est survenue.";

    Alert.alert("Erreur", errorMessage);

    throw erreur;
  }
}

// Export par défaut requis par expo-router
export default {};