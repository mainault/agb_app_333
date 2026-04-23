
export interface GlobalProperties {
    nbrAttempt: number,
    isMassResaAccess: boolean,
    isResaRepas: boolean,
    isScramble: boolean,
    isAlreadyPaid: boolean,
    isPEL: boolean,
    isPelObligatoire: boolean,
    currentGolfTarif: null,
    isFromLogin: boolean,
    fromLogin: boolean,
    isComplete: string |null,
    sous_menu: string | null,
    menu: string | null,
    shotgun: boolean,
    tranche_duree: number,
    duree_trou: number,
    nbre_joueurs: number,
    jauge: number,
    formule: string,
    newTeamManagement: boolean,
    teamLeaderNomPrenom: any,
    dateCompetition: string | null,
    indexMin: string | null,
    allResaRepas: [string, string, string, string],
    allResaRepasSave: [boolean, boolean, boolean, boolean],
    team: [string | null, string | null, string | null, string | null],
    isActionForCompetitionTerminated: boolean,
    source: string | null,
    nbrRepas : number | null,
    numTranche: number | 0,
    periode: number | null,
    trancheId: [string | '',string | '',string | ''],
    labelPeriode: [string | null,string | null,string | null],
    sendMailClosure: string | null,
    isMultiCompetitions: number
    repasChecked: any,
    sendMail: boolean,
    nbrScramblePlayers: number,
    validateTeamLeaderObject : any | null,
    site: string,
    transformedData : any,
    transformedDataPayments : any,
    teamLeader: boolean,
    licence: string | null,
    userId: string | null,
    userAffected: boolean,
    teamTranche: [],
    teamPosition: [],
    members: any [],
    newTeamResa: boolean,
    teamNumber: number,
    initialNbrPlayers: number,
    isIncomplete: boolean,
    action: string | null,
    identMember?: [
      GlobalAllUsersList
    ] ,
    teamResa: string | null,
    trancheLabelHtml: string | null,
    periodeLabelHtml: string | null,
    repere: string | null,
    currentTrancheId: string | null,
    currentPeriodeId: string | null,
    menuEquipeIncomplete: boolean,
    nbrTrimestres: [],
    parcoursPars: [],
    nbrPlayersForRanking: number | null,
    rankForScores: [string],
    scoreForScores: [string],
    scoresNet: string,
    scoresBrut: string,
    rankBrut: string,
    rankNet: string,


} 
// Définition de l'objet global avec des valeurs initiales
export const initialGlobalProperties: GlobalProperties = {
    nbrAttempt: 0,
    isMassResaAccess: false,
    isResaRepas: false,
    isScramble: false,
    isAlreadyPaid: false,
    isPEL: false,
    isPelObligatoire: false,
    currentGolfTarif: null,
    isFromLogin: true,
    fromLogin: false,
    isComplete: 'normal',
    sous_menu: null,
    menu: null,
    shotgun: false,
    tranche_duree: 0,
    duree_trou: 0,
    nbre_joueurs: 0,
    jauge: 0,
    formule: 'stableford',
    newTeamManagement: false,
    teamLeaderNomPrenom: null,
    dateCompetition: null,
    indexMin: null,
    allResaRepas: ['0', '0', '0', '0',],
    allResaRepasSave: [false, false, false, false,],
    team: [null, null, null, null],
    isActionForCompetitionTerminated: false,
    source: null,
    nbrRepas: null,
    numTranche: 0,
    periode: null,
    trancheId: ['', '', ''],
    labelPeriode: [null, null, null],
    sendMailClosure: null,
    isMultiCompetitions: 0,
    repasChecked: 0,
    sendMail: false,
    nbrScramblePlayers: 0,
    validateTeamLeaderObject: null,
    site: 'production',
    transformedData : null,
    transformedDataPayments : null,
    teamLeader: false,
    licence: null,
    userId: null,
    userAffected: false,
    teamTranche: [],
    teamPosition: [],
    members: [] as any,
    newTeamResa: false,
    teamNumber: 0,
    initialNbrPlayers: 0,
    isIncomplete: false,
    action: null,
    identMember: [] as any,
    teamResa: null,
    trancheLabelHtml: null,
    periodeLabelHtml: null,
    repere: 'blanc',
    currentTrancheId: null,
    currentPeriodeId: null,
    menuEquipeIncomplete: false,
    nbrTrimestres: [] as any,
    parcoursPars: [] as any,
    nbrPlayersForRanking: 0,
    rankForScores: ["0"] ,
    scoreForScores: ["0"],
    scoresBrut: "0",
    scoresNet: "0",
    rankBrut: "0",
    rankNet: "0",
};

