// CarouselModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import HTML from 'react-native-render-html';

const { width, height } = Dimensions.get('window');

interface CarouselModalProps {
  visible: boolean;
  onClose: () => void;
  onAbandon: () => void;
  onContinue: () => void;
  image1: any;
  image2: any;
  nbrDaysCancelRefunded: string | null;
}

const CarouselModal: React.FC<CarouselModalProps> = ({
  visible,
  onClose,
  onAbandon,
  onContinue,
  image1,
  image2,
  nbrDaysCancelRefunded,
}) => {
  const [currentView, setCurrentView] = useState(0);
  const totalViews = 3;

  const nextView = () => {
    if (currentView < totalViews - 1) {
      setCurrentView(currentView + 1);
    }
  };

  const prevView = () => {
    if (currentView > 0) {
      setCurrentView(currentView - 1);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.carouselContent}>
          {currentView === 0 && (
            <View style={styles.textView}>
              <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Attention !!!</Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', textAlign: 'center' }}>
                Dans la phase initiale du paiement
              </Text>
              <Text style={{ textAlign: 'center' }}>
                vous devrez activer le bouton
                <Text style={{ fontSize: 15, color: 'blue', fontWeight: 'bold' }}> MODIFIER </Text>
              </Text>
              <Text style={{ textAlign: 'center' }}>
                de la ligne
                <Text style={{ fontWeight: 'bold', fontSize: 15, fontStyle: 'italic' }}> Modifier la contribution volontaire </Text>
              </Text>
              <Text style={{ textAlign: 'center' }}>
                si vous ne souhaitez pas faire un don au prestataire
              </Text>
              <Text style={{ textAlign: 'center', marginTop: 10 }}>
                Toute annulation de réservation (hors contrainte personnelle)
              </Text>
              <Text style={{ textAlign: 'center' }}>
                à moins de {nbrDaysCancelRefunded} jour(s) de la compétition ne sera pas remboursée
              </Text>
            </View>
          )}
            {currentView === 1 && (
              <View style={styles.imageView}>
                <Image source={image1} style={styles.image} resizeMode="contain" />
              </View>
            )}
            {currentView === 2 && (
              <View style={styles.imageView}>
                <Image source={image2} style={styles.image} resizeMode="contain" />
              </View>
            )}
          </View>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, currentView === 0 && styles.disabledButton]}
              onPress={prevView}
              disabled={currentView === 0}
            >
              <Text style={styles.navButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              {currentView + 1} / {totalViews}
            </Text>
            <TouchableOpacity
              style={[styles.navButton, currentView === totalViews - 1 && styles.disabledButton]}
              onPress={nextView}
              disabled={currentView === totalViews - 1}
            >
              <Text style={styles.navButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.abandonButton} onPress={onAbandon}>
              <Text style={styles.abandonButtonText}>Abandonner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>Continuer</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: width * 1,
    height: height * 0.89,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  carouselContent: {
    flex: 1,
    width: '100%',
  },
  textView: {
    flex: 1,
    padding: 10,
    marginTop:100,
  },
  imageView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  navButton: {
    padding: 5,
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.3,
  },
  pageIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  abandonButton: {
    backgroundColor: '#4284dbff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  abandonButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#4284dbff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CarouselModal;
