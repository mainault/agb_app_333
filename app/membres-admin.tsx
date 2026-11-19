import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from './src/components/ScreenContainer';
import { sendAdminRequest } from './src/utils/adminAuth';

type Member = Record<string, string>;
type Choice = { id: string; label: string };
type Person = {
  licence: string;
  nom: string;
  prenom: string;
  whs_index: string;
  actif: string;
};
const STATUSES: Choice[] = [
  { id: '01', label: 'Abonné + AS + licence' },
  { id: '02', label: 'Abonné + licence' },
  { id: '03', label: 'Licence seule' },
  { id: '04', label: 'Extérieur' },
  { id: '05', label: 'Abonné + AS' },
  { id: '06', label: 'Abonné' },
  { id: '11', label: 'AS seule' },
];
const CIVILITIES = ['M.', 'Mme', 'Mlle'].map((id) => ({ id, label: id }));
const KEYS = [
  'login',
  'password',
  'nom',
  'prenom',
  'civilite',
  'statut',
  'licence_ici',
  'membre_as',
  'actif',
  'numero_golf',
  'whs_index',
  'date_naissance',
  'date_licence',
  'annee_licence',
  'licence',
  'date_certificat',
  'adresse_1',
  'adresse_2',
  'adresse_3',
  'code_postal',
  'ville',
  'pays',
  'mobile',
];
const fingerprint = (member: Member) => JSON.stringify(KEYS.map((key) => member[key] ?? ''));
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

    .toLocaleLowerCase('fr');
const blank = (): Member => ({
  ...Object.fromEntries(KEYS.map((key) => [key, ''])),
  civilite: 'M.',
  statut: '',
  licence_ici: '0',
  membre_as: '0',
  actif: '1',
  pays: 'France',
});