export interface GlobalJsonObject {
    operationType: string | null,
    status: string | null,
    licence: string | null,
    userId: string | null,
    userAffected: string | null,
    newUserResa: string | null,
    formule: string,
    teamLeader: string | null,
    teamMember: string | null,
    teamLeaderNom: string | null,
    teamLeaderPrenom: string | null,
    tranche: {
        id: string | null,
        title: string | null,
        parent_id: string | null,
        type: string | null,
        etat: string | null,
        licence: string | null,
        whs_index: string | null,
        jauge: string | null,
        serie: string | null,
        repere: string | null,
        global_id: string | null,
        date_competition: string | null,
        date_creation: string | null,
        date_modification: string | null,
        nbre_modif: string | null,
        resa_repas: string | null,
        choix_menu: string | null,
        mail_depart:string | null,
        mail_result: string | null,
        admin_commentaire: string | null,
    },
    periode: {
        id: string | null,
        title: string | null,
        parent_id: string | null,
        type: string | null,
        etat: string | null,
        licence: string | null,
        whs_index: string | null,
        jauge: string | null,
        serie: string | null,
        repere: string | null,
        global_id: string | null,
        date_competition: string | null,
        date_creation: string | null,
        date_modification: string | null,
        nbre_modif: string | null,
        resa_repas: string | null,
        choix_menu: string | null,
        mail_depart: string | null,
        mail_result: string | null,
        admin_commentaire: string | null
    },
    recipient: string | null,
    recipientName: string | null,

    nom_competition: string | null,
    date_competition: string | null,
    action: string | null,
    isResaRepas: string | null,
    resa_repas: [
        boolean,
        boolean,
        boolean,
        boolean
    ],
    resa_menu: string | null,
    indexMin_H: string | null,
    indexMin_F: string | null,
    civilite: string | null,
    whs_index: string | null,
    isEclectic: string | null,
    adresse_1: string | null,
    adresse_2: string | null,
    adresse_3: string | null,
    code_postal: string | null,
    ville: string | null,
    pays: string | null,
    email: string | null,
    date_naissance_mysql: string | null,
    isAlreadyPaid: boolean,
    tarif_as: string | null,
    isPEL_enabled: string | null,
    tarif_label: string | null,
    autreFormule: string | null,
    loginName: string | null,
    isCookieAccept: string | null,
    asAlreadyRESA: string | null,
    pel_facultatif: string | null,
    pel_obligatoire: string | null,
    pel: string | null,
    isPelGolf: string | null,
    tarif_adulte: string | null,
    tarif_enfant: string | null,
    tarif_membre: string | null,
    currentGolfTarif: string | null,
    nbrDaysCancelRefunded: string | null,
    hasResa: string | null,
    covoiturage: string | null,
    prix_repas: string | null
    members: [
      {
        id: null,
        title: null,
        parent_id: null,
        type: null,
        etat: null,
        licence: null,
        whs_index: null,
        jauge: number,
        serie: null,
        repere: null,
        global_id: null,
        date_competition: null,
        date_creation: null,
        date_modification: null,
        nbre_modif: number,
        resa_repas: number,
        choix_menu: null,
        mail_depart: boolean,
        mail_result: boolean,
        admin_commentaire: null
      }
    ],
}

