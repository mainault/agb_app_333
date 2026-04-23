// src/components/FormButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface FormButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function FormButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}: FormButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  disabled: {
    backgroundColor: '#cccccc',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
