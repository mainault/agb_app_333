// utils/alerts.ts
import { Alert } from 'react-native';

interface ConfirmAlertOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>; // Action si "Oui"
  onCancel?: () => void; // Action si "Non" (optionnelle)
  confirmText?: string; // Texte du bouton "Oui" (par défaut : "Oui")
  cancelText?: string; // Texte du bouton "Non" (par défaut : "Non")
  cancelable?: boolean; // Permet de fermer l'alerte en cliquant hors de la boîte (par défaut : false)
}

export const showConfirmAlert = ({
  title,
  message,
  onConfirm,
  onCancel = () => {}, // Fonction vide par défaut
  confirmText = "Oui",
  cancelText = "Non",
  cancelable = false,
}: ConfirmAlertOptions) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: confirmText,
        onPress: onConfirm,
      },
    ],
    { cancelable }
  );
};

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const alertsRoute = () => {
  return null; // ou une redirection si nécessaire
};

export default alertsRoute; // Export par défaut requis par expo-router