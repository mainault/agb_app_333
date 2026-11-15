import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import ScreenContainer from './src/components/ScreenContainer';
import RepasModal, { JoueurRepas, MenuRepas } from './src/components/RepasModal';
import {
  AdminSession,
  getAdminBootstrap,
  loginAdmin,
  logoutAdmin,
  sendAdminRequest,
} from './src/utils/adminAuth';
import { Ionicons } from '@expo/vector-icons';

type AdminCompetition = {
  competition_key: string | number;
  nom_competition: string;
  date_competition: string;
  date_tri: string;
  etat: string;
  parameter_formula: string;
  autre_formule: string | null;
  isEclectic: string;
  competitionClass: string;
};

type AdminCategory = 'standard' | 'eclectic' | 'challenge' | 'ringer' | 'bacattss';

const ADMIN_CATEGORIES: {
  id: AdminCategory;
  label: string;
}[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'eclectic', label: 'Eclectic' },
  { id: 'challenge', label: 'Challenge hiver' },
  { id: 'ringer', label: 'Ringer Score' },
  { id: 'bacattss', label: 'BACATTSS' },
];

function belongsToCategory(
  competition: AdminCompetition,
  category: AdminCategory,
): boolean {
  const isBacattss = competition.autre_formule?.trim().toUpperCase() === 'BACATTSS';

  switch (category) {
    case 'standard':
      return competition.isEclectic === 'isNotEclectic' && !isBacattss;
    case 'eclectic':
      return competition.isEclectic === 'isEclectic';
    case 'challenge':
      return competition.isEclectic === 'isEclectic-IS';
    case 'ringer':
      return competition.isEclectic === 'isRingerScore';
    case 'bacattss':
      return competition.isEclectic === 'isNotEclectic' && isBacattss;
  }
}

type AdminPlayer = {
  login?: string;
  licence: string;
  civilite: string;
  nom: string;
  prenom: string;
  whs_index: string;
  repere: string;
};

type MassResaResponse = {
  status: string;
  error?: string;
  resaState: string;
  licence: string;
  whs_index: string;
  serie: string;
  repere: string;
  tranche?: string;
  periode?: string;
  numTranche?: number;
  admin_commentaire?: string | null;
  resa_repas?: (string | number)[];
  choix_menu?: string;
  tranche_duree?: string | number;
  duree_trou?: string | number;
  nbre_joueurs?: string | number;
};

type RegisteredRow = {
  admin_commentaire?: string | null;
  title: string;
  licence?: string;
  whs_index?: string | number | null;
  serie?: string;
  repere?: string;
  resa_repas?: string | number;
};
type PaymentRow = { licence: string; statut?: string };
type RegisteredResponse = {
  playersList: RegisteredRow[];
  paymentsList?: PaymentRow[];
  nbrPlayers?: string | number;
  formule?: string;
  autreFormule?: string;
};
type FormContext = {
  formule?: string;
  resa_repas?: unknown;
  resa_menu?: unknown;
};
type TrancheResponse = {
  id: (string | number)[];
  tranches: string[];
  duree_trou?: string | number;
};
type TrancheOption = { id: string; label: string };
const PERIODS = ['Début', 'Milieu', 'Fin'] as const;
type Period = (typeof PERIODS)[number];
const TEES = ['blanc', 'jaune', 'bleu', 'rouge'] as const;
const flag = (value: unknown) =>
  [true, 1, '1', 'true'].includes(value as string | number | boolean);
const textOnly = (value: unknown): string =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trim();
const periodFromTitle = (value: unknown): Period | null => {
  const title = textOnly(value).toLocaleLowerCase('fr');
  return PERIODS.find((period) => title.includes(period.toLocaleLowerCase('fr'))) ?? null;
};
const playerLabel = (player: AdminPlayer) => player.nom + ' - ' + player.prenom;
const isPlayerRow = (row: RegisteredRow) =>
  Boolean(row.licence) && row.whs_index !== '' && row.whs_index != null;
// Exclut les titres d'équipe, qui portent parfois eux aussi une licence.
const isScrambleFormula = (value: unknown) => /scramble/i.test(String(value ?? ''));

const TEE_COLORS: Record<string, string> = {
  blanc: '#ffffff',
  jaune: '#ffe033',
  bleu: '#2467ce',
  rouge: '#df3030',
};

type ReservationFormValues = {
  trancheId: string;
  period: Period | null;
  tee: string;
  comment: string;
  meal: boolean;
  menu: string | null | undefined;
};

const normalizeMealMenu = (value: string | null | undefined): string => {
  const parts = (value === '0' ? '' : (value ?? ''))
    .split(',')
    .map((item) => item.trim());
  return parts.some(Boolean) ? parts.join(',') : '';
};

const reservationFormChanged = (
  current: ReservationFormValues,
  saved: ReservationFormValues,
): boolean =>
  current.trancheId !== saved.trancheId ||
  current.period !== saved.period ||
  current.tee !== saved.tee ||
  current.comment !== saved.comment ||
  current.meal !== saved.meal ||
  (current.meal && normalizeMealMenu(current.menu) !== normalizeMealMenu(saved.menu));

// Les envois restent distincts des écritures : jamais de répétition automatique.
async function attemptAdminMail(
  payload: Record<string, unknown>,
  expectedRecipients?: number,
): Promise<string> {
  try {
    const response = await sendAdminRequest<{
      mailSent?: boolean;
      warnings?: string[];
      error?: string;
    }>(payload);
    if (
      response.mailSent === false ||
      (expectedRecipients === undefined && response.mailSent !== true)
    )
      throw new Error('Envoi non confirmé.');
    if (expectedRecipients !== undefined) {
      const count = /Nombre de courriers émis\s*:\s*(\d+)/i.exec(response.error ?? '');
      if (!count || Number(count[1]) !== expectedRecipients) {
        throw new Error(
          `Envois confirmés : ${count?.[1] ?? 'inconnus'} sur ${expectedRecipients}.`,
        );
      }
    }
    return (response.warnings ?? []).join(' ');
  } catch (exception) {
    return (
      'Courriel(s) non confirmé(s) : ' +
      textOnly(exception instanceof Error ? exception.message : 'Envoi impossible.') +
      ' Ne répétez pas la réservation pour renvoyer un courriel.'
    );
  }
}