// Définition de l'objet global avec des valeurs initiales
export const initialGlobalJsonObject: GlobalJsonObject = {
    operationType: null,
    status: null,
    licence: null,
    userId: null,
    userAffected: null,
    newUserResa: null,
    formule: '',
    teamLeader: null,
    teamMember: null,
    teamLeaderNom: null,
    teamLeaderPrenom: null,
    tranche: {
        id: null,
        title: null,
        parent_id: null,
        type: null,
        etat: null,
        licence: null,
        whs_index: null,
        jauge: null,
        serie: null,
        repere: null,
        global_id: null,
        date_competition: null,
        date_creation: null,
        date_modification: null,
        nbre_modif: null,
        resa_repas: null,
        choix_menu: null,
        mail_depart:null,
        mail_result: null,
        admin_commentaire: null
    },
    periode: {
        id: null,
        title: null,
        parent_id: null,
        type: null,
        etat: null,
        licence: null,
        whs_index: null,
        jauge: null,
        serie: null,
        repere: null,
        global_id: null,
        date_competition: null,
        date_creation: null,
        date_modification: null,
        nbre_modif: null,
        resa_repas: null,
        choix_menu: null,
        mail_depart: null,
        mail_result: null,
        admin_commentaire: null
    },
    recipient: null,
    recipientName: null,
    nom_competition: null,
    date_competition: null,
    action: null,
    isResaRepas: null,
    resa_repas: [
        false,
        false,
        false,
        false
    ],
    resa_menu: null,
    indexMin_H: null,
    indexMin_F: null,
    civilite: null,
    whs_index: null,
    isEclectic: null,
    adresse_1: null,
    adresse_2: null,
    adresse_3: null,
    code_postal: null,
    ville: null,
    pays: null,
    email: null,
    date_naissance_mysql: null,
    isAlreadyPaid: false,
    tarif_as: null,
    isPEL_enabled: null,
    tarif_label: null,
    autreFormule: null,
    loginName: null,
    isCookieAccept: null,
    asAlreadyRESA: null,
    pel_facultatif: null,
    pel_obligatoire: null,
    pel: null,
    isPelGolf: null,
    tarif_adulte: null,
    tarif_enfant: null,
    tarif_membre: null,
    currentGolfTarif: null,
    nbrDaysCancelRefunded: null,
    hasResa: null,
    covoiturage: null,
    prix_repas: null,
    members: [
      {
        id: null,
        title: null,
        parent_id: null,
        type: null,
        etat: null,
        licence: null,
        whs_index: null,
        jauge: 0,
        serie: null,
        repere: null,
        global_id: null,
        date_competition: null,
        date_creation: null,
        date_modification: null,
        nbre_modif: 0,
        resa_repas: 0,
        choix_menu: null,
        mail_depart: false,
        mail_result: false,
        admin_commentaire: null
      }
    ],
}

export interface GlobalResaMember{
  operationType: string | null,
  status: string | null,
  error: string | null,
  identMember: [
    {
      id: string | null,
      title: string | null,
      parent_id: string | null,
      type: string | null,
      etat: string | null,
      licence: string | null,
      whs_index: string | null,
      jauge: string | null,
      serie: string | null,
      repere: string | null,
      global_id: string | null,
      date_competition: string | null,
      date_creation: string | null,
      date_modification: string | null,
      nbre_modif: string | null,
      resa_repas: string | null,
      choix_menu: string | null,
      mail_depart: string | null,
      mail_result: string | null,
      admin_commentaire: string | null,
    }
  ],
  newTeamLeader: string | null,
  tranche: {
    id: string | null,
    title: string | null,
    parent_id: string | null,
    type: string | null,
    etat: string | null,
    licence: string | null,
    whs_index: string | null,
    jauge: string | null,
    serie: string | null,
    repere: string | null,
    global_id: string | null,
    date_competition: string | null,
    date_creation: string | null,
    date_modification: string | null,
    nbre_modif: string | null,
    resa_repas: string | null,
    choix_menu: string | null,
    mail_depart: string | null,
    mail_result: string | null,
    admin_commentaire: string | null,
  },
  position: {
    id: string | null,
    title: string | null,
    parent_id: string | null,
    type: string | null,
    etat: string | null,
    licence: string | null,
    whs_index: string | null,
    jauge: string | null,
    serie: string | null,
    repere: string | null,
    global_id: string | null,
    date_competition: string | null,
    date_creation: string | null,
    date_modification: string | null,
    nbre_modif: string | null,
    resa_repas: string | null,
    choix_menu: string | null,
    mail_depart: string | null,
    mail_result: string | null,
    admin_commentaire: string | null,
  },
  numTranche: string | null,
  title: string | null,
  tranche_duree: string | null,
  duree_trou: string | null,
  nbre_joueurs: string | null,
  labelTranche: string | null,

}

