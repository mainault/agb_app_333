// src/components/DropdownCompetition.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';

interface DropdownCompetitionProps {
  competitions: any[];
  selectedCompetition: string | null;
  onSelect: (key: string) => void;
  flatListProps?: any;
  maxLabelLength?: number; 
  showSearch?: boolean;
}

const DropdownCompetition: React.FC<DropdownCompetitionProps> = ({
  competitions,
  selectedCompetition,
  onSelect,
  flatListProps = {},
  maxLabelLength = 40,
  showSearch = true,
}) => {
  // Fonction pour tronquer les labels trop longs
  const truncateLabel = (label: string) => {
    return label.length > maxLabelLength
      ? `${label.substring(0, maxLabelLength)}...`
      : label;
  };

  return (
    <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={competitions}
        maxHeight={250}
        labelField="nom_competition"
        valueField="competition_key"
        placeholder="Sélectionnez une compétition"
        search={showSearch}
        searchPlaceholder={`\u{1F50D} Rechercher...`}
        value={selectedCompetition}
        onChange={(item) => {
          onSelect(item.competition_key);
        }}
      renderItem={(item, selected) => (
        <View style={[styles.item, selected && styles.selectedItem]}>
          <Text
            style={[styles.text, selected && styles.selectedText]}
            numberOfLines={1} // Empêche le multi-ligne
            ellipsizeMode="tail" // Ajoute "..." si le texte est trop long
          >
            {truncateLabel(item.nom_competition)}
          </Text>
        </View>
      )}
      flatListProps={{
        ...flatListProps,
        contentContainerStyle: {
          ...flatListProps.contentContainerStyle,
          paddingVertical: 0
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
  dropdown: {

    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  placeholderStyle: {
    fontSize: 15,
  },
  selectedTextStyle: {
    fontSize: 15,
  },
  item: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    width: '100%', // Assure que le texte ne dépasse pas
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  text: {
    fontSize: 15,
    flexShrink: 1, // Permet au texte de rétrécir si nécessaire
  },
  selectedText: {
    fontSize: 15,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 15,
  },
  searchIcon: {
    marginLeft: 10,
  },
});

export default DropdownCompetition;
