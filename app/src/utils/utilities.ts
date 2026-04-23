import { Alert, AlertButton } from 'react-native';

interface CustomAlertButton {
  text: string;
  onPress?: () => void | boolean | Promise<void | boolean>;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ShowAlertOptions {
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  defaultButtonText?: string; // Personnalise le texte du bouton par défaut ("OK" → "Fermer", etc.)
  onDismiss?: () => void; // Callback quand l'alerte est fermée sans clic
}

const cleanMessage = (message: string | undefined | null): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }
  return message.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
};

export const showAlert = (
  title: string,
  message: string | undefined | null,
  options?: {
    buttons?: CustomAlertButton[];
    defaultButtonText?: string;
    onDismiss?: () => void;
  }
): Promise<boolean> => {
  return new Promise((resolve) => {
    const safeMessage = cleanMessage(message);
    const defaultButtons: AlertButton[] = [
      {
        text: options?.defaultButtonText || "OK",
        onPress: () => resolve(true),
        style: 'default',
      },
    ];

    const alertButtons: AlertButton[] = options?.buttons
      ? options.buttons.map((button) => ({
          text: button.text,
          onPress: () => {
            const result = button.onPress?.();
            if (result instanceof Promise) {
              result.then((res) => resolve(!!res));
            } else {
              resolve(result !== false);
            }
          },
          style: button.style,
        }))
      : defaultButtons;

    if (options?.onDismiss && !options.buttons?.some(b => b.style === 'cancel')) {
      alertButtons.push({
        text: "Annuler",
        onPress: () => {
          options.onDismiss?.();
          resolve(false);
        },
        style: 'cancel',
      });
    }

    Alert.alert(title, safeMessage, alertButtons);
  });
};


export default {}; 