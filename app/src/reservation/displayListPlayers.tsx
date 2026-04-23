import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, Modal, Text, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import CustomHeader from '../components/CustomHeader';
import { Checkbox } from 'expo-checkbox';
import { getGlobalJsonObject } from '../store/GlobalPropertiesManager';
import HTML, { MixedStyleDeclaration } from 'react-native-render-html';

interface Player {
  title: string;
  whs_index: string;
  serie: string;
  cb?: string;
  repere?: string;
  licence?: string;
}

interface ExpectedPaymentResultParams {
  status?: string;
  prenom?: string;
  montant?: string;
  nom_competition?: string;
  isEclectic?: string;
  isResynchronized?: string;
  data?: string;
  paymentsData?: string;
}

const DisplayListPlayers = () => {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams() as any;
  const [players, setPlayers] = useState<Player[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(!!params.status);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getBooleanParam = useCallback((param?: string | string[]): boolean => {
    if (Array.isArray(param)) return param[0] === 'true';
    return param === 'true';
  }, []);

  useEffect(() => {
    setIsLoading(true);
    try {
      if (params.data) {
        const parsedData = typeof params.data === 'string' ? JSON.parse(params.data) : params.data;
        if (Array.isArray(parsedData)) setPlayers(parsedData);
      }
      if (params.paymentsData) {
        const parsedPayments = typeof params.paymentsData === 'string' ? JSON.parse(params.paymentsData) : params.paymentsData;
        if (Array.isArray(parsedPayments)) setPayments(parsedPayments);
      }
    } catch (error) {
      console.error("Erreur de parsing des données :", error);
      setPlayers([]);
      setPayments([]);
    } finally {
      setIsTransitioning(false);
    }
  }, [params.data, params.paymentsData]);

  useEffect(() => {
    const initialCheckedItems: Record<string, boolean> = {};
    players.forEach(player => {
      if (player.licence) {
        initialCheckedItems[player.licence] = payments.some(p => p.licence === player.licence);
      }
    });
    setCheckedItems(initialCheckedItems);
    setIsLoading(false);
  }, [players, payments]);

  const getTitleTextStyle = useCallback((item: Player): MixedStyleDeclaration => {
    if (item.title.includes('TRANCHE')) {
      return { fontSize: 16, fontWeight: '700', color: '#0000ff', textAlign: 'center' };
    }
    else if (item.title.includes('----- Joueur à trouver')) {
      return { fontSize: 16, fontWeight: '700', color: '#3f7beb', textAlign: 'center' };
    }
    else if (item.title.includes('---')) {
      return { fontSize: 16, fontWeight: '700', color: '#e315e4', textAlign: 'center' };
    }
    else if (!item.serie) {
      return { fontSize: 16, fontWeight: '700', color: '#000', textAlign: 'center' };
    }
    return { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' };
  }, []);

  const isHeaderItem = useCallback((item: Player): boolean => {
    return item.title.includes('TRANCHE') || item.title.includes('---') || !item.serie;
  }, []);

  const handleCheckboxChange = useCallback((licence: string, newValue: boolean) => {
    setCheckedItems(prev => ({ ...prev, [licence]: newValue }));
  }, []);

  const HeaderRow = () => (
    <View style={styles.headerRow}>
      <View style={[styles.titleCell, { justifyContent: 'center' }]}>
        <Text style={styles.headerText}>Titre</Text>
      </View>
      <View style={[styles.serieCell, { justifyContent: 'center' }]}>
        <Text style={styles.headerText}>Série</Text>
      </View>
      <View style={[styles.indexCell, { justifyContent: 'center' }]}>
        <Text style={styles.headerText}>Index</Text>
      </View>
      <View style={[styles.cbCell, { justifyContent: 'center' }]}>
        <Text style={styles.headerText}>CB</Text>
      </View>
    </View>
  );
  const TitleRow = ({ item }: { item: Player }) => {
    const htmlContent = item.title.includes('<')
      ? item.title
      : `<div style="text-align:center">${item.title}</div>`;

    return (
      <View style={styles.titleRow}>
        <HTML
          source={{ html: htmlContent }}
          contentWidth={width}
          baseStyle={{ fontSize: 16, textAlign: 'center' }}
          tagsStyles={{
            div: getTitleTextStyle(item),
            p: getTitleTextStyle(item),
            span: getTitleTextStyle(item),
          }}
        />
      </View>
    );
  };

  const PlayerRow = ({ item }: { item: Player }) => {
    const licence = item.licence;
    const isChecked = licence ? checkedItems[licence] || false : false;

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.titleCell]} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={[styles.cell, styles.serieCell]} numberOfLines={1} ellipsizeMode="tail">
          {item.serie}
        </Text>
        <Text style={[styles.cell, styles.indexCell]} numberOfLines={1} ellipsizeMode="tail">
          {item.whs_index}
        </Text>
        <View style={[styles.cell, styles.cbCell]}>
          {licence && (
            <Checkbox
              value={isChecked}
              onValueChange={() => {}}  // Désactive le changement de valeur
              color={isChecked ? "#099237ff" : "#ccc"}  // Couleur verte quand coché
            />
          )}
        </View>
      </View>
    );
  };

  const renderItem = useCallback(({ item }: { item: Player }) => {
    return isHeaderItem(item) ? <TitleRow item={item} /> : <PlayerRow item={item} />;
  }, [checkedItems, isHeaderItem]);

  const globalJson = useMemo(() => getGlobalJsonObject(), []);
  const competitionName = globalJson.nom_competition || '';
  const competitionDate = globalJson.date_competition || '';

  const PaymentResultModal = () => {
    if (!params.status) return null;

    const statusMap: Record<string, { text: string; color: string; icon: string }> = {
      '000': { text: 'Paiement accepté', color: '#27ae60', icon: '✓' },
      '001': { text: 'Paiement en cours', color: '#3498db', icon: '⏳' },
      '002': { text: 'Paiement en attente', color: '#f39c12', icon: '⏳' },
      '008': { text: 'Paiement annulé', color: '#e74c3c', icon: '✗' },
      '009': { text: 'Paiement refusé', color: '#e74c3c', icon: '✗' },
      'default': { text: 'Statut inconnu', color: '#95a5a6', icon: '?' }
    };

    const statusInfo = statusMap[params.status!] || statusMap.default;

    return (
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.modalTitle}>{statusInfo.icon} Résultat du paiement</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalStatus}>{statusInfo.text}</Text>
              {params.nom_competition && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Compétition:</Text>
                  <Text style={styles.modalInfoValue}>{String(params.nom_competition)}</Text>
                </View>
              )}
              {params.prenom && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Joueur:</Text>
                  <Text style={styles.modalInfoValue}>{String(params.prenom)}</Text>
                </View>
              )}
              {params.montant && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Montant:</Text>
                  <Text style={styles.modalInfoValue}>{String(params.montant)} €</Text>
                </View>
              )}
              {params.isEclectic !== undefined && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Type:</Text>
                  <Text style={styles.modalInfoValue}>
                    {getBooleanParam(params.isEclectic) ? 'Éclectique' : 'Standard'}
                  </Text>
                </View>
              )}
              {getBooleanParam(params.isResynchronized) && (
                <View style={styles.resyncContainer}>
                  <Text style={styles.resyncText}>⚠️ Données resynchronisées</Text>
                </View>
              )}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Écran de transition
  if (isTransitioning) {
    return (
      <View style={styles.transitionOverlay}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.transitionText}>Chargement en cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader />
      <View style={styles.moduleHeader}>
        <Text style={styles.moduleTitle}>{`${competitionName} - ${competitionDate}`}</Text>
      </View>
      <HeaderRow />
      <FlatList
        data={players}
        renderItem={renderItem}
        keyExtractor={(_, index) => `player-${index}`}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        extraData={checkedItems}
        style={styles.flatListContainer}
      />
      <PaymentResultModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0.94,
    backgroundColor: '#eaeef7ff',
  },
  moduleHeader: {
    padding: 16,
    backgroundColor: '#cbd3e4ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'center',
  },
  flatListContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#dde9f5ff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    color: '#000',
  },
  headerTitleCell: {
    flex: 0.9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleRow: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  cell: {
    paddingHorizontal: 8,
  },
  titleCell: {
    flex: 3,
  },
  serieCell: {
    flex: 1,
  },
  indexCell: {
    flex: 1,
  },
  cbCell: {
    flex: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
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
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 15,
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalBody: {
    padding: 20,
  },
  modalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalInfoLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  modalInfoValue: {
    flex: 1,
  },
  resyncContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fdebd0',
    borderRadius: 4,
  },
  resyncText: {
    color: '#856404',
    fontSize: 13,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Styles pour l'écran de transition
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  transitionText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default DisplayListPlayers;