// Définition de l'objet global avec des valeurs initiales
export const initialGlobalResaMember: GlobalResaMember = {
  operationType: null,
  status: null,
  error: null,
  identMember: [
    {
      id: null,
      title: null,
      parent_id: null,
      type: null,
      etat: null,
      licence: null,
      whs_index: null,
      jauge: null,
      serie: null,
      repere: null,
      global_id: null,
      date_competition: null,
      date_creation: null,
      date_modification: null,
      nbre_modif: null,
      resa_repas: null,
      choix_menu: null,
      mail_depart: null,
      mail_result: null,
      admin_commentaire: null,
    }
  ],
  newTeamLeader: null,
  tranche: {
    id: null,
    title: null,
    parent_id: null,
    type: null,
    etat: null,
    licence: null,
    whs_index: null,
    jauge: null,
    serie: null,
    repere: null,
    global_id: null,
    date_competition: null,
    date_creation: null,
    date_modification: null,
    nbre_modif: null,
    resa_repas: null,
    choix_menu: null,
    mail_depart: null,
    mail_result: null,
    admin_commentaire: null,
  },
  position: {
    id: null,
    title: null,
    parent_id: null,
    type: null,
    etat: null,
    licence: null,
    whs_index: null,
    jauge: null,
    serie: null,
    repere: null,
    global_id: null,
    date_competition: null,
    date_creation: null,
    date_modification: null,
    nbre_modif: null,
    resa_repas: null,
    choix_menu: null,
    mail_depart: null,
    mail_result: null,
    admin_commentaire: null,
  },
  numTranche: null,
  title: null,
  tranche_duree: null,
  duree_trou: null,
  nbre_joueurs: null,
  labelTranche: null,

}

export interface GlobalReturnResaMember{
  operationType: string | null,
  status: string | null,
  error: string | null,
  userId: string | null,
  nbrOfPlayers: string | null,
  tranche: string | null,
  periode: string | null,
  licence: string | null,
  usersArray: [],
  currentCovoiturage: [],
  email: string | null,
  prenom: string | null,
  nom_competition: string | null,
  action: string | null,
  date_competition: string | null,
  userName: string | null,
  identMembers: [
      {
          id: string | null,
          title: string | null,
          parent_id: string | null,
          type: string | null,
          etat: string | null,
          licence: string | null,
          whs_index: string | null,
          jauge: string | null,
          serie: string | null,
          repere: string | null,
          global_id: string | null,
          date_competition: string | null,
          date_creation: string | null,
          date_modification: string | null,
          nbre_modif: string | null,
          resa_repas: string | null,
          choix_menu: string | null,
          mail_depart: string | null,
          mail_result: string | null,
          admin_commentaire: string | null,
      }
  ],
  isResaRepas: boolean | null,
  resa_repas: string | null,
  isNewResa: boolean | false,
  resaRepasUpdate: boolean | null,
  nom_prenom: string | null,
}

// Définition de l'objet global avec des valeurs initiales
export const initialGlobalReturnResaMember: GlobalReturnResaMember = {
  operationType: null,
  status: null,
  error: null,
  userId: null,
  nbrOfPlayers: null,
  tranche: null,
  periode: null,
  licence: null,
  usersArray: [],
  currentCovoiturage: [],
  email: null,
  prenom: null,
  nom_competition: null,
  action: null,
  date_competition: null,
  userName: null,
  identMembers: [
      {
          id: null,
          title: null,
          parent_id: null,
          type: null,
          etat: null,
          licence: null,
          whs_index: null,
          jauge: null,
          serie: null,
          repere: null,
          global_id: null,
          date_competition: null,
          date_creation: null,
          date_modification: null,
          nbre_modif: null,
          resa_repas: null,
          choix_menu: null,
          mail_depart: null,
          mail_result: null,
          admin_commentaire: null,
      }
  ],
  isResaRepas: false,
  resa_repas: null,
  isNewResa: false,
  resaRepasUpdate: false,
  nom_prenom: null,
}

export interface GlobalPlayersList {
  accessType: string | null,
  action: string | null,
  autreFormule: string | null,
  covoiturage: [],
  date_competition: string | null,
  error: string | null,
  formule: string | null,
  isFromCBReturn: boolean,
  montant: string | null,
  nbrPlayers: string | null,
  nbrRepas: string | null,
  nom_competition: string | null,
  operationType: string | null,
  paymentsList:
  [
    {
      date_paiement: string | null,
      date_scratch: string | null,
      date_wh: string | null,
      formule: string | null,
      licence: string | null,
      montant: string | null,
      nom: string | null,
      nom_competition: string | null,
      paymentId: string | null,
      prenom: string | null,
      statut: string | null,
      statut_whs: string | null,
      tarif: string | null,
    }
  ]
  playersList:
  [
    {
      licence: string | null,
      repere: string | null,
      serie: string | null,
      title: string | null,
      whs_index: string | null,
    }
  ]
  prenom: string | null,
  status: string | null,
}

