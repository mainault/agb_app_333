import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput } from 'react-native';
import { Checkbox } from 'react-native-paper';
import CustomButton from './CustomButton';
import { getGlobalJsonObject, getGlobalProperties, setGlobalProperty } from '../store/GlobalPropertiesManager';

interface JoueurRepas {
  id: string;
  nom: string;
  dejeune: boolean;
}

interface RepasModalProps {
  visible: boolean;
  onValidate: (repasData: JoueurRepas[], repasArray: boolean[]) => void;
  onClose: (repasData: JoueurRepas[], repasArray: boolean[]) => void;
  joueurs: { id: string; nom: string }[];
  nbJoueursMax?: number;
  selectedValues: string[];
}

const RepasModal = ({
  visible,
  onClose,
  onValidate,
  joueurs,
  nbJoueursMax = 4,
  selectedValues,
}: RepasModalProps) => {
  // Récupérer les repas existants depuis getGlobalJsonObject().resa_repas
  const existingRepas = Array.isArray(getGlobalJsonObject().resa_repas)
    ? getGlobalJsonObject().resa_repas.slice(0, 4)
    : [false, false, false, false];

  // Filtrer les joueurs dont l'id est dans selectedValues ET non vide
  const joueursSelectionnes = joueurs.filter(
    joueur => selectedValues.includes(joueur.id) && joueur.id.trim() !== ""
  );

  // Si aucun joueur n'est trouvé mais qu'il y a une valeur dans selectedValues[0] (partie standard)
  const finalJoueursSelectionnes = joueursSelectionnes.length > 0
    ? joueursSelectionnes
    : (selectedValues[0] ? [joueurs[0]].filter(Boolean) : []);

  // État pour les repas des joueurs sélectionnés
  const [repasData, setRepasData] = useState<JoueurRepas[]>([]);

  // Initialiser repasData avec les valeurs existantes de repas
  useEffect(() => {
    if (finalJoueursSelectionnes.length > 0) {
      setRepasData(
        finalJoueursSelectionnes.map((joueur, index) => ({
          id: joueur.id,
          nom: joueur.nom,
          dejeune: existingRepas[index] || false, // Utiliser les valeurs existantes
        }))
      );
    }
  }, [finalJoueursSelectionnes, existingRepas]);

  // Référence pour stocker repasArray
  const repasArrayRef = useRef<boolean[]>([]);

  // Mettre à jour repasArrayRef quand repasData change
  useEffect(() => {
    repasArrayRef.current = repasData.map(repas => repas.dejeune);
  }, [repasData]);

  // État pour gérer l'état des boutons
  const [buttonStates, setButtonState] = useState<Record<string, boolean>>({
    'valider-btn': finalJoueursSelectionnes.length > 0,
  });

  // Fonction adaptée pour CustomButton
  const updateButtonState = (id: string, enabled: boolean) => {
    setButtonState(prev => ({
      ...prev,
      [id]: enabled,
    }));
  };

  // Activer le bouton "Valider" s'il y a au moins un joueur sélectionné
  useEffect(() => {
    updateButtonState('valider-btn', finalJoueursSelectionnes.length > 0);
  }, [finalJoueursSelectionnes]);

  // Gérer le changement de l'état "déjeune"
  const handleDejeuneChange = (id: string, value: boolean) => {
    setRepasData(prev =>
      prev.map(item => (item.id === id ? { ...item, dejeune: value } : item))
    );
  };

  // Valider les repas
  const handleValidate = () => {
    const repasArray = repasData.map(repas => repas.dejeune);
    onValidate(repasData, repasArray);
    setGlobalProperty('allResaRepas', repasArray);
    onClose(repasData, repasArray);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose(repasData, repasArrayRef.current)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Réservation des repas</Text>
          {repasData.length > 0 ? (
            repasData.map(joueur => (
              <View key={joueur.id} style={styles.joueurRow}>
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={joueur.dejeune ? 'checked' : 'unchecked'}
                    onPress={() => handleDejeuneChange(joueur.id, !joueur.dejeune)}
                  />
                  <Text style={styles.repasTitle}>Repas</Text>
                </View>
                <TextInput
                  style={styles.joueurNom}
                  value={joueur.nom}
                  editable={false}
                />
              </View>
            ))
          ) : (
            <Text style={styles.noPlayersText}>Aucun joueur sélectionné.</Text>
          )}
          <View style={styles.buttonRow}>
            <CustomButton
              id="valider-btn"
              title="Valider"
              onPress={handleValidate}
              buttonStates={buttonStates}
              setButtonState={updateButtonState}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#7ea5c9ff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  repasTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  joueurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    width: '100%',
  },
  joueurNom: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#d9dae6ff',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  noPlayersText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15,
  },
});

export default RepasModal;