export default function Administration() {
  const router = useRouter();

  // Authentification et navigation.
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [competitionsLoaded, setCompetitionsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<AdminCompetition | null>(
    null,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [scrambleEditorOpen, setScrambleEditorOpen] = useState(false);
  const pending = useRef(false);
  const screenEpoch = useRef(0);

  // Liste des inscrits, distincte du catalogue utilisé dans la dropdown.
  const [registered, setRegistered] = useState<RegisteredResponse | null>(null);
  const [registeredLoaded, setRegisteredLoaded] = useState(false);

  // Formulaire individuel : le joueur reste dans le sélecteur.
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [formLoaded, setFormLoaded] = useState(false);
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [tranches, setTranches] = useState<TrancheOption[]>([]);
  const [shotgun, setShotgun] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);
  const [playerReservation, setPlayerReservation] = useState<MassResaResponse | null>(
    null,
  );
  const [selectedTrancheId, setSelectedTrancheId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedTee, setSelectedTee] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealReviewed, setMealReviewed] = useState(false);
  const [mealData, setMealData] = useState<JoueurRepas | null>(null);
  const [mealMenu, setMealMenu] = useState<Partial<MenuRepas> | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [writeUncertain, setWriteUncertain] = useState(false);

  const categoryLabel = ADMIN_CATEGORIES.find(
    (item) => item.id === selectedCategory,
  )?.label;
  const visibleCompetitions = competitions.filter(
    (item) => selectedCategory !== null && belongsToCategory(item, selectedCategory),
  );
  const search = playerSearch.trim().toLocaleLowerCase('fr');
  const filteredPlayers = players.filter(
    (player) =>
      !search ||
      (player.nom + ' ' + player.prenom).toLocaleLowerCase('fr').startsWith(search) ||
      player.licence.startsWith(search),
  );
  const scramble =
    isScrambleFormula(registered?.formule) ||
    isScrambleFormula(registered?.autreFormule) ||
    isScrambleFormula(selectedCompetition?.autre_formule);
  const canEdit =
    formLoaded && playerReservation !== null && selectedPlayer !== null && !busy;
  const savedTrancheIndex = Number(playerReservation?.numTranche);
  const savedTrancheId =
    playerReservation?.resaState === 'Resa'
      ? (tranches[savedTrancheIndex]?.id ?? '')
      : shotgun
        ? (tranches[0]?.id ?? '')
        : '';
  const savedPeriod =
    playerReservation?.resaState === 'Resa'
      ? periodFromTitle(playerReservation.periode)
      : shotgun && tranches[0]
        ? 'Début'
        : null;
  const hasReservationChanges =
    playerReservation !== null &&
    reservationFormChanged(
      {
        trancheId: selectedTrancheId,
        period: selectedPeriod,
        tee: selectedTee,
        comment: adminComment,
        meal: mealData?.dejeune ?? flag(playerReservation.resa_repas?.[0]),
        menu: mealData?.choixMenu,
      },
      {
        trancheId: savedTrancheId,
        period: savedPeriod,
        tee: String(playerReservation.repere ?? '').toLocaleLowerCase('fr'),
        comment: playerReservation.admin_commentaire ?? '',
        meal: flag(playerReservation.resa_repas?.[0]),
        menu: playerReservation.choix_menu,
      },
    );

  useEffect(() => {
    if (hasReservationChanges) setNotice('');
  }, [hasReservationChanges]);

  const canSave =
    canEdit &&
    !writeUncertain &&
    !!selectedTrancheId &&
    !!selectedPeriod &&
    TEES.some((tee) => tee === selectedTee) &&
    (playerReservation?.resaState !== 'Resa' || hasReservationChanges);
  const canRemove = canEdit && !writeUncertain && playerReservation?.resaState === 'Resa';
  const support = Platform.OS === 'android' ? 'APP_ANDROID' : 'APP_IOS';

  // Invalide les réponses d'un écran quitté et bloque les doubles appuis.
  const run = async (work: (isCurrent: () => boolean) => Promise<void>) => {
    if (pending.current) return;
    const epoch = screenEpoch.current;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const isCurrent = () => epoch === screenEpoch.current;
    try {
      await work(isCurrent);
    } catch (exception) {
      if (isCurrent())
        setError(
          textOnly(
            exception instanceof Error ? exception.message : 'Demande impossible.',
          ),
        );
    } finally {
      if (isCurrent()) {
        pending.current = false;
        setBusy(false);
      }
    }
  };

  const clearPlayer = () => {
    setSelectedPlayer(null);
    setPlayerReservation(null);
    setSelectedTrancheId('');
    setSelectedPeriod(null);
    setSelectedTee('');
    setAdminComment('');
    setMealModalOpen(false);
    setMealData(null);
    setMealReviewed(false);
    setMealMenu(null);
    setCommentModalOpen(false);
    setCommentDraft('');
    setWriteUncertain(false);
  };
  const clearForm = () => {
    clearPlayer();
    setPlayers([]);
    setTranches([]);
    setFormContext(null);
    setFormLoaded(false);
    setShotgun(false);
    setPickerOpen(false);
    setPlayerSearch('');
  };
  const clearCompetition = () => {
    setScrambleEditorOpen(false);
    setSelectedCompetition(null);
    setRegistered(null);
    setRegisteredLoaded(false);
    setEditorOpen(false);
    clearForm();
  };
  const requestContext = (competition: AdminCompetition) => ({
    nom_competition: competition.nom_competition,
    competitionClass: competition.competitionClass,
    isEclectic: competition.isEclectic,
    isMobile: '1',
    support,
  });

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      screenEpoch.current += 1;
      pending.current = false;
      setBusy(false);
      setChecking(true);
      setSession(null);
      setError('');
      setNotice('');
      setCompetitions([]);
      setCompetitionsLoaded(false);
      setSelectedCategory(null);
      clearCompetition();
      getAdminBootstrap<AdminCompetition>()
        .then((result) => {
          if (!active || !result) return;
          setCompetitions(result.competitions);
          setCompetitionsLoaded(true);
          setSession(result.session);
        })
        .catch((exception) => {
          if (active)
            setError(
              exception instanceof Error ? exception.message : 'Chargement impossible.',
            );
        })
        .finally(() => {
          if (active) setChecking(false);
        });
      return () => {
        active = false;
        screenEpoch.current += 1;
      };
    }, []),
  );

  const connect = () => {
    if (!login.trim() || !password) return;
    void run(async (isCurrent) => {
      try {
        const value = await loginAdmin(login, password);
        if (!isCurrent()) return;
        clearCompetition();
        setSelectedCategory(null);
        setCompetitions([]);
        setCompetitionsLoaded(false);
        setSession(value);
      } finally {
        if (isCurrent()) {
          setPassword('');
          setPasswordVisible(false);
        }
      }
    });
  };

  const disconnect = () => {
    void run(async (isCurrent) => {
      try {
        await logoutAdmin();
      } catch {
        if (isCurrent())
          Alert.alert(
            'Déconnexion',
            'Déconnexion locale effectuée. La révocation sur le serveur n’a pas pu être confirmée.',
          );
      } finally {
        if (isCurrent()) {
          clearCompetition();
          setSelectedCategory(null);
          setSession(null);
          setLogin('');
          setPassword('');
          setPasswordVisible(false);
          router.replace('/');
        }
      }
    });
  };

  const loadCompetitions = (category: AdminCategory, force = false) => {
    if (pending.current) return;
    setSelectedCategory(category);
    clearCompetition();
    setError('');
    setNotice('');
    if (competitionsLoaded && !force) return;
    void run(async (isCurrent) => {
      const response = await sendAdminRequest<{ competitions: AdminCompetition[] }>({
        operationType: 'getMobileAdminCompetitions',
      });
      if (!Array.isArray(response.competitions))
        throw new Error('Liste des compétitions invalide.');
      if (!isCurrent()) return;
      setCompetitions(response.competitions);
      setCompetitionsLoaded(true);
    });
  };

  const fetchRegistered = async (competition: AdminCompetition) => {
    const response = await sendAdminRequest<RegisteredResponse>({
      ...requestContext(competition),
      operationType: 'getCompetitionPlayers',
      action: 'displayList',
      accessType: 'massResa',
      isFromCBReturn: false,
    });
    if (!Array.isArray(response.playersList))
      throw new Error('Liste des inscrits invalide.');
    return response;
  };

  const selectCompetition = (competition: AdminCompetition) => {
    if (pending.current) return;
    clearForm();
    setEditorOpen(false);
    setSelectedCompetition(competition);
    setRegistered(null);
    setRegisteredLoaded(false);
    void run(async (isCurrent) => {
      const response = await fetchRegistered(competition);
      if (!isCurrent()) return;
      setRegistered(response);
      setRegisteredLoaded(true);
    });
  };

  const openRegistration = () => {
    if (pending.current || !selectedCompetition) return;
    if (scramble) {
      setScrambleEditorOpen(true);
      return;
    }
    const competition = selectedCompetition;
    clearForm();
    setEditorOpen(true);
    void run(async (isCurrent) => {
      // Même contexte de compétition que le client web.
      const context = await sendAdminRequest<FormContext>({
        ...requestContext(competition),
        operationType: 'getFormuleOfCurrentCompetition',
        currentCompetition: competition.nom_competition,
        departures: false,
      });
      if (!isCurrent()) return;
      if (isScrambleFormula(context.formule)) {
        setEditorOpen(false);
        throw new Error(
          'Cette compétition utilise une formule Scramble : parcours équipe requis.',
        );
      }
      const [users, slots] = await Promise.all([
        sendAdminRequest<{ usersArray: AdminPlayer[]; isScramble?: unknown }>({
          operationType: 'getAllUsers',
          isMobile: '1',
          nom_competition: competition.nom_competition,
          isScramble: false,
        }),
        sendAdminRequest<TrancheResponse>({
          ...requestContext(competition),
          operationType: 'getTranches',
          isMassResaAccess: true,
          isActionForCompetitionTerminated: competition.etat === 'Réservation terminée',
        }),
      ]);
      if (!isCurrent()) return;
      if (flag(users.isScramble)) {
        setEditorOpen(false);
        throw new Error(
          'Cette compétition utilise une formule Scramble : parcours équipe requis.',
        );
      }
      if (
        !Array.isArray(users.usersArray) ||
        users.usersArray.some(
          (player) =>
            typeof player.licence !== 'string' ||
            !player.licence ||
            typeof player.nom !== 'string' ||
            typeof player.prenom !== 'string',
        )
      ) {
        throw new Error('Liste des joueurs invalide.');
      }
      if (
        !Array.isArray(slots.id) ||
        !Array.isArray(slots.tranches) ||
        slots.tranches.length === 0 ||
        slots.tranches.length > 3 ||
        slots.tranches.some((_, index) => !slots.id[index])
      ) {
        throw new Error('Définition des tranches invalide.');
      }
      setPlayers(users.usersArray);
      setFormContext(context);
      setTranches(
        slots.tranches.map((title, index) => ({
          id: String(slots.id[index]),
          label: textOnly(title),
        })),
      );
      setShotgun(Number(slots.duree_trou) === 0);
      setFormLoaded(true);
    });
  };

  const applyReservation = (response: MassResaResponse) => {
    setPlayerReservation(response);
    setMealData({
      id: response.licence,
      nom: playerLabel(
        players.find((player) => player.licence === response.licence) ?? {
          licence: response.licence,
          nom: '',
          prenom: '',
          civilite: '',
          whs_index: '',
          repere: '',
        },
      ),
      dejeune: flag(response.resa_repas?.[0]),
      choixMenu:
        response.choix_menu && response.choix_menu !== '0' ? response.choix_menu : null,
    });
    setSelectedTee(String(response.repere ?? '').toLocaleLowerCase('fr'));
    setAdminComment(response.admin_commentaire ?? '');
    setSelectedTrancheId('');
    setSelectedPeriod(null);
    if (response.resaState === 'Resa') {
      // numTranche est l'indice renvoyé par le backend, à partir de zéro.
      const index = Number(response.numTranche);
      const tranche = Number.isInteger(index) && index >= 0 ? tranches[index] : undefined;
      setSelectedTrancheId(tranche?.id ?? '');
      setSelectedPeriod(periodFromTitle(response.periode));
    } else if (shotgun && tranches[0]) {
      setSelectedTrancheId(tranches[0].id);
      setSelectedPeriod('Début');
    }
  };

  const fetchReservation = async (player: AdminPlayer, competition: AdminCompetition) => {
    const response = await sendAdminRequest<MassResaResponse>({
      ...requestContext(competition),
      operationType: 'getUserMassResa',
      licence: player.licence,
    });
    if (
      response.licence !== player.licence ||
      !['Resa', 'noResa'].includes(response.resaState)
    ) {
      throw new Error('Réponse de réservation invalide.');
    }
    return response;
  };

  const selectPlayer = (player: AdminPlayer) => {
    if (pending.current || !selectedCompetition) return;
    setPickerOpen(false);
    clearPlayer();
    setSelectedPlayer(player);
    const competition = selectedCompetition;
    void run(async (isCurrent) => {
      const response = await fetchReservation(player, competition);
      if (!isCurrent()) return;
      applyReservation(response);
    });
  };

  const reloadPlayer = () => {
    if (selectedPlayer) selectPlayer(selectedPlayer);
  };

  const openMealReservation = () => {
    if (
      !canEdit ||
      !selectedCompetition ||
      !selectedPlayer ||
      !flag(formContext?.resa_repas)
    )
      return;

    if (!flag(formContext?.resa_menu)) {
      setMealMenu(null);
      setMealModalOpen(true);
      return;
    }
    const competition = selectedCompetition;
    const player = selectedPlayer;
    void run(async (isCurrent) => {
      const response = await sendAdminRequest<{
        licence: string;
        menu_repas: Partial<MenuRepas>;
      }>({
        ...requestContext(competition),
        operationType: 'menusRepasChoice',
        action: 'get',
        licence: player.licence,
        source: 'massResa',
        competition_key: competition.competition_key,
      });
      if (!isCurrent()) return;
      if (
        response.licence !== player.licence ||
        !response.menu_repas ||
        Array.isArray(response.menu_repas) ||
        !response.menu_repas.menu_A_E ||
        !response.menu_repas.menu_A_P ||
        !response.menu_repas.menu_A_D
      ) {
        throw new Error('Définition du menu absente ou incomplète.');
      }
      setMealMenu(response.menu_repas);
      setMealModalOpen(true);
    });
  };

  const saveOrRemove = (action: 'addUser' | 'removeUser') => {
    if (
      !selectedCompetition ||
      !selectedPlayer ||
      !playerReservation ||
      (action === 'addUser' ? !canSave : !canRemove)
    )
      return;
    const competition = selectedCompetition;
    const player = selectedPlayer;
    const reservation = playerReservation;
    if (
      action === 'addUser' &&
      mealData?.dejeune &&
      flag(formContext?.resa_menu) &&
      !(mealData.choixMenu ?? '')
        .split(',')
        .some((item) => item.trim() !== '' && item.trim() !== '0')
    ) {
      Alert.alert('Choix du menu', 'Ouvrez Repas / Menu et validez le menu du joueur.');
      return;
    }
    const execute = (withoutMeal = false) => {
      void run(async (isCurrent) => {
        let accepted = false;
        try {
          const takesMeal = withoutMeal
            ? false
            : (mealData?.dejeune ?? flag(reservation.resa_repas?.[0]));
          const meals = [takesMeal ? '1' : '0', '0', '0', '0'].join(',');
          const menuChoice = takesMeal ? (mealData?.choixMenu ?? '') : '';
          const mealChanged = takesMeal !== flag(reservation.resa_repas?.[0]);
          const menuChanged =
            menuChoice !==
            (reservation.choix_menu === '0' ? '' : (reservation.choix_menu ?? ''));
          const mutation = await sendAdminRequest<Record<string, any>>({
            ...requestContext(competition),
            operationType: 'setUserMassResa',
            action,
            licence: player.licence,
            tranche: action === 'addUser' ? selectedTrancheId : '',
            periode: action === 'addUser' ? selectedPeriod : '',
            repere: selectedTee,
            admin_commentaire: adminComment,
            resa_repas: meals,
            isResaRepas: takesMeal,
            isResaMenu:
              takesMeal &&
              flag(formContext?.resa_menu) &&
              menuChoice
                .split(',')
                .some((item) => item.trim() !== '' && item.trim() !== '0'),
            menu_choice: menuChoice,
            resaMenuLicences: [player.licence],
            resaMenu: [menuChoice],
            resaRepasUpdate: mealChanged || menuChanged,
            menu: categoryLabel ?? 'Standard',
            sous_menu:
              action === 'addUser'
                ? 'Inscription - Admin'
                : competition.etat === 'Réservation terminée'
                  ? 'Désinscription compétition terminée - Admin'
                  : 'Désinscription - Admin',
          });
          accepted = true;
          const mailWarning = await attemptAdminMail({
            ...requestContext(competition),
            operationType: 'sendResaMail',
            action,
            massResa: 'YES',
            recipient: mutation.email ?? player.login,
            recipientName: mutation.userName ?? playerLabel(player),
            subject:
              action === 'addUser'
                ? 'Confirmation inscription compétition'
                : 'Confirmation désinscription compétition',
            prenom: mutation.prenom ?? player.prenom,
            competition: competition.nom_competition,
            date: mutation.date_competition ?? competition.date_competition,
            tranche: textOnly(
              mutation.tranche ??
                reservation.tranche ??
                tranches.find((item) => item.id === selectedTrancheId)?.label,
            ),
            periode:
              periodFromTitle(mutation.periode ?? reservation.periode) ??
              selectedPeriod ??
              '',
            duree_trou: reservation.duree_trou ?? (shotgun ? 0 : 10),
            licence: player.licence,
            repere: selectedTee,
            isResaRepas: flag(formContext?.resa_repas),
            resa_repas: takesMeal ? '1' : '0',
            isResaMenu: flag(formContext?.resa_menu),
            resaMenuLicences: [player.licence],
            resaMenu: [menuChoice],
          });
          if (!isCurrent()) return;
          // Relecture du serveur : aucune répétition automatique de l’écriture.
          setPlayerReservation(null);
          const response = await fetchReservation(player, competition);
          if (!isCurrent()) return;
          applyReservation(response);
          setWriteUncertain(false);
          setNotice(
            action === 'addUser'
              ? 'Réservation enregistrée.'
              : 'Désinscription enregistrée.',
          );
          setRegisteredLoaded(false);
          if (mailWarning) setError('Réservation enregistrée. ' + mailWarning);
        } catch (exception) {
          if (!isCurrent()) return;
          setWriteUncertain(true);
          throw new Error(
            (accepted
              ? 'Opération acceptée, mais relecture impossible. '
              : 'Résultat de l’opération à vérifier. ') +
              textOnly(exception instanceof Error ? exception.message : '') +
              ' Utilisez « Relire la réservation » avant toute nouvelle opération.',
          );
        }
      });
    };
    if (
      action === 'addUser' &&
      reservation.resaState === 'noResa' &&
      flag(formContext?.resa_repas) &&
      !mealReviewed
    ) {
      Alert.alert(
        'Réservation du repas',
        'Le choix du repas n’a pas été confirmé pour ce joueur. Voulez-vous choisir le repas ou l’inscrire sans repas ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir le repas', onPress: openMealReservation },
          { text: 'Inscrire sans repas', onPress: () => execute(true) },
        ],
      );
      return;
    }
    if (action === 'removeUser') {
      Alert.alert(
        'Désinscription',
        'Désinscrire ' + playerLabel(player) + ' de cette compétition ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Désinscrire', style: 'destructive', onPress: () => execute() },
        ],
      );
    } else execute();
  };

  const closeEditor = () => {
    if (pending.current || !selectedCompetition) return;
    const competition = selectedCompetition;
    setEditorOpen(false);
    clearForm();
    setError('');
    setNotice('');
    if (registeredLoaded) return;
    void run(async (isCurrent) => {
      const response = await fetchRegistered(competition);
      if (!isCurrent()) return;
      setRegistered(response);
      setRegisteredLoaded(true);
    });
  };

  const goBack = () => {
    if (pending.current) return;
    if (editorOpen) {
      closeEditor();
      return;
    }
    setError('');
    setNotice('');
    if (selectedCompetition) clearCompetition();
    else setSelectedCategory(null);
  };

  const nextPlayer = () => {
    if (pending.current) return;
    clearPlayer();
    setError('');
    setNotice('');
    setPlayerSearch('');
    setPickerOpen(true);
  };

  const renderRegisteredRow = ({ item }: { item: RegisteredRow }) => {
    if (!isPlayerRow(item)) {
      const label = textOnly(item.title);
      const isPeriod = periodFromTitle(label) !== null && /---/.test(label);
      return (
        <View style={styles.tableGroupRow}>
          <Text style={[styles.tableGroupText, isPeriod && styles.tablePeriodText]}>
            {label}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tablePlayerRow}>
        <Text
          style={[styles.tableCell, styles.playerColumn]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {textOnly(item.title)}
        </Text>
        <Text style={[styles.tableCell, styles.indexColumn]} numberOfLines={1}>
          {item.whs_index}
        </Text>
        <Text style={[styles.tableCell, styles.seriesColumn]} numberOfLines={1}>
          {item.serie}
        </Text>
        <View style={styles.teeColumn}>
          {!!item.repere && (
            <View
              accessibilityLabel={'Repère ' + item.repere}
              style={[
                styles.tableTeeDot,
                {
                  backgroundColor: TEE_COLORS[item.repere] ?? '#cccccc',
                },
              ]}
            />
          )}
        </View>
        <View style={styles.mealColumn}>
          {flag(item.resa_repas) && (
            <Ionicons
              name="checkmark"
              size={22}
              color="#18834b"
              accessibilityLabel="Repas réservé"
            />
          )}
        </View>
      </View>
    );
  };

  // Le titre de compétition est déjà affiché au-dessus du tableau.
  const registeredTableRows = (registered?.playersList ?? []).filter(
    (row) =>
      isPlayerRow(row) || textOnly(row.title) !== selectedCompetition?.nom_competition,
  );

  if (scrambleEditorOpen && selectedCompetition && session) {
    return (
      <ScreenContainer
        onMenuPress={() => {
          if (!pending.current) router.replace('/');
        }}
      >
        <AdminScrambleEditor
          competition={selectedCompetition}
          category={categoryLabel ?? 'Standard'}
          onClose={(changed) => {
            setScrambleEditorOpen(false);
            if (changed) selectCompetition(selectedCompetition);
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer onMenuPress={() => router.replace('/')}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {checking ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#245b91" />
          </View>
        ) : session ? (
          <View style={styles.adminContainer}>
            <View style={styles.adminHeader}>
              {selectedCategory === null && (
                <>
                  <Text style={styles.adminTitle}>Administration</Text>
                  <Text style={styles.connected}>{session.admin.name}</Text>
                </>
              )}
              {selectedCategory !== null && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={goBack}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Ionicons name="arrow-back" size={22} color="#123f6b" />
                  <Text style={styles.backText}>
                    {editorOpen
                      ? 'Retour aux inscrits'
                      : selectedCompetition
                        ? 'Retour aux compétitions'
                        : 'Retour aux classes'}
                  </Text>
                </TouchableOpacity>
              )}
              {(!selectedCompetition || editorOpen) && (
                <Text style={styles.sectionTitle}>
                  {selectedCategory === null
                    ? 'Gestion des réservations'
                    : editorOpen
                      ? 'Gestion des inscriptions'
                      : categoryLabel}
                </Text>
              )}
              {selectedCompetition && editorOpen && (
                <Text style={styles.competitionDetails} numberOfLines={2}>
                  {selectedCompetition.nom_competition} —{' '}
                  {selectedCompetition.date_competition}
                </Text>
              )}
              {selectedCategory !== null && !selectedCompetition && (
                <TouchableOpacity
                  style={styles.refreshButton}
                  disabled={busy}
                  onPress={() => loadCompetitions(selectedCategory, true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.backText}>Actualiser les compétitions</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.listArea}>
              {selectedCategory === null ? (
                <ScrollView
                  style={styles.flex}
                  contentContainerStyle={styles.listContent}
                >
                  <TouchableOpacity
                    style={styles.categoryItem}
                    disabled={busy}
                    onPress={() => router.push('/membres-admin' as any)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.categoryText}>Gestion des utilisateurs</Text>
                    <Text style={styles.categoryChevron}>›</Text>
                  </TouchableOpacity>
                  {ADMIN_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryItem}
                      disabled={busy}
                      onPress={() => loadCompetitions(category.id)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.categoryText}>{category.label}</Text>
                      <Text style={styles.categoryChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : editorOpen ? (
                <ScrollView
                  style={styles.flex}
                  contentContainerStyle={styles.listContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {!formLoaded ? (
                    busy || !error ? (
                      <ActivityIndicator size="large" color="#245b91" />
                    ) : (
                      <TouchableOpacity style={styles.button} onPress={openRegistration}>
                        <Text style={styles.buttonText}>Réessayer</Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    <>
                      <Text style={styles.editorLabel}>Joueur</Text>
                      <View style={styles.playerSelector}>
                        <TouchableOpacity
                          style={styles.selectorMain}
                          disabled={busy}
                          onPress={() => {
                            setPlayerSearch('');
                            setPickerOpen(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Choisir un joueur"
                        >
                          <Text style={styles.selectorText}>
                            {selectedPlayer
                              ? playerLabel(selectedPlayer)
                              : 'Sélectionnez un joueur'}
                          </Text>
                          <Ionicons name="chevron-down" size={22} color="#245b91" />
                        </TouchableOpacity>
                        {selectedPlayer && (
                          <TouchableOpacity
                            style={styles.clearSelector}
                            disabled={busy}
                            onPress={clearPlayer}
                            accessibilityRole="button"
                            accessibilityLabel="Effacer le joueur"
                          >
                            <Ionicons name="close" size={22} color="#667788" />
                          </TouchableOpacity>
                        )}
                      </View>
                      {busy && (
                        <ActivityIndicator style={styles.inlineLoader} color="#245b91" />
                      )}
                      {selectedPlayer && !playerReservation && !busy && (
                        <TouchableOpacity style={styles.button} onPress={reloadPlayer}>
                          <Text style={styles.buttonText}>Relire la réservation</Text>
                        </TouchableOpacity>
                      )}
                      {playerReservation && (
                        <Text style={styles.recordSummary}>
                          {playerReservation.resaState === 'Resa'
                            ? 'Déjà inscrit'
                            : 'Nouvelle inscription'}
                          {' · Index : '}
                          {playerReservation.whs_index}
                          {' · '}
                          {playerReservation.serie}
                        </Text>
                      )}
                      {Array.from({ length: 3 }, (_, index) => {
                        const tranche = tranches[index];
                        return (
                          <View
                            key={index}
                            style={[styles.trancheBox, !tranche && styles.disabled]}
                          >
                            <Text style={styles.trancheHeading}>
                              {tranche?.label ?? 'Non déclarée'}
                            </Text>
                            {tranche && (
                              <View style={styles.periodChoices}>
                                {PERIODS.map((period) => {
                                  const checked =
                                    !!tranche &&
                                    selectedTrancheId === tranche.id &&
                                    selectedPeriod === period;
                                  const disabled =
                                    !canEdit ||
                                    !tranche ||
                                    (shotgun && (index !== 0 || period !== 'Début'));
                                  return (
                                    <TouchableOpacity
                                      key={period}
                                      style={styles.periodRow}
                                      disabled={disabled}
                                      accessibilityRole="radio"
                                      accessibilityState={{ checked, disabled }}
                                      onPress={() => {
                                        setSelectedTrancheId(tranche!.id);
                                        setSelectedPeriod(period);
                                      }}
                                    >
                                      <Ionicons
                                        name={
                                          checked ? 'radio-button-on' : 'radio-button-off'
                                        }
                                        size={23}
                                        color={disabled ? '#9ba9b7' : '#245b91'}
                                      />
                                      <Text
                                        style={[
                                          styles.periodText,
                                          disabled && styles.muted,
                                        ]}
                                      >
                                        {period}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                      <View style={styles.teeChoices}>
                        {TEES.map((tee) => (
                          <TouchableOpacity
                            key={tee}
                            style={styles.teeChoice}
                            disabled={!canEdit}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: selectedTee === tee,
                              disabled: !canEdit,
                            }}
                            onPress={() => setSelectedTee(tee)}
                          >
                            <Ionicons
                              name={
                                selectedTee === tee
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={22}
                              color={canEdit ? '#245b91' : '#9ba9b7'}
                            />
                            <Text style={styles.periodText}>
                              {tee.charAt(0).toUpperCase() + tee.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.auxiliaryActions}>
                        <TouchableOpacity
                          style={[styles.commentButton, !canEdit && styles.disabled]}
                          disabled={!canEdit}
                          accessibilityRole="button"
                          accessibilityLabel={
                            adminComment
                              ? 'Modifier le commentaire'
                              : 'Ajouter un commentaire'
                          }
                          onPress={() => {
                            setCommentDraft(adminComment);
                            setCommentModalOpen(true);
                          }}
                        >
                          <Ionicons name="chatbox-outline" size={18} color="#245b91" />
                          <Text style={styles.commentButtonText}>
                            Commentaire{adminComment ? ' ✓' : ''}
                          </Text>
                        </TouchableOpacity>
                        {flag(formContext?.resa_repas) && (
                          <TouchableOpacity
                            style={[styles.commentButton, !canEdit && styles.disabled]}
                            disabled={!canEdit}
                            onPress={openMealReservation}
                            accessibilityRole="button"
                            accessibilityLabel={`Repas${flag(formContext?.resa_menu) ? ' et menu' : ''} : ${mealData?.dejeune ? 'réservé' : 'non réservé'}`}
                          >
                            <Ionicons
                              name="restaurant-outline"
                              size={18}
                              color="#245b91"
                            />
                            <Text style={styles.commentButtonText}>
                              Repas{flag(formContext?.resa_menu) ? ' / Menu' : ''}
                              {mealData?.dejeune ? ' ✓' : ''}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {writeUncertain && playerReservation && (
                        <TouchableOpacity
                          style={styles.button}
                          onPress={reloadPlayer}
                          disabled={busy}
                        >
                          <Text style={styles.buttonText}>Relire la réservation</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </ScrollView>
              ) : selectedCompetition ? (
                busy ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#245b91" />
                  </View>
                ) : !registeredLoaded ? (
                  <View style={styles.emptyContainer}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => selectCompetition(selectedCompetition)}
                    >
                      <Text style={styles.buttonText}>Réessayer</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.registeredTable}>
                    <View style={styles.tableSummary}>
                      <Text style={styles.tableCompetitionTitle}>
                        {selectedCompetition.nom_competition}
                      </Text>
                      <Text style={styles.tableDate}>
                        {selectedCompetition.date_competition} —{' '}
                        <Text style={styles.tableCount}>
                          {registered?.nbrPlayers ?? '—'}
                        </Text>{' '}
                        joueurs
                      </Text>
                    </View>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, styles.playerColumn]}>
                        Joueur
                      </Text>
                      <Text style={[styles.tableHeaderCell, styles.indexColumn]}>
                        Index
                      </Text>
                      <Text style={[styles.tableHeaderCell, styles.seriesColumn]}>
                        Série
                      </Text>
                      <Text style={[styles.tableHeaderCell, styles.teeHeaderColumn]}>
                        Repère
                      </Text>
                      <Text style={[styles.tableHeaderCell, styles.mealHeaderColumn]}>
                        Repas
                      </Text>
                    </View>
                    <FlatList
                      style={styles.flex}
                      data={registeredTableRows}
                      keyExtractor={(_, index) => String(index)}
                      renderItem={renderRegisteredRow}
                      ListEmptyComponent={
                        <Text style={styles.information}>Aucun inscrit.</Text>
                      }
                    />
                  </View>
                )
              ) : busy ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#245b91" />
                </View>
              ) : !competitionsLoaded ? (
                <View style={styles.emptyContainer}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => loadCompetitions(selectedCategory)}
                  >
                    <Text style={styles.buttonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  style={styles.flex}
                  contentContainerStyle={styles.listContent}
                  data={visibleCompetitions}
                  keyExtractor={(item) => String(item.competition_key)}
                  ListEmptyComponent={
                    <Text style={styles.information}>
                      Aucune compétition pour cette classe.
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.competitionItem}
                      onPress={() => selectCompetition(item)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.competitionName}>{item.nom_competition}</Text>
                      <Text style={styles.competitionDetails}>
                        {item.date_competition} — {item.etat}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>

            <View style={styles.adminFooter}>
              {!!error && (
                <Text style={styles.footerError} accessibilityRole="alert">
                  {error}
                </Text>
              )}
              {!!notice && !hasReservationChanges && (
                <Text style={styles.notice}>{notice}</Text>
              )}
              {hasReservationChanges && !busy && !error && (
                <Text style={styles.footerSelection}>
                  Modifications non enregistrées.
                </Text>
              )}
              {editorOpen ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.smallButton, !canRemove && styles.disabled]}
                    disabled={!canRemove}
                    onPress={() => saveOrRemove('removeUser')}
                  >
                    <Text style={styles.smallButtonText}>Désinscrire</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, !canSave && styles.disabled]}
                    disabled={!canSave}
                    onPress={() => saveOrRemove('addUser')}
                  >
                    <Text style={styles.smallButtonText}>
                      {playerReservation?.resaState === 'Resa'
                        ? 'Mettre à jour'
                        : 'Inscrire'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.smallButton,
                      (!canEdit || writeUncertain) && styles.disabled,
                    ]}
                    disabled={!canEdit || writeUncertain}
                    onPress={nextPlayer}
                  >
                    <Text style={styles.smallButtonText}>Suivant</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {selectedCompetition ? (
                    <>
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[
                            styles.smallButton,
                            (busy || !registeredLoaded) && styles.disabled,
                          ]}
                          disabled={busy || !registeredLoaded}
                          onPress={openRegistration}
                        >
                          <Text style={styles.smallButtonText}>Inscription</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.smallButton, busy && styles.disabled]}
                          disabled={busy}
                          onPress={() => selectCompetition(selectedCompetition)}
                        >
                          <Text style={styles.smallButtonText}>Actualiser</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : selectedCategory !== null ? (
                    <Text style={styles.footerSelection}>
                      Sélectionnez une compétition.
                    </Text>
                  ) : null}
                  {selectedCategory === null && (
                    <TouchableOpacity
                      style={[styles.button, busy && styles.disabled]}
                      disabled={busy}
                      onPress={disconnect}
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>Se déconnecter</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Administration</Text>
            <Text style={styles.description}>
              Connectez-vous avec votre compte WordPress.
            </Text>

            <Text style={styles.label}>Identifiant ou email WordPress</Text>
            <TextInput
              style={styles.input}
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="username"
              editable={!busy}
              accessibilityLabel="Identifiant ou email WordPress"
            />

            <Text style={styles.label}>Mot de passe WordPress</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={connect}
                editable={!busy}
                accessibilityLabel="Mot de passe WordPress"
              />

              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setPasswordVisible((value) => !value)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={
                  passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                }
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#245b91"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (busy || !login.trim() || !password) && styles.disabled,
              ]}
              onPress={connect}
              disabled={busy || !login.trim() || !password}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {busy ? 'Connexion…' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            {!!error && (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.pickerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.pickerPanel}>
            <View style={styles.pickerHeader}>
              <Text style={styles.sectionTitle}>Choisir un joueur</Text>
              <TouchableOpacity
                style={styles.clearSelector}
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer la liste des joueurs"
              >
                <Ionicons name="close" size={25} color="#245b91" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={playerSearch}
              onChangeText={setPlayerSearch}
              placeholder="Début du nom ou numéro de licence"
              placeholderTextColor="#666"
              autoCorrect={false}
              autoFocus
              accessibilityLabel="Rechercher un joueur"
            />
            <Text style={styles.competitionDetails}>
              {filteredPlayers.length} joueur(s)
            </Text>
            <FlatList
              style={styles.flex}
              data={filteredPlayers}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.licence}
              ListEmptyComponent={
                <Text style={styles.information}>Aucun joueur trouvé.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => selectPlayer(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.competitionName}>{playerLabel(item)}</Text>
                  <Text style={styles.competitionDetails}>{item.licence}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <RepasModal
        visible={mealModalOpen}
        joueurs={
          selectedPlayer
            ? [{ id: selectedPlayer.licence, nom: playerLabel(selectedPlayer) }]
            : []
        }
        nbJoueursMax={1}
        selectedValues={selectedPlayer ? [selectedPlayer.licence] : []}
        initialData={mealData ? [mealData] : []}
        menuDefinition={mealMenu}
        onValidate={(data) => {
          const choice = data.find((item) => item.id === selectedPlayer?.licence);
          if (choice) {
            setMealData(choice);
            setMealReviewed(true);
          }
          setMealModalOpen(false);
        }}
        onClose={() => setMealModalOpen(false)}
      />
      <Modal
        visible={commentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCommentModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.pickerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.commentPanel}>
            <Text style={styles.sectionTitle}>Commentaire administrateur</Text>
            <TextInput
              style={styles.commentModalInput}
              value={commentDraft}
              onChangeText={setCommentDraft}
              multiline
              autoFocus
              textAlignVertical="top"
              accessibilityLabel="Saisir le commentaire administrateur"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setCommentModalOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.smallButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => {
                  setAdminComment(commentDraft);
                  setCommentModalOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.smallButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  auxiliaryActions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 5,
  },
  commentButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#245b91',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 5,
  },
  commentButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#245b91',
  },
  commentPanel: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  commentModalInput: {
    height: 150,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#607d99',
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    color: '#111',
  },
  editorLabel: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  periodChoices: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 6,
    paddingHorizontal: 9,
    minHeight: 38,
    marginBottom: 6,
  },
  registeredTable: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 2,
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#cbd5df',
  },
  tableSummary: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#e0e6ec',
  },
  tableCompetitionTitle: {
    fontSize: 16,
    lineHeight: 20,
    color: '#1684dc',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  tableDate: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1645cb',
    fontWeight: '600',
    textAlign: 'center',
  },
  tableCount: {
    color: '#d23848',
    fontWeight: '700',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#aacdee',
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5df',
  },
  tableHeaderCell: {
    fontSize: 12,
    color: '#202c38',
    fontWeight: '700',
    paddingVertical: 7,
  },
  tablePlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    paddingVertical: 6,
    backgroundColor: '#edf2f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8ef',
  },
  tableCell: {
    fontSize: 13,
    lineHeight: 18,
    color: '#303a44',
  },
  playerColumn: {
    width: '40%',
    paddingLeft: 8,
    paddingRight: 4,
  },
  indexColumn: {
    width: '14%',
    textAlign: 'center',
  },
  seriesColumn: {
    width: '20%',
    textAlign: 'center',
  },
  teeColumn: {
    width: '13%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealColumn: {
    width: '13%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teeHeaderColumn: {
    width: '13%',
    textAlign: 'center',
  },
  mealHeaderColumn: {
    width: '13%',
    textAlign: 'center',
  },
  tableTeeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#bdc8d2',
  },
  tableGroupRow: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#edf2f7',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8ef',
  },
  tableGroupText: {
    fontSize: 14,
    lineHeight: 19,
    color: '#173ce2',
    fontWeight: '600',
    textAlign: 'center',
  },
  tablePeriodText: {
    color: '#e00000',
  },

  flex: {
    flex: 1,
  },
  groupRow: {
    backgroundColor: '#e5eef7',
    padding: 10,
    marginTop: 8,
  },
  groupTitle: {
    color: '#245b91',
    fontWeight: '600',
    fontSize: 16,
  },
  registeredRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#89accd',
  },
  registeredName: {
    fontSize: 16,
    color: '#111',
  },
  playerMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#394c60',
  },
  teeDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#667788',
  },
  playerSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#607d99',
    borderRadius: 6,
    marginBottom: 5,
  },
  selectorMain: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 6,
  },
  selectorText: {
    flex: 1,
    color: '#111',
    fontSize: 14,
    lineHeight: 18,
  },
  clearSelector: {
    minWidth: 38,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineLoader: {
    marginVertical: 10,
  },
  recordSummary: {
    fontSize: 13,
    lineHeight: 18,
    color: '#245b91',
    marginVertical: 6,
  },
  trancheBox: {
    borderWidth: 1,
    borderColor: '#89accd',
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginVertical: 3,
  },
  trancheHeading: {
    fontSize: 14,
    lineHeight: 18,
    color: '#245b91',
    fontWeight: '600',
    marginBottom: 2,
  },
  periodRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  periodText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#111',
  },
  muted: {
    color: '#8b9bac',
  },
  teeChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  teeChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingVertical: 3,
    paddingRight: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 5,
    marginTop: 5,
  },
  smallButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    backgroundColor: '#245b91',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  notice: {
    fontSize: 15,
    color: '#155c36',
    marginTop: 6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  pickerPanel: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    minHeight: 250,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d4deea',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 4,
  },
  detailStatus: {
    fontSize: 17,
    fontWeight: '600',
    marginVertical: 18,
    color: '#245b91',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
  },
  description: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 20,
  },
  information: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#607d99',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 17,
    marginBottom: 20,
    color: '#111',
  },
  button: {
    backgroundColor: '#245b91',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 18,
    color: '#111',
  },
  categoryChevron: {
    fontSize: 28,
    color: '#555',
  },
  refreshButton: {
    paddingVertical: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 0,
    marginBottom: 3,
    backgroundColor: '#e4eff9',
    borderWidth: 1,
    borderColor: '#527fa8',
    borderRadius: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#123f6b',
    flexShrink: 1,
  },
  competitionItem: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  competitionSelected: {
    borderColor: '#245b91',
  },
  competitionName: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    color: '#111',
  },
  competitionDetails: {
    fontSize: 13,
    lineHeight: 17,
    color: '#444',
    marginTop: 2,
  },
  selection: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 16,
    marginBottom: 12,
  },
  error: {
    color: '#8b1515',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 20,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#607d99',
    borderRadius: 8,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 17,
    color: '#111',
  },
  passwordToggle: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  adminHeader: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 3,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  connected: {
    fontSize: 14,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  listArea: {
    flex: 1,
    minHeight: 0,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 24,
  },
  adminFooter: {
    flexShrink: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#89accd',
    backgroundColor: '#aacdeeff',
  },
  footerSelection: {
    fontSize: 16,
    lineHeight: 22,
  },
  footerError: {
    color: '#8b1515',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
  },
});

type ScrambleValidation = {
  captainComment?: string;
  newTeamLeader: 'YES' | 'NO';
  newTeamMember: 'YES' | 'NO';
  identMember: AdminPlayer[];
  tranche: { id: string | number; title: string } | null;
  position: { title: string } | null;
  resa_repas: unknown[];
  resa_menu: (string | null)[];
};

function AdminScrambleEditor({
  competition,
  category,
  onClose,
}: {
  competition: AdminCompetition;
  category: string;
  onClose: (changed: boolean) => void;
}) {
  const [context, setContext] = useState<FormContext | null>(null);
  const [catalogue, setCatalogue] = useState<AdminPlayer[]>([]);
  const [slots, setSlots] = useState<TrancheOption[]>([]);
  const [shotgun, setShotgun] = useState(false);
  const [size, setSize] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [holeDuration, setHoleDuration] = useState(0);
  const [members, setMembers] = useState<AdminPlayer[]>([]);
  const [saved, setSaved] = useState<ScrambleValidation | null>(null);
  const [tranche, setTranche] = useState('');
  const [period, setPeriod] = useState<Period | null>(null);
  const [meals, setMeals] = useState<JoueurRepas[]>([]);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [baseline, setBaseline] = useState('');
  const [comment, setComment] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);
  const [picker, setPicker] = useState<number | 'tranche' | null>(null);
  const [search, setSearch] = useState('');
  const [mealOpen, setMealOpen] = useState(false);
  const [menu, setMenu] = useState<Partial<MenuRepas> | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const changed = useRef(false);
  const request = {
    nom_competition: competition.nom_competition,
    competitionClass: competition.competitionClass,
    isEclectic: competition.isEclectic,
    isMobile: '1',
    support: Platform.OS === 'ios' ? 'APP_IOS' : 'APP_ANDROID',
  };
  const signature = (
    players: AdminPlayer[],
    slot: string,
    position: Period | null,
    choices: JoueurRepas[],
    captainComment: string,
  ) =>
    JSON.stringify({
      captainComment,
      players: players.map((player) => player.licence),
      slot,
      position,
      meals: players.map((player) => {
        const choice = choices.find((item) => item.id === player.licence);
        return [
          player.licence,
          !!choice?.dejeune,
          choice?.dejeune ? normalizeMealMenu(choice.choixMenu) : '',
        ];
      }),
    });
  const dirty =
    !!saved && signature(members, tranche, period, meals, comment) !== baseline;
  const existing = saved?.newTeamLeader === 'NO';
  const ready =
    loaded &&
    !!saved &&
    members.length > 0 &&
    members.length <= size &&
    !!tranche &&
    !!period &&
    !busy &&
    !uncertain;
  const task = async (work: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
    } catch (exception) {
      if (active.current)
        setError(
          textOnly(
            exception instanceof Error ? exception.message : 'Opération impossible.',
          ),
        );
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  };
  const validate = async (player: AdminPlayer) => {
    const result = await sendAdminRequest<ScrambleValidation>({
      ...request,
      operationType: 'validateTeamLeader',
      licence: player.licence,
    });
    if (
      !['YES', 'NO'].includes(result.newTeamLeader) ||
      !['YES', 'NO'].includes(result.newTeamMember) ||
      !Array.isArray(result.identMember)
    ) {
      throw new Error('Réponse équipe invalide.');
    }
    // Lecture ciblée de la même ligne leaf que celle mise à jour.
    if (result.newTeamLeader === 'NO') {
      const response = await sendAdminRequest<{ admin_commentaire: string }>({
        ...request,
        operationType: 'updateResaTeamComment',
        action: 'get',
        licence: player.licence,
      });
      if (typeof response.admin_commentaire !== 'string')
        throw new Error(
          'Lecture du commentaire invalide. Mettez à jour la méthode PHP updateResaTeamComment.',
        );
      result.captainComment = response.admin_commentaire;
    } else result.captainComment = '';
    return result;
  };
  const applyTeam = (leader: AdminPlayer, result: ScrambleValidation) => {
    if (result.newTeamLeader === 'YES' && result.newTeamMember === 'NO') {
      throw new Error(
        'Ce joueur appartient déjà à une autre équipe. Sélectionnez son capitaine.',
      );
    }
    const source = result.newTeamLeader === 'NO' ? result.identMember : [leader];
    if (
      !source.length ||
      source.length > size ||
      new Set(source.map((player) => player.licence)).size !== source.length ||
      !source.some((player) => player.licence === leader.licence)
    ) {
      throw new Error('Composition de l’équipe invalide.');
    }
    const ordered = [
      source.find((player) => player.licence === leader.licence)!,
      ...source.filter((player) => player.licence !== leader.licence),
    ];
    const choices = ordered.map((player) => {
      const index = result.identMember.findIndex(
        (item) => item.licence === player.licence,
      );
      return {
        id: player.licence,
        nom: playerLabel(player),
        dejeune: flag(result.resa_repas?.[index]),
        choixMenu:
          result.resa_menu?.[index] === '0' ? '' : (result.resa_menu?.[index] ?? ''),
      };
    });
    const slot =
      result.newTeamLeader === 'NO'
        ? String(result.tranche?.id ?? '')
        : shotgun
          ? (slots[0]?.id ?? '')
          : '';
    const position =
      result.newTeamLeader === 'NO'
        ? periodFromTitle(result.position?.title)
        : shotgun
          ? 'Début'
          : null;
    if (
      result.newTeamLeader === 'NO' &&
      (!slots.some((item) => item.id === slot) || !position)
    )
      throw new Error('Créneau de l’équipe introuvable.');
    const captainComment = result.captainComment ?? '';
    setComment(captainComment);
    setCommentDraft('');
    setCommentOpen(false);
    setMembers(ordered);
    setMeals(choices);
    setReviewed(
      result.newTeamLeader === 'NO' ? ordered.map((player) => player.licence) : [],
    );
    setSaved(result);
    setTranche(slot);
    setPeriod(position);
    setUncertain(false);
    setBaseline(signature(ordered, slot, position, choices, captainComment));
  };
  const initialize = () =>
    void task(async () => {
      setLoaded(false);
      const info = await sendAdminRequest<FormContext>({
        ...request,
        operationType: 'getFormuleOfCurrentCompetition',
        currentCompetition: competition.nom_competition,
        departures: false,
      });
      const match = /scramble\D*([234])/i.exec(info.formule ?? '');
      if (!match) throw new Error('Taille de l’équipe Scramble non reconnue.');
      const [users, periods] = await Promise.all([
        sendAdminRequest<{
          usersArray: AdminPlayer[];
          tranche_duree: string | number;
          duree_trou: string | number;
          nbre_joueurs: string | number;
        }>({ ...request, operationType: 'getAllUsers', isScramble: true }),
        sendAdminRequest<TrancheResponse>({
          ...request,
          operationType: 'getTranches',
          isMassResaAccess: true,
          isActionForCompetitionTerminated: competition.etat === 'Réservation terminée',
        }),
      ]);
      if (!active.current) return;
      if (
        !Array.isArray(users.usersArray) ||
        users.usersArray.some(
          (player) =>
            typeof player.licence !== 'string' ||
            !player.licence ||
            typeof player.nom !== 'string' ||
            typeof player.prenom !== 'string',
        )
      )
        throw new Error('Liste des joueurs invalide.');
      if (
        !Array.isArray(periods.tranches) ||
        !Array.isArray(periods.id) ||
        !periods.tranches.length ||
        periods.tranches.length > 3 ||
        periods.tranches.some((_, index) => periods.id[index] == null)
      )
        throw new Error('Tranches invalides.');
      const duration = Number(users.duree_trou);
      const playersPerStart = Number(users.nbre_joueurs);
      const trancheDuration = Number(users.tranche_duree);
      const maximum =
        duration === 0
          ? Math.round(2 * playersPerStart * 18)
          : Math.round(trancheDuration / duration) * playersPerStart;
      if (!Number.isFinite(maximum) || maximum <= 0)
        throw new Error('Paramètres de jauge invalides.');
      setCapacity(maximum);
      setHoleDuration(duration);
      setContext(info);
      setSize(Number(match[1]));
      setCatalogue(users.usersArray);
      setSlots(
        periods.tranches.map((title, index) => ({
          id: String(periods.id[index]),
          label: textOnly(title),
        })),
      );
      setShotgun(Number(periods.duree_trou) === 0);
      setLoaded(true);
    });
  useEffect(() => {
    active.current = true;
    initialize();
    return () => {
      active.current = false;
    };
  }, []);

  const select = (player: AdminPlayer, index: number) => {
    if (busy || uncertain) return;
    if (
      members.some(
        (member, position) => position !== index && member.licence === player.licence,
      )
    ) {
      Alert.alert('Équipe', 'Ce joueur est déjà sélectionné.');
      return;
    }
    setPicker(null);
    setSearch('');
    void task(async () => {
      if (index === 0) {
        const result = await validate(player);
        if (active.current) applyTeam(player, result);
      } else {
        if (!saved?.identMember.some((member) => member.licence === player.licence)) {
          const result = await validate(player);
          if (result.newTeamLeader === 'NO' || result.newTeamMember === 'NO')
            throw new Error('Ce joueur est déjà inscrit dans une équipe.');
        }
        if (!active.current) return;
        const next = [...members];
        next[index] = player;
        setReviewed((previous) =>
          previous.filter(
            (id) => id !== player.licence && id !== members[index]?.licence,
          ),
        );
        setMembers(next);
        setMeals((previous) =>
          next.map(
            (member) =>
              previous.find((item) => item.id === member.licence) ?? {
                id: member.licence,
                nom: playerLabel(member),
                dejeune: false,
                choixMenu: '',
              },
          ),
        );
      }
    });
  };
  const reset = () => {
    setMembers([]);
    setSaved(null);
    setMeals([]);
    setReviewed([]);
    setTranche('');
    setPeriod(null);
    setBaseline('');
    setComment('');
    setCommentDraft('');
    setCommentOpen(false);
    setNotice('');
    setError('');
    setMenu(null);
  };
  const openMeals = () => {
    if (!members.length || busy || uncertain) return;
    if (!flag(context?.resa_menu)) {
      setMenu(null);
      setMealOpen(true);
      return;
    }
    void task(async () => {
      const result = await sendAdminRequest<{ menu_repas: Partial<MenuRepas> }>({
        ...request,
        operationType: 'menusRepasChoice',
        action: 'get',
        licence: members[0].licence,
        source: 'massResa',
        competition_key: competition.competition_key,
      });
      if (
        !result.menu_repas?.menu_A_E ||
        !result.menu_repas.menu_A_P ||
        !result.menu_repas.menu_A_D
      )
        throw new Error('Définition du menu incomplète.');
      if (active.current) {
        setMenu(result.menu_repas);
        setMealOpen(true);
      }
    });
  };
  const write = (remove: boolean, withoutMeals = false) =>
    void task(async () => {
      if (!saved || !members[0]) return;
      const originalLeader = existing
        ? saved.identMember.find((player) => player.licence === members[0].licence)
        : members[0];
      if (!originalLeader) throw new Error('Capitaine initial introuvable.');
      const choices = members.map((player) =>
        meals.find((item) => item.id === player.licence),
      );
      const payload: Record<string, unknown> = {
        ...request,
        operationType: 'setMassResaTeam',
        action: remove ? 'removeTeam' : 'addUser',
        createTeam: existing ? 'NO' : 'YES',
        teamResa: 'YES',
        updateTeam: existing ? 'OK' : '',
        teamLeader: playerLabel(originalLeader),
        teamLeaderLicence: originalLeader.licence,
        nbrOfPlayers: remove ? saved.identMember.length : members.length,
        initialNbrPlayers: saved.identMember.length,
        nbrScramblePlayers: size,
        jauge: capacity,
        tranche,
        periode: period ? `--- ${period} ---` : '',
        resa_repas: Array.from({ length: 4 }, (_, index) =>
          !withoutMeals && choices[index]?.dejeune ? '1' : '0',
        ),
        isResaRepas: flag(context?.resa_repas),
        isResaMenu: flag(context?.resa_menu),
        resaMenuLicences: members.map((player) => player.licence),
        resaMenu: choices.map((choice) =>
          !withoutMeals && choice?.dejeune ? (choice.choixMenu ?? '') : '',
        ),
        removedMembers: saved.identMember.filter(
          (player) => !members.some((member) => member.licence === player.licence),
        ),
        menu: category,
        sous_menu: remove ? 'Désinscription - Admin' : 'Inscription - Admin',
      };
      for (let index = 0; index < 4; index++) {
        payload[`licence_${index + 1}`] = members[index]?.licence ?? null;
        payload[`civilite_${index + 1}`] = members[index]?.civilite ?? null;
      }
      try {
        // Aucune répétition automatique d’une écriture en cas de réponse perdue.
        await sendAdminRequest(payload);
        changed.current = true;
        if (!remove) {
          // L’équipe est recréée par le backend ; réappliquer aussi le commentaire inchangé.
          await sendAdminRequest({
            ...request,
            operationType: 'updateResaTeamComment',
            licence: originalLeader.licence,
            admin_commentaire: comment,
          });
        }
        if (!active.current) return;
        const result = await validate(originalLeader);
        if (!active.current) return;
        if (remove && (result.newTeamLeader !== 'YES' || result.newTeamMember !== 'YES'))
          throw new Error('Suppression non confirmée par la relecture.');
        if (!remove && result.newTeamLeader !== 'NO')
          throw new Error('Enregistrement non confirmé par la relecture.');
        const expectedComment =
          comment.replace(/[\s\u00a0\u200b\ufeff]/g, '') === '' ? '' : comment;
        if (!remove && result.captainComment !== expectedComment)
          throw new Error('Le commentaire du capitaine n’a pas pu être confirmé.');
        applyTeam(originalLeader, result);
        setNotice(remove ? 'Équipe désinscrite.' : 'Équipe enregistrée.');
        const source = remove ? saved.identMember : result.identMember;
        const recipients = source.map((player) => ({
          ...catalogue.find((item) => item.licence === player.licence),
          ...player,
          login:
            player.login ??
            catalogue.find((item) => item.licence === player.licence)?.login,
        }));
        const leaderIndex = recipients.findIndex(
          (player) => player.licence === originalLeader.licence,
        );
        if (leaderIndex > 0) recipients.unshift(...recipients.splice(leaderIndex, 1));
        const notices: string[] = [];
        const validRecipients =
          recipients.length > 0 &&
          recipients.every(
            (player) => typeof player.login === 'string' && player.login.trim() !== '',
          );
        const mailBase = {
          ...request,
          operationType: 'sendTeamResaMail',
          massResa: 'YES',
          competition: competition.nom_competition,
          date: competition.date_competition,
          tranche: textOnly(remove ? saved.tranche?.title : result.tranche?.title),
          periode:
            periodFromTitle(remove ? saved.position?.title : result.position?.title) ??
            '',
          duree_trou: holeDuration,
          nbrScramblePlayers: size,
          isComplete: recipients.length === size ? 'normal' : 'incomplete',
          isResaRepas: flag(context?.resa_repas),
          isResaMenu: flag(context?.resa_menu),
          resa_repas: recipients.map((player) => {
            const index = result.identMember.findIndex(
              (item) => item.licence === player.licence,
            );
            return !remove && flag(result.resa_repas[index]) ? '1' : '0';
          }),
          resaMenuLicences: recipients.map((player) => player.licence),
          resaMenu: recipients.map((player) => {
            const index = result.identMember.findIndex(
              (item) => item.licence === player.licence,
            );
            return !remove && flag(result.resa_repas[index])
              ? (result.resa_menu[index] ?? '')
              : '';
          }),
          removedMembers: payload.removedMembers,
        };
        if (validRecipients) {
          const warning = await attemptAdminMail(
            {
              ...mailBase,
              action: remove ? 'removeTeam' : 'addUser',
              subject: remove
                ? 'Confirmation désinscription compétition'
                : 'Confirmation inscription compétition',
              identMember: recipients,
            },
            recipients.length,
          );
          if (warning) notices.push(warning);
        } else
          notices.push(
            'Emails non envoyés : adresse manquante dans la liste des membres.',
          );
        if (!remove) {
          const removed = saved.identMember.filter(
            (player) => !members.some((member) => member.licence === player.licence),
          );
          for (const player of removed) {
            const address =
              player.login ??
              catalogue.find((item) => item.licence === player.licence)?.login;
            if (!address || !recipients[0]?.login) {
              notices.push('Email du membre retiré non envoyé : adresse manquante.');
              continue;
            }
            const warning = await attemptAdminMail(
              {
                ...mailBase,
                action: 'removeTeamUser',
                subject: 'Confirmation désinscription compétition',
                identMember: [{ ...player, login: address }],
                identTeamLeader: [recipients[0]],
                removedMembers: [player],
                isResaRepas: false,
                isResaMenu: false,
                resa_repas: ['0'],
                resaMenu: [''],
                isComplete: 'normal',
              },
              2,
            );
            if (warning) notices.push(warning);
          }
        }
        if (active.current && notices.length)
          setError('Équipe enregistrée. ' + notices.join(' '));
      } catch (exception) {
        changed.current = true;
        if (active.current) setUncertain(true);
        throw new Error(
          'Résultat à vérifier. ' +
            (exception instanceof Error ? exception.message : '') +
            ' Relisez l’équipe avant une nouvelle opération.',
        );
      }
    });
  const save = () => {
    if (!ready || (existing && !dirty)) return;
    if (
      flag(context?.resa_menu) &&
      meals.some((choice) => choice.dejeune && !normalizeMealMenu(choice.choixMenu))
    ) {
      Alert.alert('Menus', 'Validez un menu pour chaque joueur prenant un repas.');
      return;
    }
    if (
      flag(context?.resa_repas) &&
      members.some((player) => !reviewed.includes(player.licence))
    ) {
      Alert.alert(
        'Réservation des repas',
        existing
          ? 'La composition de l’équipe a changé. Vérifiez les repas et menus, ou confirmez les choix affichés. Le nouveau joueur n’a pas de repas réservé par défaut.'
          : 'Le choix des repas n’a pas été confirmé pour tous les joueurs.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Choisir les repas', onPress: openMeals },
          {
            text: existing ? 'Conserver ces choix' : 'Inscrire sans repas',
            onPress: () => write(false, !existing),
          },
        ],
      );
      return;
    }
    write(false);
  };
  const leave = () => {
    if (busy) return;
    if (dirty && !uncertain)
      Alert.alert(
        'Modifications non enregistrées',
        'Quitter le formulaire sans enregistrer ?',
        [
          { text: 'Rester', style: 'cancel' },
          { text: 'Quitter', onPress: () => onClose(changed.current) },
        ],
      );
    else onClose(changed.current);
  };
  const showPicker = (value: number | 'tranche') => {
    setSearch('');
    setPicker(value);
  };
  const filtered = catalogue.filter((player) => {
    const query = search.trim().toLocaleLowerCase('fr');
    return (
      (!query ||
        player.nom.toLocaleLowerCase('fr').startsWith(query) ||
        player.licence.startsWith(query)) &&
      !members.some(
        (member, index) => index !== picker && member.licence === player.licence,
      )
    );
  });
  return (
    <View style={teamStyles.root}>
      <View style={teamStyles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={leave}
          disabled={busy}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color="#123f6b" />
          <Text style={styles.backText}>Retour aux inscrits</Text>
        </TouchableOpacity>
        <Text style={teamStyles.title}>
          Gestion de l’équipe · Scramble à {size || '…'}
        </Text>
        <Text style={teamStyles.subtitle}>
          {competition.nom_competition} — {competition.date_competition}
        </Text>
      </View>
      <ScrollView
        style={teamStyles.body}
        contentContainerStyle={teamStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        {!loaded ? (
          busy || !error ? (
            <ActivityIndicator size="large" color="#245b91" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={initialize}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          )
        ) : (
          <>
            {Array.from({ length: size }, (_, index) => {
              const player = members[index];
              const choice = meals.find((item) => item.id === player?.licence);
              return (
                <View key={index} style={teamStyles.memberRow}>
                  <TouchableOpacity
                    style={teamStyles.memberSelect}
                    disabled={
                      busy ||
                      uncertain ||
                      (index > 0 && !members[0]) ||
                      index > members.length ||
                      (index === 0 && !!existing)
                    }
                    onPress={() => showPicker(index)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      index === 0
                        ? 'Choisir le capitaine'
                        : `Choisir le joueur ${index + 1}`
                    }
                  >
                    <Text style={teamStyles.memberNumber}>
                      {index === 0 ? 'C' : index + 1}
                    </Text>
                    <View style={teamStyles.memberIdentity}>
                      <Text style={teamStyles.memberName} numberOfLines={1}>
                        {player
                          ? playerLabel(player)
                          : index === 0
                            ? 'Choisir le capitaine'
                            : `Choisir le joueur ${index + 1}`}
                      </Text>
                      {player && (
                        <Text style={teamStyles.metadata}>
                          Index {player.whs_index}
                          {choice?.dejeune ? ' · Repas ✓' : ''}
                        </Text>
                      )}
                    </View>
                    {player && (
                      <View
                        style={[
                          teamStyles.dot,
                          { backgroundColor: TEE_COLORS[player.repere] ?? '#ccc' },
                        ]}
                        accessibilityLabel={`Repère ${player.repere}`}
                      />
                    )}
                    {!(index === 0 && existing) && (
                      <Ionicons name="chevron-down" size={18} color="#245b91" />
                    )}
                  </TouchableOpacity>
                  {player && index > 0 && (
                    <TouchableOpacity
                      style={teamStyles.clear}
                      disabled={busy || uncertain}
                      accessibilityRole="button"
                      accessibilityLabel={`Retirer ${playerLabel(player)}`}
                      onPress={() => {
                        setReviewed([]);
                        setMembers((previous) =>
                          previous.filter((_, position) => position !== index),
                        );
                        setMeals((previous) =>
                          previous.filter((item) => item.id !== player.licence),
                        );
                      }}
                    >
                      <Ionicons name="close" size={22} color="#607080" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {saved && (
              <>
                <Text style={teamStyles.status}>
                  {existing ? 'Équipe inscrite' : 'Nouvelle équipe'} · {members.length}/
                  {size} joueurs{members.length < size ? ' · Incomplète' : ''}
                </Text>
                <Text style={teamStyles.label}>Tranche commune</Text>
                <TouchableOpacity
                  style={teamStyles.slot}
                  disabled={busy || uncertain}
                  onPress={() => showPicker('tranche')}
                  accessibilityRole="button"
                >
                  <Text style={teamStyles.slotText}>
                    {slots.find((item) => item.id === tranche)?.label ??
                      'Choisir une tranche'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#245b91" />
                </TouchableOpacity>
                <View style={teamStyles.periods}>
                  {PERIODS.map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={teamStyles.period}
                      disabled={
                        busy || uncertain || !tranche || (shotgun && value !== 'Début')
                      }
                      onPress={() => setPeriod(value)}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: period === value,
                        disabled: !tranche || (shotgun && value !== 'Début'),
                      }}
                    >
                      <Ionicons
                        name={period === value ? 'radio-button-on' : 'radio-button-off'}
                        size={23}
                        color={
                          !tranche || (shotgun && value !== 'Début')
                            ? '#9aabb8'
                            : '#245b91'
                        }
                      />
                      <Text style={teamStyles.periodText}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.auxiliaryActions}>
                  <TouchableOpacity
                    style={[styles.commentButton, (busy || uncertain) && styles.disabled]}
                    disabled={busy || uncertain}
                    accessibilityRole="button"
                    accessibilityLabel="Commentaire du capitaine"
                    onPress={() => {
                      setCommentDraft(textOnly(comment));
                      setCommentOpen(true);
                    }}
                  >
                    <Ionicons name="chatbox-outline" size={18} color="#245b91" />
                    <Text style={styles.commentButtonText}>
                      Commentaire{comment ? ' ✓' : ''}
                    </Text>
                  </TouchableOpacity>
                  {flag(context?.resa_repas) && (
                    <TouchableOpacity
                      style={styles.commentButton}
                      disabled={busy || uncertain}
                      onPress={openMeals}
                      accessibilityRole="button"
                    >
                      <Ionicons name="restaurant-outline" size={19} color="#245b91" />
                      <Text style={styles.commentButtonText}>
                        Repas{flag(context?.resa_menu) ? ' / Menus' : ''} ·{' '}
                        {meals.filter((item) => item.dejeune).length}/{members.length}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
      <View style={teamStyles.footer}>
        {busy && <ActivityIndicator color="#245b91" />}
        {!!error && (
          <Text style={styles.footerError} accessibilityRole="alert">
            {error}
          </Text>
        )}
        {!!notice && !dirty && <Text style={styles.notice}>{notice}</Text>}
        {dirty && !error && (
          <Text style={teamStyles.metadata}>Modifications non enregistrées.</Text>
        )}
        {uncertain ? (
          <TouchableOpacity
            style={styles.button}
            disabled={busy}
            onPress={() =>
              void task(async () => {
                if (!members[0]) return;
                const result = await validate(members[0]);
                if (active.current) applyTeam(members[0], result);
              })
            }
          >
            <Text style={styles.buttonText}>Relire l’équipe</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.smallButton, (!existing || busy) && styles.disabled]}
              disabled={!existing || busy}
              onPress={() =>
                Alert.alert(
                  'Désinscription',
                  'Désinscrire toute l’équipe enregistrée ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Désinscrire',
                      style: 'destructive',
                      onPress: () => write(true),
                    },
                  ],
                )
              }
            >
              <Text style={styles.smallButtonText}>Désinscrire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.smallButton,
                (!ready || (existing && !dirty)) && styles.disabled,
              ]}
              disabled={!ready || (existing && !dirty)}
              onPress={save}
            >
              <Text style={styles.smallButtonText}>
                {existing ? 'Mettre à jour' : 'Inscrire'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, busy && styles.disabled]}
              disabled={busy}
              onPress={() => {
                if (dirty)
                  Alert.alert(
                    'Modifications non enregistrées',
                    'Passer à une autre équipe sans enregistrer ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Continuer', onPress: reset },
                    ],
                  );
                else reset();
              }}
            >
              <Text style={styles.smallButtonText}>Suivant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Modal
        visible={picker !== null}
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View style={teamStyles.picker}>
          <TouchableOpacity style={styles.backButton} onPress={() => setPicker(null)}>
            <Ionicons name="arrow-back" size={22} color="#123f6b" />
            <Text style={styles.backText}>Retour à l’équipe</Text>
          </TouchableOpacity>
          <Text style={teamStyles.title}>
            {picker === 'tranche'
              ? 'Choisir une tranche'
              : picker === 0
                ? 'Choisir le capitaine'
                : 'Choisir un partenaire'}
          </Text>
          {picker === 'tranche' ? (
            <FlatList
              data={slots}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    teamStyles.pickerItem,
                    index % 2 === 1 && teamStyles.pickerItemAlternate,
                  ]}
                  onPress={() => {
                    setTranche(item.id);
                    if (shotgun) setPeriod('Début');
                    setPicker(null);
                  }}
                >
                  <Text style={teamStyles.memberName}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={search}
                onChangeText={setSearch}
                placeholder="Début du nom ou licence"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FlatList
                data={filtered}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.licence}
                ListEmptyComponent={<Text>Aucun joueur.</Text>}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      teamStyles.pickerItem,
                      index % 2 === 1 && teamStyles.pickerItemAlternate,
                    ]}
                    onPress={() => {
                      if (typeof picker === 'number') select(item, picker);
                    }}
                  >
                    <Text style={teamStyles.memberName}>{playerLabel(item)}</Text>
                    <Text style={teamStyles.metadata}>
                      {item.licence} · Index {item.whs_index}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </Modal>
      <Modal
        visible={commentOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCommentOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.pickerOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.commentPanel}>
            <Text style={styles.sectionTitle}>Commentaire du capitaine</Text>
            <TextInput
              style={styles.commentModalInput}
              value={commentDraft}
              onChangeText={setCommentDraft}
              multiline
              autoFocus
              textAlignVertical="top"
              accessibilityLabel="Saisir le commentaire administrateur"
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setCommentOpen(false)}
                accessibilityRole="button"
              >
                <Text style={styles.smallButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => {
                  setComment(commentDraft);
                  setCommentOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.smallButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <RepasModal
        visible={mealOpen}
        joueurs={members.map((player) => ({
          id: player.licence,
          nom: playerLabel(player),
        }))}
        nbJoueursMax={size}
        selectedValues={members.map((player) => player.licence)}
        initialData={meals}
        menuDefinition={menu}
        onValidate={(choices) => {
          setMeals(choices);
          setReviewed(members.map((player) => player.licence));
          setMealOpen(false);
        }}
        onClose={() => setMealOpen(false)}
      />
    </View>
  );
}

const teamStyles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: '#aacdeeff' },
  header: { paddingHorizontal: 18, paddingTop: 5 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#46535e', marginBottom: 8 },
  body: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: 18, paddingBottom: 10 },
  memberRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
    minHeight: 48,
    alignItems: 'center',
  },
  memberSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  memberNumber: { width: 17, fontSize: 13, fontWeight: '700', color: '#245b91' },
  memberIdentity: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 14, color: '#111' },
  metadata: { fontSize: 12, color: '#475b6c', marginTop: 2 },
  dot: { height: 13, width: 13, borderRadius: 7, borderWidth: 1, borderColor: '#9aa5ae' },
  clear: { paddingHorizontal: 9, minHeight: 44, justifyContent: 'center' },
  status: { color: '#245b91', fontSize: 13, marginVertical: 7 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 4, marginBottom: 5 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6eff7',
    borderRadius: 5,
    padding: 10,
    minHeight: 44,
  },
  slotText: { flex: 1, fontSize: 14, color: '#245b91', fontWeight: '600' },
  periods: { flexDirection: 'row', marginVertical: 7 },
  period: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
  },
  periodText: { fontSize: 14 },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#91b6d4',
  },
  picker: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 55 : 25,
    backgroundColor: '#f5f6f8',
  },
  pickerItemAlternate: {
    backgroundColor: '#edf0f3',
  },
  pickerItem: {
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#d5dce3',
    minHeight: 44,
  },
});