// Définition de l'objet global avec des valeurs initiales
export const initialGlobalPlayersList: GlobalPlayersList= {
  accessType: null,
  action: null,
  autreFormule: null,
  covoiturage: [],
  date_competition: null,
  error: null,
  formule: null,
  isFromCBReturn: false,
  montant: null,
  nbrPlayers: null,
  nbrRepas: null,
  nom_competition: null,
  operationType: null,
  paymentsList:
  [
    {
      date_paiement: null,
      date_scratch: null,
      date_wh: null,
      formule: null,
      licence: null,
      montant: null,
      nom: null,
      nom_competition: null,
      paymentId: null,
      prenom: null,
      statut: null,
      statut_whs: null,
      tarif: null,
    }
  ],
  playersList:
  [
    {
      licence: null,
      repere: null,
      serie: null,
      title: null,
      whs_index: null,
    }
  ],
  prenom: null,
  status: null,
}

export interface GlobalPaymentsList {
  paymentsList:
  [
    {
      nom_competition: string,
      licence: string,
      nom: string,
      prenom: string,
      montant: string,
      date_paiement: string,
      paymentId: string,
      statut: string,
      statut_wh: string,
      date_wh: string,
      date_scratch: string | null,
      formule: string,
      tarif: string,
    }
  ]

}
export const initialGlobalPaymentsList: GlobalPaymentsList= {
  paymentsList:
  [
    {
      nom_competition: '',
      licence: '',
      nom: '',
      prenom: '',
      montant: '',
      date_paiement: '',
      paymentId: '',
      statut: '',
      statut_wh: '',
      date_wh: '',
      date_scratch: null,
      formule: '',
      tarif: '',
    }
  ]
}
export interface GlobalTeamLeader {
  teamLeader:
  [
    {
      globalTeamLeaderObject: any,
    }
  ]
}
export const initialGlobalTeamLeader: GlobalTeamLeader = {
  teamLeader:
  [
    {
      globalTeamLeaderObject: null,
    }
  ]
}

export interface User {
  civilite: string;
  indice: string;
  licence: string;
  login: string;
  nom: string;
  prenom: string;
  whs_index: string;
  repere: string;
}

export interface GlobalAllUsersList {
  allUsersList: User[];
}

export const initialGlobalAllUsersList: GlobalAllUsersList = {
  allUsersList: [],
};

export interface GlobalIdentMember {

  actif: string,
  adresse_1: string,
  adresse_2: string,
  adresse_3: string,
  annee_licence: string,
  civilite: string,
  code_postal: string,
  date_certificat: string,
  date_licence: string,
  date_licence_mysql: string,
  date_maj: string,
  date_naissance: string,
  date_naissance_mysql: string,
  email_birthday: boolean,
  email_renew: boolean,
  indice: number,
  licence: string,
  licence_ici: boolean,
  login: string,
  membre_as: boolean,
  mobile: string,
  nom: string,
  numero_golf: string,
  password: string,
  pays: string,
  prenom: string,
  repere: string,
  statut: string,
  table_statut: string,
  ville: string,
  whs_index: string,

}

export const initialGlobalIdentMember : GlobalIdentMember = {

  actif: '',
  adresse_1: '',
  adresse_2: '',
  adresse_3: '',
  annee_licence: '',
  civilite: '',
  code_postal: '',
  date_certificat: '',
  date_licence: '',
  date_licence_mysql: '',
  date_maj: '',
  date_naissance: '',
  date_naissance_mysql: '',
  email_birthday: false,
  email_renew: false,
  indice: 0,
  licence: '',
  licence_ici: false,
  login: '',
  membre_as: false,
  mobile: '',
  nom: '',
  numero_golf: '',
  password: '',
  pays: '',
  prenom: '',
  repere: '',
  statut: '',
  table_statut: '',
  ville: '',
  whs_index: '',
}

