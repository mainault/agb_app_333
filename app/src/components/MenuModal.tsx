// components/MenuModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface MenuItemType {
  name: string;
  subMenus?: MenuItemType[];
  parentName?: string;
  competitionType?: string;
  screen?: string;
  params?: any;
  subMenuTitle?: string,
}

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  menus: MenuItemType[];
}

export default function MenuModal({ visible, onClose, menus }: MenuModalProps) {
  const [currentMenu, setCurrentMenu] = useState<MenuItemType[]>(menus);
  const [menuStack, setMenuStack] = useState<{name: string, items: MenuItemType[]}[]>([]);

  const handleMenuPress = (item: MenuItemType) => {

    if (item.subMenus) {
      // Sous-menu
      setMenuStack([...menuStack, { name: item.name, items: currentMenu }]);
      setCurrentMenu(item.subMenus);
    } 
    
    // ✅ CAS 1 : écran dynamique (système actuel)
    else if (item.screen && item.params) {
      router.push({
        pathname: `/${item.screen}/[subMenuTitle]` as any,
        params: item as any
      });
      onClose();
    } 
    
    // ✅ CAS 2 : écran simple (NOUVEAU → legal, etc.)
    else if (item.screen) {
      router.push(`/${item.screen}` as any);
      onClose();
    }
  };

  const goBack = () => {
    if (menuStack.length > 0) {
      const previous = menuStack[menuStack.length - 1];
      setCurrentMenu(previous.items);
      setMenuStack(menuStack.slice(0, -1));
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {menuStack.length > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={24} color="black" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.menuTitle}>
            {menuStack.length > 0 ? menuStack[menuStack.length - 1].name : "Menu Principal"}
          </Text>
          <ScrollView style={styles.menuScroll}>
            {currentMenu.map((item, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                >
                  <Text style={styles.menuItemText}>{item.name}</Text>
                  {item.subMenus && (
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  )}
                </TouchableOpacity>
                {item.subMenus && index < currentMenu.length - 1 && (
                  <View style={styles.separator} />
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '83bff7ff',
  },
  modalContent: {
    backgroundColor: '#aacdeeff',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 20,
    flex: 0.85,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
    color: '#0d0d0eff',
  },
  menuScroll: {
    maxHeight: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 0,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#111111ff',
  },
  separator: {
    height: 0,
    backgroundColor: '#eee',
    marginVertical: 0,
  },
});
