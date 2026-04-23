import { Alert } from "react-native";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

/**
 * Affiche une alerte de confirmation et retourne une Promise<bool> selon la réponse.
 * @param title Titre de l'alerte.
 * @param message Message de l'alerte.
 * @param buttons Boutons personnalisés (optionnel).
 * @returns Promise<boolean> Résout avec `true` si l'utilisateur confirme, `false` sinon.
 */
const syncAlertManagement = (
  title: string,
  message: string,
  buttons?: AlertButton[]
): Promise<boolean> => {
  return new Promise((resolve) => {
    const defaultButtons: AlertButton[] = [
      { text: "Abandonner", onPress: () => resolve(false), style: "cancel" },
      { text: "Valider", onPress: () => resolve(true) },
    ];

    const buttonsToUse = buttons || defaultButtons;

    Alert.alert(
      title,
      message,
      buttonsToUse.map((button) => ({
        ...button,
        onPress: () => {
          if (button.onPress) button.onPress();
          resolve(button.text === "Valider");
        },
      }))
    );
  });
};

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
export default syncAlertManagement; // Export par défaut requis par expo-router