export interface OrphanList {
  actif: string,
  adresse_1: string,
  adresse_2: string,
  adresse_3: string,
  annee_licence: string,
  civilite: string,
  code_postal: string,
  date_certificat: string,
  date_licence: string,
  date_licence_mysql: string,
  date_maj: string,
  date_naissance: string,
  date_naissance_mysql: string,
  email_birthday: string,
  email_renew: string,
  indice: string,
  licence: string,
  licence_active: string,
  licence_ici: string,
  login: string,
  membre_as: string,
  mobile: string,
  nom: string,
  numero_golf: string,
  password: string,
  pays: string,
  prenom: string,
  statut: string,
  table_statut: string,
  ville: string,
  whs_index: string,
  repere: string,
}

export interface GlobalOrphanList {
  allOrphanList: OrphanList[];
}

export const initialGlobalOrphanList: GlobalOrphanList = {
  allOrphanList: [],
};

export interface GlobalUserOrphanList {
  actif: string,
  adresse_1: string,
  adresse_2: string,
  adresse_3: string,
  annee_licence: string,
  civilite: string,
  code_postal: string,
  date_certificat: string,
  date_licence: string,
  date_licence_mysql: string,
  date_maj: string,
  date_naissance: string,
  date_naissance_mysql: string,
  email_birthday: string,
  email_renew: string,
  indice: string,
  licence: string,
  licence_active: string,
  licence_ici: string,
  login: string,
  membre_as: string,
  mobile: string,
  nom: string,
  numero_golf: string,
  password: string,
  pays: string,
  prenom: string,
  statut: string,
  table_statut: string,
  ville: string,
  whs_index: string,
}

export const initialGlobalUserOrphanList : GlobalUserOrphanList = {
  actif: '',
  adresse_1: '',
  adresse_2: '',
  adresse_3: '',
  annee_licence: '',
  civilite: '',
  code_postal: '',
  date_certificat: '',
  date_licence: '',
  date_licence_mysql: '',
  date_maj: '',
  date_naissance: '',
  date_naissance_mysql: '',
  email_birthday: '',
  email_renew: '',
  indice: '',
  licence: '',
  licence_active: '',
  licence_ici: '',
  login: '',
  membre_as: '',
  mobile: '',
  nom: '',
  numero_golf: '',
  password: '',
  pays: '',
  prenom: '',
  statut: '',
  table_statut: '',
  ville: '',
  whs_index: '',
}

// GlobalPlayerRanking correspond à la structure des données de classement des joueurs
export interface GlobalPlayerRanking {
  "0": string;
  "1": string;
  annee: string;
  bn: string;
  brut: string;
  brut_retour: string;
  code_club: null | string;
  handicap: string;
  index_min: number;
  licence: string;
  nbr_cartes: string;
  nbrCartes: string;
  net: string;
  net_index: string;
  nom_parcours: null | string;
  nom_prenom: string;
  numLigne: number;
  recompense: string;
  repere: null | string;
  score: string;
  score_net: string;
  serie: string;
  sexe: string;
  tour: string;
  trimestre: string;
  whs_index: string;
}


export const initialGlobalPlayerRanking: GlobalPlayerRanking = {
  "0": "",
  "1": "",
  annee: "",
  bn: "",
  brut: "",
  brut_retour: "",
  code_club: null,
  handicap: "0",
  index_min: -1,
  licence: "0",
  nbr_cartes: "0",
  nbrCartes: "0",
  net: "0",
  net_index: "0",
  nom_parcours: null,
  nom_prenom: "",
  numLigne: 0,
  recompense: "0",
  repere: null,
  score: "",
  score_net: "",
  serie: "",
  sexe: "",
  tour: "",
  trimestre: "",
  whs_index: "",
};

export interface GlobalPlayerRankingRS {
  "0": string;
  "1": string;
  "2": string;
  annee: string;
  brut: string;
  brut_retour: string;
  code_club: null | string;
  handicap: string;
  index_min: number;
  licence: string;
  nbrCartes: string;
  nbr_cartes: string;
  net: string;
  net_index: string;
  nom_parcours: null | string;
  nom_prenom: string;
  numLigne: number;
  rank_brut: string;
  rank_net: string;
  recompense: string;
  repere: null | string;
  score: string;
  score_net: string;
  serie: string;
  sexe: string;
  tour: string;
  tri_brut: string;
  tri_net: string;
  whs_index: string;
  whs_index_nx: string;
}

