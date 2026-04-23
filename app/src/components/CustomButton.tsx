// CustomButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CustomButtonProps {
  id: string;               // Ajout de l'ID
  title: string;
  onPress: () => void;
  disabled?: boolean;
  buttonStates: Record<string, boolean>;  // État global des boutons
  setButtonState: (id: string, enabled: boolean) => void;  // Fonction pour mettre à jour
}

const CustomButton = ({
  id,
  title,
  onPress,
  disabled: propDisabled,  // disabled passé en prop (prioritaire)
  buttonStates,
  setButtonState
}: CustomButtonProps) => {
  // Détermine si le bouton est désactivé :
  // 1. d'abord par la prop `disabled` si elle est définie
  // 2. sinon par l'état global `buttonStates`
  const isDisabled = propDisabled !== undefined
    ? propDisabled
    : buttonStates[id] === false;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2e87e7ff',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    margin: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomButton;