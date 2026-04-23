// components/MenuModal.tsx
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';

interface MenuItem {
  id: string;
  title: string;
  route: string;
}

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  menus: MenuItem[];
}

export default function MenuModal({ visible, onClose, menus }: MenuModalProps) {
  const handleMenuPress = (route: string) => {
    router.push(route as any);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <FlatList
            data={menus}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.route)}
              >
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#6200ee',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