export const initialGlobalPlayerRankingRS: GlobalPlayerRankingRS = {
  "0": "",
  "1": "",
  "2": "",
  annee: "",
  brut: "",
  brut_retour: "",    
  code_club:"",
  handicap: "0",
  index_min: -1,
  licence: "0",
  nbrCartes: "0",
  nbr_cartes: "0",
  net: "0",
  net_index: "0",
  nom_parcours:  "",
  nom_prenom: "",
  numLigne: 0,
  rank_brut: "",
  rank_net: "",
  recompense: "0",
  repere: "",
  score: "",
  score_net: "0",
  serie: "",
  sexe: "",
  tour: "",
  tri_brut: "",
  tri_net: "",
  whs_index: "",
  whs_index_nx: "",
}
export interface GlobalJsonObjectForRanking {
  operationType: string,
  status: string,
  error: string,
  user: {
      indice: number,
      date_maj: string,
      login: string,
      password: string,
      nom: string,
      prenom: string,
      civilite: string,
      statut: string,
      table_statut: string,
      date_naissance: string,
      date_naissance_mysql: string,
      whs_index: string,
      licence: string,
      date_certificat: string,
      actif: string,
      licence_ici: string,
      membre_as: string,
      licence_active: string,
      date_licence: string,
      date_licence_mysql: string,
      annee_licence: string,
      numero_golf: string,
      email_renew: string,
      email_birthday: string,
      mobile: string,
      adresse_1: string,
      adresse_2: string,
      adresse_3: string,
      code_postal: string,
      ville: string,
      pays: string
  },
  isCookieAccept: false,
  loginName: string,
  action: string,
  nomPrenom: string,
  licence: string
  isEclectic: string,
}

export const initialGlobalJsonObjectForRanking : GlobalJsonObjectForRanking = {
  operationType: "",
  status: "",
  error: "",
  user: {
      indice: -1,
      date_maj: "",
      login: "",
      password: "",
      nom: "",
      prenom: "",
      civilite: "",
      statut: "",
      table_statut: "",
      date_naissance: "",
      date_naissance_mysql: "",
      whs_index: "",
      licence: "",
      date_certificat: "",
      actif: "0",
      licence_ici: "0",
      membre_as: "0",
      licence_active: "0",
      date_licence: "",
      date_licence_mysql: "",
      annee_licence: "0",
      numero_golf:"0",
      email_renew:"0",
      email_birthday:"0",
      mobile:"",
      adresse_1:"",
      adresse_2:"",
      adresse_3:"",
      code_postal:"",
      ville:"",
      pays:""
  },
  isCookieAccept:false,
  loginName:"",
  action:"",
  nomPrenom:"",
  licence:"",
  isEclectic:"",
}


// GlobalPlayerRanking correspond à la structure des données de classement des joueurs
export interface GlobalPlayerForScores {
  // Ordre exact tel que défini dans mergedRanking
  T1: string;
  T2: string;
  T3: string;
  T4: string;
  T5: string;
  T6: string;
  T7: string;
  T8: string;
  T9: string;
  T10: string;
  T11: string;
  T12: string;
  T13: string;
  T14: string;
  T15: string;
  T16: string;
  T17: string;
  T18: string;
  annee: string;
  bn: string;
  brut: string;
  brut_retour: string;
  code_club: string | null;
  handicap: string;
  index_min: number;
  licence: string;
  nbr_cartes: string;
  nbrCartes: string;
  net: string;
  net_index: string;
  nom_parcours: string | null;
  nom_prenom: string;
  numLigne: number;
  recompense: string;
  repere: string | null;
  score: string;
  score_net: string;
  serie: string;
  sexe: string;
  tour: string;
  trimestre: string;
  whs_index: string;
}

export const initialGlobalPlayerForScores : GlobalPlayerForScores = {
  T1: "",
  T2: "",
  T3: "",
  T4: "",
  T5: "",
  T6: "",
  T7: "",
  T8: "",
  T9: "",
  T10: "",
  T11: "",
  T12: "",
  T13: "",
  T14: "",
  T15: "",
  T16: "",
  T17: "",
  T18: "",
  annee: "",
  bn: "",
  brut: "",
  brut_retour: "",
  code_club: null,
  handicap: "0",
  index_min: -1,
  licence: "0",
  nbr_cartes:"0",
  nbrCartes:"0",
  net:"0",
  net_index:"0",
  nom_parcours:null,
  nom_prenom:"",
  numLigne: 0,
  recompense:"0",
  repere:null,
  score:"",
  score_net:"",
  serie:"",
  sexe:"",
  tour:"",
  trimestre:"",
  whs_index:"",
}