export default function AdminMembers() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [original, setOriginal] = useState<Member | null>(null);
  const [mode, setMode] = useState<'create' | 'modify' | 'delete'>('modify');
  const [modeLocked, setModeLocked] = useState(false);
  const creating = mode === 'create';
  const deleting = mode === 'delete';
  const [clubCode, setClubCode] = useState('');
  const [section, setSection] = useState('identity');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [picker, setPicker] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const dirty = !!member && !deleting && (creating || fingerprint(member) !== fingerprint(original ?? {}));
  const context = {isMobile: '1', support: Platform.OS === 'ios' ? 'APP_IOS' : 'APP_ANDROID', };
  const run = async (work: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
    } catch (exception) {
      if (alive.current)
        setError(
          exception instanceof Error
            ? exception.message
            : 'Opération impossible.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const loadList = () =>
    void run(async () => {
      const response = await sendAdminRequest<{
        usersArray: Person[];
        codeClub?: string;
      }>({
        ...context,
        operationType: 'getMobileAdminMembers',
      });
      if (!Array.isArray(response.usersArray))
        throw new Error('Liste des utilisateurs invalide.');
      if (alive.current) {
        setPeople(response.usersArray);
        setClubCode(response.codeClub ?? '');
        setLoaded(true);
      }
    });
  useEffect(() => {
    alive.current = true;
    loadList();
    return () => {
      alive.current = false;
    };
  }, []);
  const apply = (value: Member) => {
    if (!value.licence || typeof value.password !== 'string')
      throw new Error('Fiche membre incomplète.');
    const values = { ...blank(), ...value };
    values.statut = values.statut.padStart(2, '0');
    setModeLocked(true);
    setMember(values);
    setOriginal(values);
    setMode((previous) => (previous === 'delete' ? 'delete' : 'modify'));
    setUncertain(false);
    setPasswordVisible(false);
  };
  const open = (person: Person) => {
    setPicker(null);
    void run(async () => {
      const response = await sendAdminRequest<{ member: Member }>({
        ...context,
        operationType: 'getMobileAdminMember',
        licenceOrigine: person.licence,
      });
      if (alive.current) {
        apply(response.member);
        setSection('identity');
      }
    });
  };
  const abandon = (next: () => void) => {
    if (busy) return;
    if (dirty && !uncertain)
      Alert.alert(
        'Modifications non enregistrées',
        'Continuer sans enregistrer la fiche ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer', onPress: next },
        ],
      );
    else next();
  };
  const changeMode = (value: 'create' | 'modify' | 'delete') => {
    if (modeLocked || busy || uncertain) return;
    abandon(() => {
      setMode(value);
      setModeLocked(true);
      if (value === 'create') {
        setMember(blank());
        setOriginal(null);
      } else setMember(original ? { ...original } : null);
      setSection('identity');
      setPasswordVisible(false);
      setError('');
      setNotice('');
    });
  };
  const removeMember = () => {
    if (!original || busy || uncertain) return;
    const target = { ...original };
    Alert.alert(
      'Supprimer le membre',
      `Supprimer définitivement la fiche de ${target.nom} ${target.prenom} (${target.licence}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            void run(async () => {
              try {
                const response = await sendAdminRequest<{
                  deletedLicence: string;
                  committed: boolean;
                }>({
                  ...context,
                  operationType: 'saveMobileAdminMember',
                  CRUD: 'delete',
                  licenceOrigine: target.licence,
                });
                if (
                  response.committed !== true ||
                  response.deletedLicence !== target.licence
                )
                  throw new Error('Suppression non confirmée.');
                if (!alive.current) return;
                setPeople((previous) =>
                  previous.filter(
                    (person) => person.licence !== target.licence,
                  ),
                );
                setMember(null);
                setOriginal(null);
                setPasswordVisible(false);
                setNotice('Fiche membre supprimée.');
              } catch (exception) {
                if (alive.current) setUncertain(true);
                throw new Error(
                  'Résultat de la suppression à vérifier avant de recommencer. ' +
                    (exception instanceof Error ? exception.message : ''),
                );
              }
            }),
        },
      ],
    );
  };
  const update = (key: string, value: string) => {
    setNotice('');
    setMember((previous) => {
      if (!previous) return previous;
      const next = { ...previous, [key]: value };
      if (key === 'statut') {
        next.licence_ici = ['01', '02', '03'].includes(value) ? '1' : '0';
        next.membre_as = ['01', '05', '11'].includes(value) ? '1' : '0';

        if (value !== '04' && clubCode) next.numero_golf = clubCode;
      }
      if (
        creating &&
        key === 'date_naissance' &&
        (!previous.password || previous.password === previous.date_naissance)
      )
        next.password = value;
      if (next.statut === '04') next.licence_ici = '0';
      next.actif =
        next.statut === '04'
          ? '2'
          : next.annee_licence === String(new Date().getFullYear())
            ? '1'
            : '0';
      return next;
    });
  };
  const save = () => {
    if (!member || busy || uncertain || !dirty || deleting) return;
    const fields: Member = {
      ...member,
      actif:
        member.statut === '04'
          ? '2'
          : member.annee_licence === String(new Date().getFullYear())
            ? '1'
            : '0',
    };
    if (
      !fields.nom.trim() ||
      !fields.prenom.trim() ||
      !fields.login.trim() ||
      !fields.password
    ) {
      Alert.alert(
        'Fiche incomplète',
        'Renseignez le nom, le prénom, l’email et le mot de passe.',
      );
      return;
    }
    if (fields.statut === '04' && fields.licence_ici !== '0') {
      Alert.alert(
        'Fiche incohérente',
        'Avec le statut Extérieur, Licencié à Baugé doit être décoché.',
      );
      return;
    }
    const execute = () =>
      void run(async () => {
        let accepted = false;
        try {
          const response = await sendAdminRequest<{
            member: Member;
            committed: boolean;
            emailRenew: string;
          }>({
            ...context,
            operationType: 'saveMobileAdminMember',
            CRUD: creating ? 'create' : 'modify',
            licenceOrigine: original?.licence ?? '',
            ...Object.fromEntries(KEYS.map((key) => [key, fields[key] ?? ''])),
          });
          if (response.committed !== true || !response.member?.licence)
            throw new Error('Confirmation d’enregistrement absente.');
          accepted = true;
          if (alive.current) {
            apply(response.member);
            setNotice(
              response.emailRenew !== '0'
                ? 'Fiche membre enregistrée. Envoi des emails en cours…'
                : 'Fiche membre enregistrée.',
            );
          }
          let mailWarning = '';
          // Même diffusion de renouvellement que le formulaire web, après succès seulement.
          if (response.emailRenew !== '0') {
            try {
              await sendAdminRequest({
                ...context,
                operationType: 'sendEmailRenew',
              });
            } catch {
              mailWarning =
                ' L’envoi des emails de renouvellement n’a pas pu être confirmé. Vérifiez le journal avant de relancer une diffusion.';
            }
          }
          if (!alive.current) return;
          // Remplacer la fiche à sa position actuelle, sans retrier toute la liste.
          // En création, ajouter la nouvelle fiche en fin de liste.
          setPeople((previous) => {
            const updated: Person = {
              licence: response.member.licence,
              nom: response.member.nom,
              prenom: response.member.prenom,
              whs_index: response.member.whs_index,
              actif: response.member.actif,
            };
            const next: Person[] = [];
            let inserted = false;
            for (const person of previous) {
              if (
                person.licence === original?.licence ||
                person.licence === updated.licence
              ) {
                if (!inserted) {
                  next.push(updated);
                  inserted = true;
                }
              } else {
                next.push(person);
              }
            }
            if (!inserted) next.push(updated);
            return next;
          });
          setNotice('Fiche membre enregistrée.');
          if (mailWarning) setError('La fiche est enregistrée.' + mailWarning);
        } catch (exception) {
          if (alive.current && !accepted)
            setUncertain(
              !(
                exception instanceof Error &&
                exception.message.startsWith('Validation : ')
              ),
            );
          throw new Error(
            (accepted
              ? 'Fiche enregistrée. '
              : 'Résultat à vérifier avant de recommencer. ') +
              (exception instanceof Error ? exception.message : ''),
          );
        }
      });
    if (!creating && fields.licence !== original?.licence) {
      Alert.alert(
        'Changement de licence',
        'Comme sur le formulaire web, cette correction porte sur la fiche membre. Elle ne renumérote pas les réservations existantes. Confirmer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer', onPress: execute },
        ],
      );
    } else execute();
  };
  const field = (
    key: string,
    label: string,
    options: { placeholder?: string; numeric?: boolean; secret?: boolean } = {},
  ) => (
    <View key={key} style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={member?.[key] ?? ''}
          onChangeText={(value) => update(key, value)}
          editable={!busy && !uncertain && !deleting}
          placeholder={options.placeholder}
          placeholderTextColor="#73818b"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={options.secret && !passwordVisible}
          keyboardType={
            key === 'login'
              ? 'email-address'
              : key === 'mobile'
                ? 'phone-pad'
                : options.numeric
                  ? 'numbers-and-punctuation'
                  : 'default'
          }
          accessibilityLabel={label}
        />
        {options.secret && (
          <TouchableOpacity
            style={s.eye}
            onPress={() => setPasswordVisible((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible
                ? 'Masquer le mot de passe'
                : 'Afficher le mot de passe'
            }
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color="#245b91"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  const choice = (key: string, label: string, values: Choice[]) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity
        style={s.choice}
        disabled={busy || uncertain || deleting}
        onPress={() => setPicker(key)}
        accessibilityRole="button"
      >
        <Text style={s.choiceText}>
          {values.find((value) => value.id === member?.[key])?.label ??
            member?.[key] ??
            'Choisir'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#245b91" />
      </TouchableOpacity>
    </View>
  );
  const toggle = (key: string, label: string) => (
    <TouchableOpacity
      style={s.toggle}
      disabled={
        busy ||
        uncertain ||
        deleting ||
        (key === 'licence_ici' && member?.statut === '04')
      }
      onPress={() => update(key, member?.[key] === '1' ? '0' : '1')}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: member?.[key] === '1',
        disabled:
          busy ||
          uncertain ||
          deleting ||
          (key === 'licence_ici' && member?.statut === '04'),
      }}
    >
      <Ionicons
        name={member?.[key] === '1' ? 'checkbox-outline' : 'square-outline'}
        size={23}
        color="#245b91"
      />
      <Text>{label}</Text>
    </TouchableOpacity>
  );
  const options =
    picker === 'civilite' ? CIVILITIES : picker === 'statut' ? STATUSES : [];
  const filtered = people.filter((person) =>
    normalize(person.nom + ' ' + person.prenom + ' ' + person.licence).includes(
      normalize(search.trim()),
    ),
  );
  const leave = () => abandon(() => router.back());
  return (
    <ScreenContainer onMenuPress={leave}>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={leave} disabled={busy}>
            <Ionicons name="arrow-back" size={21} color="#123f6b" />
            <Text style={s.backText}>Retour à l’administration</Text>
          </TouchableOpacity>
          <Text style={s.title}>Gestion des utilisateurs</Text>
          {loaded && (
            <>
              <View style={s.modeRow} accessibilityRole="radiogroup">
                {(
                  [
                    ['create', 'Créer'],
                    ['modify', 'Modifier'],
                    ['delete', 'Supprimer'],
                  ] as const
                ).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    style={s.modeChoice}
                    disabled={busy || uncertain || modeLocked}
                    onPress={() => changeMode(value)}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: modeLocked && mode === value,
                      disabled: busy || uncertain || modeLocked,
                    }}
                  >
                    <Ionicons
                      name={
                        modeLocked && mode === value
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={22}
                      color="#245b91"
                    />
                    <Text style={s.modeText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {modeLocked && (
                <TouchableOpacity
                  disabled={busy || uncertain}
                  onPress={() =>
                    abandon(() => {
                      setModeLocked(false);
                      setMember(null);
                      setOriginal(null);
                      setPasswordVisible(false);
                      setError('');
                      setNotice('');
                    })
                  }
                  accessibilityRole="button"
                >
                  <Text style={s.modeText}>Changer d’action</Text>
                </TouchableOpacity>
              )}
              {modeLocked && !creating && (
                <TouchableOpacity
                  style={s.memberSearch}
                  disabled={busy}
                  onPress={() =>
                    abandon(() => {
                      setSearch('');
                      setPicker('member');
                    })
                  }
                  accessibilityRole="button"
                >
                  <Ionicons name="search-outline" size={19} color="#245b91" />
                  <Text style={s.memberSearchText}>
                    {member
                      ? `${member.nom} ${member.prenom}`
                      : 'Choisir un membre'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#245b91" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <ScrollView
          style={s.body}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {!loaded ? (
            busy || !error ? (
              <ActivityIndicator size="large" color="#245b91" />
            ) : (
              <TouchableOpacity style={s.action} onPress={loadList}>
                <Text style={s.actionText}>Réessayer</Text>
              </TouchableOpacity>
            )
          ) : !member ? (
            <Text style={s.description}>
              Sélectionnez Créer pour une nouvelle fiche, ou recherchez un
              membre à modifier ou supprimer.
            </Text>
          ) : (
            <>
              <Text style={s.description}>
                {creating
                  ? 'Nouveau membre'
                  : `${member.nom} ${member.prenom} · ${member.licence}`}
              </Text>
              <View style={s.tabs}>
                {[
                  ['identity', 'Identité'],
                  ['licence', 'Licence'],
                  ['address', 'Adresse'],
                ].map(([id, title]) => (
                  <TouchableOpacity
                    key={id}
                    style={[s.tab, section === id && s.tabSelected]}
                    onPress={() => setSection(id)}
                  >
                    <Text
                      style={[s.tabText, section === id && s.tabTextSelected]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {section === 'identity' && (
                <>
                  {field('login', 'Email / login')}
                  {field('password', 'Mot de passe', { secret: true })}
                  <Text style={s.hint}>
                    À la création : la date de naissance est proposée comme mot
                    de passe initial.
                  </Text>
                  {field('nom', 'Nom')}
                  {field('prenom', 'Prénom')}
                  {choice('civilite', 'Civilité', CIVILITIES)}
                  {field('date_naissance', 'Date de naissance', {
                    placeholder: 'jj/mm/aaaa',
                    numeric: true,
                  })}
                  {field('mobile', 'Téléphone mobile (facultatif)', {
                    placeholder: '06… ou +33…',
                  })}
                  {choice('statut', 'Statut', STATUSES)}
                  <View style={s.actions}>
                    {toggle('licence_ici', 'Licencié à Baugé')}
                    {toggle('membre_as', 'Membre AS')}
                  </View>
                </>
              )}
              {section === 'licence' && (
                <>
                  {creating && (
                    <Text style={s.hint}>
                      Pour un joueur non licencié en France, laissez la licence
                      vide : le serveur attribuera un identifiant interne.
                    </Text>
                  )}
                  {field('licence', 'Numéro de licence', {
                    placeholder: '9 chiffres',
                    numeric: true,
                  })}
                  {field('numero_golf', 'Numéro du club', {
                    placeholder: '0000 à 9999',
                    numeric: true,
                  })}
                  {field('whs_index', 'Index WHS', {
                    placeholder: 'Entre -10 et 54',
                    numeric: true,
                  })}
                  {field('date_licence', 'Date de licence', {
                    placeholder: 'jj/mm/aaaa',
                    numeric: true,
                  })}
                  <Text style={s.hint}>
                    Extérieur selon le statut choisi ; pour les autres statuts,
                    actif si la licence est de l’année en cours.
                  </Text>
                  {field('annee_licence', 'Année de licence', {
                    placeholder: String(new Date().getFullYear()),
                    numeric: true,
                  })}
                  {field(
                    'date_certificat',
                    'Fin de validité du certificat / questionnaire',
                    { placeholder: 'jj/mm/aaaa ou aaaa-mm-jj', numeric: true },
                  )}
                </>
              )}
              {section === 'address' && (
                <>
                  <Text style={s.hint}>
                    Tous les champs d’adresse sont facultatifs.
                  </Text>
                  {field('adresse_1', 'Adresse')}
                  {field('adresse_2', 'Complément d’adresse')}
                  {field('adresse_3', 'Autre complément')}
                  {field('code_postal', 'Code postal')}
                  {field('ville', 'Ville')}
                  {field('pays', 'Pays')}
                </>
              )}
              {!creating && (
                <Text style={s.hint}>
                  Dernière mise à jour : {member.date_maj || '—'}
                </Text>
              )}
            </>
          )}
        </ScrollView>
        <View style={s.footer}>
          {busy && <ActivityIndicator color="#245b91" />}
          {!!error && (
            <Text style={s.error} accessibilityRole="alert">
              {error}
            </Text>
          )}
          {!!notice && !dirty && <Text style={s.notice}>{notice}</Text>}
          {uncertain ? (
            <TouchableOpacity
              style={s.action}
              disabled={busy}
              onPress={() => {
                setSearch(member?.licence || member?.nom || '');
                setPicker('member');
                loadList();
              }}
            >
              <Text style={s.actionText}>Rechercher et relire la fiche</Text>
            </TouchableOpacity>
          ) : (
            !!member && (
              <TouchableOpacity
                style={[
                  s.action,
                  deleting && s.deleteButton,
                  (busy || (!deleting && !dirty)) && s.disabled,
                ]}
                disabled={busy || (!deleting && !dirty)}
                onPress={deleting ? removeMember : save}
              >
                <Text style={s.actionText}>
                  {deleting
                    ? 'Supprimer le membre'
                    : creating
                      ? 'Créer le membre'
                      : 'Enregistrer les modifications'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
        <Modal
          visible={picker !== null}
          animationType="slide"
          onRequestClose={() => setPicker(null)}
        >
          <View style={s.picker}>
            <TouchableOpacity style={s.back} onPress={() => setPicker(null)}>
              <Ionicons name="arrow-back" size={21} color="#123f6b" />
              <Text style={s.backText}>Retour à la fiche</Text>
            </TouchableOpacity>
            {picker === 'member' ? (
              <>
                <TextInput
                  style={s.search}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Nom, prénom ou licence"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {busy && <ActivityIndicator color="#245b91" />}
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.licence}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={s.description}>Aucun joueur trouvé.</Text>
                  }
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[s.listItem, index % 2 === 1 && s.alternate]}
                      disabled={busy}
                      onPress={() => open(item)}
                    >
                      <Text style={s.name}>
                        {item.nom} - {item.prenom}
                      </Text>
                      <Text style={s.hint}>
                        {item.licence} · Index {item.whs_index}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[s.listItem, index % 2 === 1 && s.alternate]}
                    onPress={() => {
                      if (picker) update(picker, item.id);
                      setPicker(null);
                    }}
                  >
                    <Text style={s.name}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  modeRow: { flexDirection: 'row', marginBottom: 10 },
  modeChoice: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
  },
  modeText: { fontSize: 14, color: '#123f6b' },
  memberSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#829bae',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  memberSearchText: { flex: 1, fontSize: 14, color: '#245b91' },
  deleteButton: { backgroundColor: '#a52b2b' },
  root: { flex: 1, minHeight: 0, backgroundColor: '#aacdeeff' },
  header: { paddingHorizontal: 16, paddingTop: 6 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 6,
  },
  backText: { color: '#123f6b', fontSize: 15, fontWeight: '600' },
  body: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: 16, paddingBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  action: {
    flex: 1,
    minHeight: 44,
    padding: 11,
    backgroundColor: '#245b91',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: { fontSize: 15, marginVertical: 10 },
  field: { marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  inputRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#829bae',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111',
  },
  eye: { justifyContent: 'center', paddingHorizontal: 10 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#829bae',
    borderRadius: 5,
    minHeight: 42,
    padding: 9,
  },
  choiceText: { flex: 1, fontSize: 15, color: '#111' },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
  },
  hint: { fontSize: 12, color: '#465762', marginVertical: 4 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#e8eff5',
    borderRadius: 5,
  },
  tabSelected: { backgroundColor: '#245b91' },
  tabText: { fontSize: 14, color: '#123f6b' },
  tabTextSelected: { color: '#fff' },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#91b6d4',
  },
  error: { fontSize: 13, color: '#8b1515', marginBottom: 7 },
  notice: { fontSize: 14, color: '#22633c', marginBottom: 7 },
  disabled: { opacity: 0.5 },
  picker: {
    flex: 1,
    backgroundColor: '#f5f6f8',
    paddingTop: Platform.OS === 'ios' ? 55 : 25,
    paddingHorizontal: 16,
  },
  search: {
    backgroundColor: '#fff',
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#829bae',
    borderRadius: 5,
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#d5dce3',
  },
  alternate: { backgroundColor: '#edf0f3' },
  name: { fontSize: 15, color: '#111' },
});
