import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Checkbox } from 'react-native-paper';

import CustomButton from './CustomButton';

import { getGlobalJsonObject, getGlobalTeamLeader, setGlobalProperty } from '../store/GlobalPropertiesManager';

/*
 * Définition du menu proposé par la compétition.
 *
 * Le backend transmet soit :
 *
 *     menu_repas: []
 *
 * soit le record complet de agb_menu_repas.
 */
export interface MenuRepas {
  id?: string | null;
  nom_competition?: string | null;
  competition_key?: string | null;

  menu_A_E: string | null;
  menu_A_P: string | null;
  menu_A_D: string | null;

  menu_B_E: string | null;
  menu_B_P: string | null;
  menu_B_D: string | null;
}

/*
 * Choix réalisé pour un joueur.
 *
 * Chaque propriété contient directement le libellé sélectionné.
 */
interface MenuSelection {
  entree: string;
  plat: string;
  dessert: string;
}

/*
 * Objet repas d'un joueur.
 *
 * id correspond à la licence du joueur.
 *
 * choixMenu reprend le format historique du client Web :
 *
 *     entrée A,
 *     entrée B,
 *     plat A,
 *     plat B,
 *     dessert A,
 *     dessert B
 *
 * Exemple :
 *
 *     "Salade,,Poisson,,Tarte,"
 */
export interface JoueurRepas {
  id: string;
  nom: string;
  dejeune: boolean;
  choixMenu: string | null;
}

interface RepasModalProps {
  visible: boolean;

  onValidate: (
    repasData: JoueurRepas[],
    repasArray: boolean[],
  ) => void;

  onClose: (
    repasData: JoueurRepas[],
    repasArray: boolean[],
  ) => void;

  joueurs: {
    id: string;
    nom: string;
  }[];

  nbJoueursMax?: number;

  selectedValues: string[];
}

const EMPTY_MENU: MenuRepas = {
  menu_A_E: '',
  menu_A_P: '',
  menu_A_D: '',

  menu_B_E: '',
  menu_B_P: '',
  menu_B_D: '',
};

/*
 * Normalise menu_repas.
 *
 * PHP peut transmettre :
 *
 *     []
 *
 * ou :
 *
 *     {
 *         menu_A_E: "...",
 *         ...
 *     }
 */
const normalizeMenuRepas = (value: Partial<MenuRepas> | Partial<MenuRepas>[] | null | undefined): MenuRepas => {
  const source = Array.isArray(value) ? value[0] : value;

  return {
    id: source?.id ?? null,

    nom_competition: source?.nom_competition ?? null,

    competition_key: source?.competition_key ?? null,

    menu_A_E: String(source?.menu_A_E ?? '').trim(),

    menu_A_P: String(source?.menu_A_P ?? '').trim(),

    menu_A_D: String(source?.menu_A_D ?? '').trim(),

    menu_B_E: String(source?.menu_B_E ?? '').trim(),

    menu_B_P: String(source?.menu_B_P ?? '').trim(),

    menu_B_D: String(source?.menu_B_D ?? '').trim(),
  };
};

/*
 * Transforme la sélection du joueur dans le format historique
 * attendu par le backend.
 *
 * Le tableau contient toujours six positions :
 *
 *     0 : entrée A
 *     1 : entrée B
 *     2 : plat A
 *     3 : plat B
 *     4 : dessert A
 *     5 : dessert B
 */
const buildMenuChoice = (selection: MenuSelection, menus: MenuRepas): string => {
  const menuChoice = ['', '', '', '', '', ''];

  if (selection.entree === menus.menu_A_E) {
    menuChoice[0] = selection.entree;
  } else if (selection.entree === menus.menu_B_E) {
    menuChoice[1] = selection.entree;
  }

  if (selection.plat === menus.menu_A_P) {
    menuChoice[2] = selection.plat;
  } else if (selection.plat === menus.menu_B_P) {
    menuChoice[3] = selection.plat;
  }

  if (selection.dessert === menus.menu_A_D) {
    menuChoice[4] = selection.dessert;
  } else if (selection.dessert === menus.menu_B_D) {
    menuChoice[5] = selection.dessert;
  }

  return menuChoice.toString();
};