export interface Tarifs {
    nom_competition: string | null;  // Nom de la compétition concernée (peut être null)
    membre_AS: number;               // Tarif pour les membres de l'AS
    membre: number;                  // Tarif pour les membres (non AS)
    licence_seule: number;           // Tarif pour une licence seule
    exterieur: number;               // Tarif pour les extérieurs
    abonne_as: number;               // Tarif pour les abonnés AS
    abonne: number;                  // Tarif pour les abonnés (non AS)
    cancel_resa_refund: number;      // Montant remboursé en cas d'annulation
    olp_actif: boolean;              // Indique si l'OLP est actif
    saison: string | null;           // Saison concernée (peut être null)
    repas: string;                   // Code ou montant lié aux repas
}

export interface GlobalAsTarifs {
    operationType: string;
    status: string;
    error: string;
    olp_actif: boolean;
    tarifs_as: Tarifs;               // Tarifs pour l'AS
    tarifs_eclectic: Tarifs;         // Tarifs pour les compétitions éclectiques
    tarifs_eclectic_is: Tarifs;      // Tarifs pour les compétitions éclectiques IS
    tarifs_eclectic_rs: Tarifs;      // Tarifs pour les compétitions éclectiques RS
    tarifs_classement: Tarifs;       // Tarifs pour les compétitions de classement
    players: Array<{nom: string, prenom: string, licence: string}>;
    competitions: string[];
    competitionType: Record<string, boolean>;
    tarifs_as_special: boolean;
    tarifs_eclectic_special: boolean;
    tarifs_eclectic_is_special: boolean;
    tarifs_eclectic_rs_special: boolean;
    tarifs_classement_special: boolean;
}

// Définition du type pour GlobalCurrentCompetition
export interface GlobalCurrentCompetition {
  operationType: string;
  status: string;
  error: string;
  currentCompetition: string;
  date_competition: string;
  resa_repas: string;
  resa_menu: string;
  formule: string;
  action: string;
  nbrInscrits: string;
  isEclectic: string;
  mailFilePath: string;
  isMultiCompetitions: string;
  list: string;
  etat_competition: string;
  index_H: string;
  index_F: string;
  isShotgun: boolean;
  etat: string;
  competition_key: string;
  nbrJoueurs: string;
  dateUpdate: string;
  isPEL: string;
  covoiturage: string;
  isPelGolf: string;
  tarif_adulte: string;
  tarif_enfant: string;
  isPelObligatoire: string;
  isPelFacultatif: string;
  incompleteTeams: any[];
  restriction: string;
}

// Interface pour un élément de covoiturage
export interface CovoiturageItem {
  id: string;
  title: string;
  parent_id: string;
  type: string;
  etat: string;
  licence: string;
  whs_index: string;
  jauge: string;
  serie: string;
  repere: string;
  global_id: string;
  date_competition: string;
  date_creation: string;
  date_modification: string;
  nbre_modif: string;
  resa_repas: string;
  choix_menu: string;
  mail_depart: string;
  mail_result: string;
  mail_classement: string;
  admin_commentaire: string;
  nom_competition: string;
  cle_passager: string;
  cle_conducteur: string;
  nom_prenom: string;
  statut: string;
  tp: string;
  tp_short: string;
  supprimer: string;
}

// Interface pour un utilisateur dans le covoiturage
export interface CovoiturageUser {
  login: string;
  licence: string;
  civilite: string;
  indice: string;
  nom: string;
  prenom: string;
  whs_index: string;
  tp_short: string;
  statut: string;
}

// Interface principale pour l'objet GlobalCovoiturage
export interface GlobalCovoiturageObject {
  operationType: string;
  status: string;
  error: string;
  currentCovoiturage: CovoiturageItem[];
  usersArray: CovoiturageUser[];
  licence: string;
  nom_prenom: string;
}

export type GlobalAppVersionObject = {
  latestVersion: string;
  minVersion: string;
  message: string;
  features?: string[]; // 👈 ARRAY DE STRING
}
// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const globalpropertiesRoute = () => {
  return null; // ou une redirection si nécessaire
};
export default globalpropertiesRoute; // Export par défaut requis par expo-router