// src/components/PaymentResultModal.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface PaymentResultModalProps {
  status: string;
  competitionName: string;
  playerName: string;
  amount: string;
  grossAmount: string;
  isEclectic: boolean;
  isResynchronized: boolean;
  onClose: () => void;
  onBackToHome: () => void;
}

const PaymentResultModal = ({
  status,
  competitionName,
  playerName,
  amount,
  grossAmount,
  isEclectic,
  isResynchronized,
  onClose,
  onBackToHome
}: PaymentResultModalProps) => {
  const getStatusInfo = () => {
    const statusMap = {
      '000': { text: 'Paiement accepté', color: '#27ae60', icon: '✓' },
      '002': { text: 'Paiement en attente', color: '#f39c12', icon: '⏳' },
      '008': { text: 'Paiement annulé', color: '#e74c3c', icon: '✗' },
      'default': { text: 'Statut inconnu', color: '#95a5a6', icon: '?' }
    } as any;
    return statusMap[status] || statusMap.default;
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {/* En-tête */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Résultat du paiement</Text>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.icon} {statusInfo.text}
          </Text>
        </View>

        {/* Contenu */}
        <ScrollView style={styles.modalBody}>
          <InfoRow label="Compétition" value={competitionName} />
          <InfoRow label="Type" value={isEclectic ? 'Eclectic' : 'Standard'} />
          <InfoRow label="Joueur" value={playerName} />
          <InfoRow label="Montant net" value={`${amount} €`} />
          <InfoRow label="Montant brut" value={`${grossAmount} €`} />

          {isResynchronized && (
            <View style={styles.resyncContainer}>
              <Text style={styles.resyncText}>⚠️ Données resynchronisées</Text>
            </View>
          )}

          <Text style={styles.messageText}>
            {status === '000'
              ? 'Votre paiement a été traité avec succès.'
              : 'Votre paiement est en cours de traitement.'}
          </Text>
        </ScrollView>

        {/* Pied avec boutons */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.seeListButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Voir la liste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={onBackToHome}
          >
            <Text style={[styles.buttonText, styles.homeButtonText]}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Composant réutilisable pour afficher une ligne d'information
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 15,
    maxHeight: '60%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    width: 110,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  resyncContainer: {
    marginVertical: 10,
    padding: 8,
    backgroundColor: '#fdebd0',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  resyncText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  seeListButton: {
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  homeButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  homeButtonText: {
    color: 'white',
  },
});

export default PaymentResultModal;