const RepasModal = ({
  visible,
  onClose,
  onValidate,
  joueurs,
  nbJoueursMax = 4,
  selectedValues,
}: RepasModalProps) => {
  const globalJsonObject = getGlobalJsonObject();

  /*
   * Repas déjà enregistrés par le backend.
   */
  const existingRepas =
    Array.isArray(globalJsonObject.resa_repas)
      ? globalJsonObject.resa_repas.slice(0, 4)
      : [false, false, false, false];

  /*
   * Définition du menu proposée par la compétition.
   */
  const menus = useMemo(() => normalizeMenuRepas(globalJsonObject.menu_repas), [globalJsonObject.menu_repas, visible]);

  /*
   * Le menu A est obligatoire.
   *
   * Le menu B peut être totalement ou partiellement absent.
   */
  const hasMenus = Boolean(menus.menu_A_E && menus.menu_A_P && menus.menu_A_D);

  /*
   * Recherche des joueurs réellement présents dans la
   * réservation.
   *
   * joueur.id correspond à la licence.
   */
  const joueursSelectionnes = joueurs.filter(joueur => selectedValues.includes(joueur.id) && joueur.id.trim() !== '');

  /*
   * Pour une réservation individuelle, joueursSelectionnes
   * peut être vide alors que selectedValues[0] est renseigné.
   */
  const finalJoueursSelectionnes = joueursSelectionnes.length > 0
    ? joueursSelectionnes.slice(0, nbJoueursMax)
    : selectedValues[0]
      ? [joueurs[0]].filter(Boolean)
      : [];

  /*
   * Structure de référence pour les repas.
   *
   * Elle contient :
   *
   *     - la licence ;
   *     - le nom ;
   *     - l'état repas ;
   *     - le choix de menu.
   */
  const [repasData, setRepasData] = useState<JoueurRepas[]>([]);

  /*
   * Sélections en cours, avant transformation dans le
   * format six positions du backend.
   */
  const [menuSelections, setMenuSelections] = useState<Record<string, MenuSelection>>({});

  const [menuModalVisible, setMenuModalVisible] = useState(false);

  const [activePlayer, setActivePlayer] = useState<JoueurRepas | null>(null);

  const [currentSelection, setCurrentSelection] = useState<MenuSelection>({
    entree: '',
    plat: '',
    dessert: '',
  });

  /*
  * Initialisation de l'objet repas à l'ouverture de la
  * fenêtre.
  */
  useEffect(() => {
    if (!visible) {
      return;
    }

    const globalJsonObject = getGlobalJsonObject();

    const isScramble = String(globalJsonObject.formule ?? '').toLowerCase().includes('scramble');

    const reservationContext = isScramble ? getGlobalTeamLeader().globalTeamLeaderObject : globalJsonObject;

    const existingRepas = Array.isArray(reservationContext.resa_repas) ? reservationContext.resa_repas : [];

    const existingMenus =
      Array.isArray(reservationContext.resa_menu)
        ? reservationContext.resa_menu
        : reservationContext.resa_menu
            ? [reservationContext.resa_menu]
            : [];
    setRepasData(
      finalJoueursSelectionnes.map(
        (joueur, index) => ({
          id: joueur.id,
          nom: joueur.nom,

          dejeune: existingRepas[index] === true || existingRepas[index] === 1 || existingRepas[index] === '1',

          choixMenu:
            existingMenus[index] != null &&
            String(existingMenus[index]).trim() !== ""
              ? String(existingMenus[index])
              : null,
        }),
      ),
    );

    setMenuSelections({});
    setActivePlayer(null);
    setMenuModalVisible(false);
  }, [visible]);

  /*
   * Valeur utilisée lors de la fermeture native de la modale.
   */
  const repasArrayRef = useRef<boolean[]>([]);

  useEffect(() => {
    repasArrayRef.current = repasData.map(repas => repas.dejeune);
  }, [repasData]);

  const [buttonStates, setButtonState] = useState<Record<string, boolean>>({
    'valider-btn': finalJoueursSelectionnes.length > 0,
  });

  const updateButtonState = (id: string, enabled: boolean) => {
    setButtonState(previous => ({
      ...previous,
      [id]: enabled,
    }));
  };

  useEffect(() => {
    updateButtonState('valider-btn', finalJoueursSelectionnes.length > 0);
  }, [finalJoueursSelectionnes.length]);

  /*
   * Active ou désactive le repas d'un joueur.
   *
   * Si le repas est décoché, le choix de menu est
   * également supprimé.
   */
  const handleDejeuneChange = (licence: string, value: boolean) => {
    setRepasData(previous =>
      previous.map(item =>
        item.id === licence
          ? {
              ...item,
              dejeune: value,

              choixMenu: value ? item.choixMenu : null,
            }
          : item,
      ),
    );

    if (!value) {
      setMenuSelections(previous => {
        const next = { ...previous };

        delete next[licence];

        return next;
      });
    }
  };

  /*
  * Ouvre la fenêtre de choix pour le joueur sélectionné.
  *
  * Lors de la première ouverture, la sélection enregistrée
  * pour le joueur est restaurée.
  *
  * Lors des ouvertures suivantes, la sélection modifiée
  * localement est conservée.
  */
  const openMenuChoice = (joueur: JoueurRepas) => {
    const localChoice = menuSelections[joueur.id];

    let initialSelection: MenuSelection;

    if (localChoice) {
      /*
      * Le joueur a déjà ouvert ou modifié son menu
      * pendant cette session.
      */
      initialSelection = localChoice;
    } else if (joueur.choixMenu && joueur.choixMenu.trim() !== '') {
      /*
      * La valeur enregistrée est de la forme :
      *
      * E_AA,,,P_BB,D_AA,
      */
      const selectedItems = joueur.choixMenu.split(',').map(item => item.trim()).filter(item => item !== '');

      initialSelection = {
        entree: selectedItems.find(item => item.startsWith('E_')) ?? '',
        plat: selectedItems.find(item => item.startsWith('P_')) ?? '',
        dessert: selectedItems.find(item => item.startsWith('D_')) ?? '',
      };
    } else {
      /*
      * Aucun choix n'est encore enregistré :
      * proposition par défaut du menu A.
      */
      initialSelection = {
        entree: menus.menu_A_E ?? "",
        plat: menus.menu_A_P ?? "",
        dessert: menus.menu_A_D ?? "",
      };
    }
    setActivePlayer(joueur);
    setCurrentSelection(initialSelection);
    setMenuModalVisible(true);
  };

  /*
   * Enregistre le choix du joueur dans renuasData.
   */
  const saveMenuChoice = () => {
    if (!activePlayer) {
      return;
    }

    const choixMenu = buildMenuChoice(currentSelection, menus);

    setMenuSelections(previous => ({
      ...previous,

      [activePlayer.id]: currentSelection,
    }));

    setRepasData(previous =>
      previous.map(item =>
        item.id === activePlayer.id
          ? {
              ...item,
              choixMenu,
            }
          : item,
      ),
    );

    setMenuModalVisible(false);
    setActivePlayer(null);
  };

  /*
   * Validation générale des repas et des menus.
   */
  const handleValidate = () => {
    /*
     * Lorsqu'un menu existe, chaque joueur prenant le repas
     * doit avoir ouvert et validé son choix.
     */
    const joueursSansMenu = hasMenus ? repasData.filter(joueur => joueur.dejeune && !joueur.choixMenu) : [];
    if (joueursSansMenu.length > 0) {
      
      Alert.alert('Choix du menu', `Sélectionnez le menu de ${joueursSansMenu[0].nom}.`);

      return;
    }

    /*
     * Tableau historique repas :
     *
     *     [true, false, ...]
     */
    const repasArray = repasData.map(repas => repas.dejeune);

    /*
     * Conservation du mécanisme déjà utilisé par resa.tsx.
     */
    setGlobalProperty('allResaRepas', repasArray);

    /*
     * L'objet repas enrichi est retourné à resa.tsx.
     *
     * Il n'est pas dupliqué dans GlobalProperties.
     */
    onValidate(repasData, repasArray);
    onClose(repasData, repasArray);
  };

  const renderChoice = (label: 'A' | 'B', value: string | null, selectedValue: string, onSelect: (value: string) => void) => {
    if (!value) {
      return null;
    }

    const selected = selectedValue === value;

    return (
      <TouchableOpacity
        style={styles.menuOption}
        onPress={() => onSelect(value)}
      >
        <View
          style={[
            styles.radioOuter,
            selected &&
              styles.radioOuterSelected,
          ]}
        >
          {selected && (
            <View
              style={styles.radioInner}
            />
          )}
        </View>

        <Text
          style={styles.menuOptionLabel}
        >
          {label}
        </Text>

        <TextInput
          style={styles.menuOptionValue}
          value={value}
          editable={false}
        />
      </TouchableOpacity>
    );
  };
    /*
   * Gère le retour natif Android selon la vue courante.
   *
   * Lorsque le choix du menu est affiché, le retour revient à
   * la réservation des repas sans fermer RepasModal.
   *
   * Lorsque la réservation des repas est affichée, le retour
   * ferme RepasModal.
   */
  const handleNativeBack = () => {
    if (menuModalVisible) {
      setMenuModalVisible(false);
      setActivePlayer(null);
      return;
    }

    onClose(repasData, repasArrayRef.current);
  };

  /*
   * Quitte le choix du menu sans enregistrer les modifications
   * réalisées depuis son ouverture.
   */
  const closeMenuChoice = () => {
    setMenuModalVisible(false);
    setActivePlayer(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleNativeBack}
    >
      <View
        style={styles.modalContainer}
      >
        {menuModalVisible ? (
          /*
           * Une seule modale native est utilisée.
           *
           * La vue Menu remplace temporairement la vue Repas,
           * conformément au fonctionnement du client Web.
           */
          <View
            style={styles.menuModalContent}
          >
            <Text
              style={styles.modalTitle}
            >
              Choix du menu
            </Text>

            <Text
              style={styles.playerName}
            >
              {activePlayer?.nom}
            </Text>

            <ScrollView>
              <Text
                style={styles.menuSectionTitle}
              >
                Entrée
              </Text>

              {renderChoice(
                'A',
                menus.menu_A_E,
                currentSelection.entree,
                value => setCurrentSelection(previous => ({ ...previous, entree: value })),
              )}

              {renderChoice(
                'B',
                menus.menu_B_E,
                currentSelection.entree,
                value => setCurrentSelection(previous => ({ ...previous, entree: value })),
              )}

              <Text
                style={styles.menuSectionTitle}
              >
                Plat
              </Text>

              {renderChoice(
                'A',
                menus.menu_A_P,
                currentSelection.plat,
                value => setCurrentSelection(previous => ({ ...previous, plat: value })),
              )}

              {renderChoice(
                'B',
                menus.menu_B_P,
                currentSelection.plat,
                value => setCurrentSelection(previous => ({ ...previous, plat: value })),
              )}

              <Text
                style={styles.menuSectionTitle}
              >
                Dessert
              </Text>

              {renderChoice(
                'A',
                menus.menu_A_D,
                currentSelection.dessert,
                value => setCurrentSelection(previous => ({ ...previous, dessert: value })),
              )}

              {renderChoice(
                'B',
                menus.menu_B_D,
                currentSelection.dessert,
                value => setCurrentSelection(previous => ({ ...previous, dessert: value })),
              )}
            </ScrollView>

            <View
              style={styles.menuActions}
            >
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeMenuChoice}
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Quitter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={saveMenuChoice}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Valider
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View
            style={styles.modalContent}
          >
            <Text
              style={styles.modalTitle}
            >
              Réservation des repas
            </Text>

            {repasData.length > 0 ? (
              repasData.map(joueur => (
                <View
                  key={joueur.id}
                  style={styles.joueurRow}
                >
                  <View
                    style={styles.playerLine}
                  >
                    <View style={styles.checkboxContainer}>
                      <TouchableOpacity
                        style={styles.customCheckbox}
                        onPress={() =>
                          handleDejeuneChange(joueur.id, !joueur.dejeune)
                        }
                      >
                        {joueur.dejeune && (
                          <Text style={styles.customCheckboxCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                        <Text style={styles.repasTitle}>
                          Repas
                        </Text>
                    </View>
                    <Text
                      style={styles.joueurNom}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {joueur.nom}
                    </Text>
                  </View>

                  {hasMenus &&
                    joueur.dejeune && (
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => openMenuChoice(joueur)}
                      >
                        <Text
                          style={
                            styles.menuButtonText
                          }
                        >
                          {joueur.choixMenu
                            ? 'Modifier le menu'
                            : 'Choisir le menu'}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              ))
            ) : (
              <Text
                style={styles.noPlayersText}
              >
                Aucun joueur sélectionné.
              </Text>
            )}

            <View
              style={styles.buttonRow}
            >
              <CustomButton
                id="valider-btn"
                title="Valider"
                onPress={handleValidate}
                buttonStates={buttonStates}
                setButtonState={updateButtonState}
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',

      backgroundColor:
        'rgba(0, 0, 0, 0.5)',
    },

    modalContent: {
      backgroundColor: '#7ea5c9ff',
      borderRadius: 10,
      padding: 20,
      width: '90%',
      maxWidth: 430,

      borderBottomWidth: 1,
      borderBottomColor: 'black',
    },

    menuModalContent: {
      backgroundColor: '#7ea5c9ff',
      borderRadius: 10,
      padding: 20,
      width: '90%',
      maxWidth: 430,
      maxHeight: '82%',
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
    },

    playerName: {
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 12,
    },

    repasTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      marginLeft: 8,
    },

    joueurRow: {
      marginBottom: 12,

      borderBottomWidth: 1,
      borderBottomColor: '#eee',

      paddingBottom: 12,
      width: '100%',
    },

    playerLine: {
      flexDirection: 'row',
      alignItems: 'center',
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

    menuButton: {
      alignSelf: 'flex-end',

      marginTop: 8,

      paddingVertical: 8,
      paddingHorizontal: 14,

      borderRadius: 5,
      backgroundColor: '#2f8de4',
    },

    menuButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },

    menuSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',

      marginTop: 12,
      marginBottom: 5,
    },

    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',

      minHeight: 44,
      paddingVertical: 6,
    },

    radioOuter: {
      width: 24,
      height: 24,

      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#1d1d1d',

      alignItems: 'center',
      justifyContent: 'center',

      marginRight: 10,
    },

    radioOuterSelected: {
      borderColor: '#138d3d',
    },

    radioInner: {
      width: 12,
      height: 12,

      borderRadius: 6,
      backgroundColor: '#138d3d',
    },

    menuOptionLabel: {
      width: 24,
      fontWeight: 'bold',
    },

    menuOptionValue: {
      flex: 1,

      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 4,

      padding: 8,
      backgroundColor: '#d9dae6ff',
    },

    buttonRow: {
      flexDirection: 'row',
      marginTop: 20,
      justifyContent: 'flex-end',
    },

    menuActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',

      gap: 10,
      marginTop: 18,
    },

    primaryButton: {
      backgroundColor: '#2f8de4',

      paddingVertical: 10,
      paddingHorizontal: 18,

      borderRadius: 5,
    },

    primaryButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },

    secondaryButton: {
      backgroundColor: '#eef0f5',

      paddingVertical: 10,
      paddingHorizontal: 18,

      borderRadius: 5,
    },

    secondaryButtonText: {
      color: '#1598bd',
      fontWeight: 'bold',
    },

    noPlayersText: {
      textAlign: 'center',
      fontSize: 16,
      marginBottom: 15,
    },
    customCheckbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: '#181717ff',
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },

    customCheckboxCheck: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 22,
      color: '#099237ff',
    },
  });

export default RepasModal;