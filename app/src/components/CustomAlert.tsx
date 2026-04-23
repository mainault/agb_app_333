// CustomAlert.tsx
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Définissez l'interface des props
interface CustomAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Utilisez React.FC avec l'interface pour typer le composant
const CustomAlert: React.FC<CustomAlertProps> = ({ visible, onClose, title, message, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.alertBox}>
          <View style={styles.titleContainer}>
            <Icon name="credit-card" size={28} color="#2196F3" style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Accepter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertBox: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    paddingLeft:40,
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  confirmButton: {
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
  },
  confirmButtonText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});

export default CustomAlert;
