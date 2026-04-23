// src/reservation/PaymentResultScreen.tsx
import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import PaymentResultModal from '../components/PaymentResultModal';
import { PaymentResultParams } from '../types/navigation';
import { getGlobalJsonObject, getGlobalProperties } from '../store/GlobalPropertiesManager';

// Définir les types pour la navigation
type RootStackParamList = {
  Home: undefined;
  PaymentResult: PaymentResultParams;
  DisplayListPlayers: { data: string; paymentsData: string };
};

type PaymentResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentResult'>;
type PaymentResultScreenRouteProp = RouteProp<RootStackParamList, 'PaymentResult'>;

const PaymentResultScreen = () => {
  const navigation = useNavigation<PaymentResultScreenNavigationProp>();
  const route = useRoute<PaymentResultScreenRouteProp>();
  const [showModal, setShowModal] = useState(true);

  // Récupérer les paramètres avec typage fort
  const params = route.params || {};

  // Déstructuration avec valeurs par défaut
  const {
    status = 'default',
    nom_competition = '',
    prenom = '',
    montant = '0',
    isEclectic = false,
    montantBrut = '0',
    isResynchronized = false,
  } = params;

  // Conversion des valeurs string en boolean si nécessaire
  const finalIsEclectic = typeof isEclectic === 'string' ? isEclectic === 'true' : isEclectic;
  const finalIsResynchronized = typeof isResynchronized === 'string' ? isResynchronized === 'true' : isResynchronized;

  // Récupérer les données globales
  const globalProperties= getGlobalProperties();

  const handleCloseModal = () => {
    // Naviguer vers DisplayListPlayers avec les données
    navigation.navigate('DisplayListPlayers', {
      data: JSON.stringify(globalProperties.transformedData || []),
      paymentsData: JSON.stringify(globalProperties.transformedDataPayments || [])
    });
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <PaymentResultModal
          status={status}
          competitionName={nom_competition}
          playerName={prenom}
          amount={montant}
          grossAmount={montantBrut}
          isEclectic={finalIsEclectic}
          isResynchronized={finalIsResynchronized}
          onClose={handleCloseModal}
          onBackToHome={() => navigation.navigate('Home')}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PaymentResultScreen;
