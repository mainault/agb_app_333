// app/subMenu/Login.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGlobalJsonObject, getGlobalJsonObjectForRanking, getGlobalOrphanList, getGlobalProperties, getGlobalUserOrphanList, resetGlobalJsonObject, resetGlobalJsonObjectForRanking, resetGlobalOrphanList, setGlobalIdentMember, setGlobalJsonObject, setGlobalJsonObjectForRanking, setGlobalOrphanList, setGlobalProperty, setGlobalUserOrphanList, setGlobalUsersList } from '../src//store/GlobalPropertiesManager';
import CustomButton from '../src/components/CustomButton';
import ScreenContainer from '../src/components/ScreenContainer';
import { sendRequest } from '../src/utils/api';
import { showAlert } from '../src/utils/utilities';

// Fonction pour valider une adresse e-mail
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const { subMenuTitle, parentName, competitionType, selectedCompetitionKey, selectedCompetitionName } = useLocalSearchParams<{
    subMenuTitle: string;
    parentName: string;
    competitionType: string;
    selectedCompetitionKey: string;
    selectedCompetitionName: string;
  }>();

  // État pour gérer l'état de chaque bouton par son ID
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({
    'valider-btn': true,    // Désactivé par défaut
    'abandonner-btn': true,  // Activé par défaut
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setIsConfirmNewPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false); // État pour afficher/masquer la section de changement de mot de passe

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  const toggleNewPasswordVisibility = () => setIsNewPasswordVisible(!isNewPasswordVisible);
  const toggleConfirmNewPasswordVisibility = () => setIsConfirmNewPasswordVisible(!isConfirmNewPasswordVisible);

  const validateFields = () => {
    let isValid = true;
    if (!email) {
      setEmailError("L'adresse e-mail est obligatoire");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Veuillez entrer une adresse e-mail valide");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Le mot de passe est obligatoire");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Le mot de passe doit faire au moins 8 caractères");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (showChangePassword && newPassword && newPassword.length < 8) {
      setNewPasswordError("Le nouveau mot de passe doit faire au moins 8 caractères");
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    if (showChangePassword && newPassword !== confirmNewPassword && confirmNewPassword !== '') {
      showAlert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
      isValid = false;
      return;
    }
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;
    let action = subMenuTitle.includes("Classement") ? "classement" : "";
    action = subMenuTitle.includes("Mes scores") ? "scoreManagement" : action;
    action = subMenuTitle.includes("Liste des inscrits") ? "list" : action;
    const donnees = ({
      action: action,
      isCookieAccept: false,
      isEclectic: competitionType === "covoiturage" ? "isAllTypes" : competitionType,
      isMobile: "1",
      list: "",
      menu: parentName,
      nbrAttempt: 1,
      newUserPassword: showChangePassword ? newPassword : "",
      nom_competition: subMenuTitle.includes("Classement") ? "" : selectedCompetitionName,
      operationType: "validateUserLogin",
      sous_menu: "",
      userLogin: email,
      userPassword: password,
    });
    fetchDataFromServer(donnees as any);
  }

  const fetchDataFromServer = async (donnees: any) => {
    try {
      setIsLoading(true);
      getServerResponse(await sendRequest(donnees));
    } catch (error) {
      console.error("Erreur :", error);
      showAlert("Erreur", "Problème de connexion.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de dispatch des réponses du serveur
  const getServerResponse = (jsonObject: any) => {
    setIsLoading(false);
    switch(jsonObject.operationType){
      case "validateUserLogin":
        if(jsonObject.status == "KO"){
          console.log("jsonObject.error = ", jsonObject);
          if (getGlobalProperties().nbrAttempt === 0) {
              setGlobalProperty('nbrAttempt', 1);
              displayErrorMessage(jsonObject.error, "OK");
              return;
          }
          if (getGlobalProperties().nbrAttempt > 4) {
              setGlobalProperty('nbrAttempt', 0);
              setTimeout(() => {
                displayErrorMessage("Vous avez atteint la limite du nombre de tentatives de connexions (5)\nContactez le webmaster pour récupérer votre mot de passe", "OK");
              }, 5);
              router.replace("/");
          }else{
            setGlobalProperty('nbrAttempt', getGlobalProperties().nbrAttempt +1);
            displayErrorMessage(jsonObject.error, "OK");
            return;
          }
        }
        if(subMenuTitle === "Mes scores"){
          resetGlobalJsonObjectForRanking();
          setGlobalJsonObjectForRanking(jsonObject);
        }else if(subMenuTitle === "Classement"){
          resetGlobalJsonObjectForRanking();
          setGlobalJsonObjectForRanking(jsonObject);
        }else{
          resetGlobalJsonObject();
          setGlobalJsonObject(jsonObject);
        }
        if(!validateUserLogin()){

          return;
        }
        // Gestion du dispatch en fonction du sous-menu  ou présence covoiturage
        switch (subMenuTitle){
          case "Mes scores":
            router.push({
              pathname: `/src/reservation/mesScores`,
              params: {
                menuTitle: subMenuTitle,
                parentMenuName: parentName,
                competitionType: competitionType,
                competitionName: selectedCompetitionName,
                globalJsonObject: JSON.stringify(getGlobalJsonObjectForRanking()),
                },
            })
            break;
          case "Classement" :
            router.push({
                pathname: `/src/reservation/displayRanking`,
                params: {
                  menuTitle: subMenuTitle,
                  parentMenuName: parentName,
                  competitionType: competitionType,
                  competitionName: selectedCompetitionName,
                },
              })
              break;

          case "Liste des inscrits":
            router.push({
              pathname: `/src/reservation/displayListInscrits`,
              params: {
                menuTitle: subMenuTitle,
                parentMenuName: parentName,
                competitionType: competitionType,
                competitionName: selectedCompetitionName,
                globalJsonObject: JSON.stringify(getGlobalJsonObject()),
              },
            });
            break;

          case "Covoiturage":
            router.push({
              pathname: `/src/reservation/covoiturage`,
              params: {
                menuTitle: subMenuTitle,
                parentMenuName: parentName,
                competitionType: competitionType,
                competitionName: selectedCompetitionName,
                returnTo: "",
              },
            });
            break;

            default:
              router.push({
                pathname: `/src/reservation/resa`,
                params: {
                  menuTitle: subMenuTitle,
                  parentMenuName: parentName,
                  competitionType: competitionType,
                  competitionName: selectedCompetitionName,
                  competitionKey: selectedCompetitionKey,
                },
              });
            break;
        }
        break;

      case "getFormuleOfCurrentCompetition":
        getFormuleOfCurrentCompetition(jsonObject);
        break;

      case 'removeResaUser':
        getRemoveResaUser(jsonObject);
        break;

      case 'sendTeamResaMail':
        showAlert("Information", "Un e-mail de confirmation de désinscription a été envoyé.");
        router.replace('/');
        break;

      case 'getAllUsers':
        const usersArray = jsonObject.usersArray || [];
        setUsersList(usersArray);
        setGlobalUsersList(usersArray);
        setGlobalProperty('tranche_duree', jsonObject.tranche_duree);
        setGlobalProperty('duree_trou', jsonObject.duree_trou);
        setGlobalProperty('nbre_joueurs', jsonObject.nbre_joueurs);
        calculateJauge();
        setGlobalProperty('shotgun', jsonObject.duree_trou === "0");
        router.push({
        pathname: `/src/reservation/resa`,
          params: {
            menuTitle: subMenuTitle,
            parentMenuName: parentName,
            competitionType: competitionType,
            competitionName: selectedCompetitionName,
          },
        });
        break;

      case 'removeResaTeam':
        if (jsonObject.status === "KO") {
            showAlert("Gestion des erreurs", jsonObject.error);
            break;
        }
        const wTranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf(">") + 1, jsonObject.tranche.indexOf("</"));
        const donnees = {
            operationType: "sendTeamResaMail",
            isEclectic:getGlobalJsonObject().isEclectic,
            action: jsonObject.action,
            massResa: "NO",
            recipient: jsonObject.email,
            recipientName: jsonObject.userName,
            subject: "Confirmation désinscription compétition",
            identMember: jsonObject.identMember,
            prenom: jsonObject.prenom,
            competition: jsonObject.nom_competition,
            date: jsonObject.date_competition,
            tranche: wTranche,
            periode: jsonObject.periode.substring(jsonObject.periode.indexOf(">") + 2, jsonObject.periode.indexOf("-<")),
            duree_trou: getGlobalProperties().duree_trou,
            isResaRepas: getGlobalProperties().isResaRepas,
            resa_repas: jsonObject.resa_repas,
            menu_choice: '',
            isResaMenu: false,
            resaMenuLicences: [],
            nbrScramblePlayers: getGlobalProperties().nbrScramblePlayers,
            isComplete: getGlobalProperties().isComplete,
            resaMenu: [],
        };
        fetchDataFromServer(donnees);
        break;

      case "sendTeamResaMail":
        if(getGlobalProperties().sous_menu === "Désinscription"){
          showAlert("Information", "Retour à la page d'accueil");
          router.replace('/');
          break;
        }
        if (jsonObject.status === "KO") {
          showAlert("Gestion des erreurs",jsonObject.error);
          router.replace('/');
          break;
        }

        break;

      default:
        break;
    }
  }

  const validateUserLogin = () => {
    const index_H = getGlobalJsonObject().indexMin_H;
    const index_F = getGlobalJsonObject().indexMin_F;
    if (index_H === -1 as any && getGlobalJsonObject().civilite === "M.") {
      showAlert("Gestion des erreurs", "Cette compétition est réservée aux Dames");
      return false;
    }
    if (index_F === -1 as any && getGlobalJsonObject().civilite !== "M.") {
      showAlert("Gestion des erreurs", "Cette compétition est réservée aux Hommes");
      return false;
    }
    if ((index_H  as any !== -1 && index_H != null) && (getGlobalJsonObject().civilite === "M." && getGlobalJsonObject().whs_index as any > parseInt(index_H))) {
      showAlert("Gestion des erreurs","Cette compétition est réservée aux index < à " + index_H);
      return false;
    }
    if ((index_F as any !== -1 && index_F != null) && (getGlobalJsonObject().civilite !== "M." && getGlobalJsonObject().whs_index as any > parseInt(index_F))) {
      showAlert("Gestion des erreurs","Cette compétition est réservée aux index < à " + index_F);
      return false;
    }
    if (getGlobalProperties().isComplete === "incomplete" && (getGlobalJsonObject().teamLeader === "OK" || getGlobalJsonObject().teamMember === "OK")) {
      showAlert("Gestion des erreurs","Vous êtes déjà dans une équipe");
      return false;
    }
    if (subMenuTitle === "Liste des inscrits") {
      return true;
    }
    // Vérification du contexte métier si scramble
    setGlobalProperty('isScramble', false);
    if(getGlobalJsonObject().formule === undefined){
      return true;
    }
    if (getGlobalJsonObject().formule.indexOf("Scramble") > -1) {
      if (getGlobalJsonObject().formule.indexOf("2") > 0) {
            setGlobalProperty('nbrScramblePlayers', 2);
      } else if (getGlobalJsonObject().formule.indexOf("3") > 0) {
            setGlobalProperty('nbrScramblePlayers', 3);
      } else if (getGlobalJsonObject().formule.indexOf("4") > 0) {
            setGlobalProperty('nbrScramblePlayers', 4);
      }
      setGlobalProperty('isScramble', true);
      if (getGlobalProperties().menuEquipeIncomplete) {
        const donnees = {
          operationType: "getAllUsers",
          isMobile: "1",
          nom_competition: getGlobalJsonObject().nom_competition,
          isScramble: getGlobalProperties().isScramble
        };
        fetchDataFromServer(donnees);
        return false;
      }
      if (getGlobalJsonObject().teamMember === "OK") {
        if (getGlobalProperties().sous_menu !== "Désinscription") {
            showAlert("Information", "Vous êtes membre d'une équipe de Scramble\nPour modifier votre participation contactez votre capitaine");
            return false;
        }
        if(getGlobalProperties().sous_menu === "Désinscription"){
          showAlert("Information", "Vous êtes sur le point de vous retirer d'une équipe de Scramble\nVeuillez confirmer ?", {
            buttons: [
                {
                  text: "Non",
                  onPress: () => { return false; },
                  style: 'cancel',
                },
                {
                  text: "Oui",
                  onPress: () =>
                    {
                      setGlobalProperty('teamLeader', true);
                      setGlobalProperty('fromLogin', true);
                      setGlobalProperty('viewFormLogin', null);
                      setGlobalProperty('licence', getGlobalJsonObject().licence);
                      setGlobalProperty('userId', getGlobalJsonObject().userId);
                      setGlobalProperty('userAffected', getGlobalJsonObject().userAffected as any === "oldResa")
                      setGlobalProperty('newUserResa', getGlobalJsonObject().newUserResa === "newResa");
                      setGlobalProperty('members', getGlobalJsonObject().members);
                      setGlobalProperty('teamTranche', getGlobalJsonObject().tranche);
                      setGlobalProperty('teamPosition', getGlobalJsonObject().periode);
                      setGlobalProperty('formule', getGlobalJsonObject().formule);
                      setGlobalProperty('isComplete', getGlobalProperties().nbrScramblePlayers === getGlobalJsonObject().members.length ? "normal" : "incomplete");
                      const donnees = {
                          operationType: "removeResaUser",
                          action: "removeTeamUser",
                          licence: getGlobalProperties().members[0].licence,
                          nom_competition: getGlobalJsonObject().nom_competition,
                          isEclectic: getGlobalJsonObject().isEclectic,
                          isMobile: "1",
                          createTeam: "NO",
                          sendMail: true,
                          menu: "standard",
                          sous_menu: "Désinscription - User",
                      };
                      fetchDataFromServer(donnees);
                    },
                  style: 'destructive',
                },
              ],
            }
          )
          return false;
        }
        return true;
      }
      if (getGlobalJsonObject().teamLeader === "KO") {
        if(getGlobalJsonObject().asAlreadyRESA === "0" && getGlobalProperties().sous_menu === "Désinscription"){
          const _civilite = getGlobalJsonObject().civilite === "M." ? "inscrit": "inscrite";
          showAlert("Information", "Vous n'êtes pas " + _civilite + " à cette compétition");
          router.replace('/');
        }
        if(getGlobalProperties().sous_menu === "Désinscription"){
          return false;
        }
        showAlert("Information", "Vous êtes sur le point de créer une équipe de Scramble\nVeuillez confirmer ?",
          {buttons: [
              {
                text: "Non",
                onPress: () => { return false; },
                style: 'cancel',
              },
              {
                text: "Oui",
                onPress: () => {
                    setGlobalProperty('teamLeader', true);
                    setGlobalProperty('licence', getGlobalJsonObject().licence);
                    setGlobalProperty('userId', getGlobalJsonObject().userId);
                    setGlobalProperty('userAffected', getGlobalJsonObject().userAffected === "oldResa");
                    setGlobalProperty('newUserResa', getGlobalJsonObject().newUserResa === "newResa");
                    setGlobalProperty('members', getGlobalJsonObject().members);
                    setGlobalProperty('teamTranche', getGlobalJsonObject().tranche);
                    setGlobalProperty('teamPosition', getGlobalJsonObject().periode);
                    setGlobalProperty('formule', getGlobalJsonObject().formule);
                    setGlobalProperty('isComplete', getGlobalProperties().nbrScramblePlayers === getGlobalProperties().members.length ? "normal" : "incomplete");
                    const donnees = {
                      operationType: "getAllUsers",
                      isMobile: "1",
                      nom_competition: getGlobalJsonObject().nom_competition,
                      isScramble: getGlobalProperties().isScramble
                    };
                    fetchDataFromServer(donnees);
                    return false;
                }
              },
            ]
          }
        )
        return false;
      }
      if(getGlobalJsonObject().asAlreadyRESA === "0" && getGlobalProperties().sous_menu === "Désinscription"){
        const _civilite = getGlobalJsonObject().civilite === "M." ? "inscrit": "inscrite";
        showAlert("Information", "Vous n'êtes pas " + _civilite + " à cette compétition", {
          buttons: [
            {
              text: "OK",
              onPress: () => {router.replace('/'); return false;},
              style: 'cancel',
            },
          ]
        });
        return false;
      }
      if(getGlobalProperties().sous_menu === "Désinscription") {
          showAlert("Information", "Vous êtes sur le point de supprimer une équipe de Scramble\nVeuillez confirmer ?", {
            buttons: [
                {
                  text: "Non",
                  onPress: () => {router.replace('/'); return false;},
                  style: 'cancel',
                },
                {
                  text: "Oui",
                  onPress: () => {
                    const donnees = {
                        operationType: "removeResaTeam",
                        action: "removeTeam",
                        licence: getGlobalJsonObject().members[0].licence,
                        nom_competition: getGlobalJsonObject().nom_competition,
                        isEclectic: getGlobalJsonObject().isEclectic,
                        isMobile: "1",
                        createTeam: "NO",
                        teamResa: "YES",
                    };
                    fetchDataFromServer(donnees);
                    return false;
                  }
                }
              ]
            }
          );
          return false;
        }else{
          if(selectedCompetitionKey !== "OLP"){
            showAlert("Information", "Vous êtes sur le point de modifier ou supprimer une équipe de Scramble\nVeuillez confirmer ?", {
              buttons: [
                  {
                    text: "Non",
                    onPress: () => { return false; },
                    style: 'cancel',
                  },
                  {
                    text: "Oui",
                    onPress: () => {
                      if (getGlobalJsonObject().formule.indexOf("2") > 0) {
                        setGlobalProperty('teamNumber', 2);
                      } else if (getGlobalJsonObject().formule.indexOf("3") > 0) {
                        setGlobalProperty('teamNumber', 3);
                      } else if (getGlobalJsonObject().formule.indexOf("4") > 0) {
                        setGlobalProperty('teamNumber', 4);
                      }
                      setGlobalProperty('teamLeader', true);
                      setGlobalProperty('licence', getGlobalJsonObject().licence);
                      setGlobalProperty('userId', getGlobalJsonObject().userId);
                      setGlobalProperty('userAffected', getGlobalJsonObject().userAffected === "oldResa");
                      setGlobalProperty('newUserResa', getGlobalJsonObject().newUserResa === "newResa");
                      setGlobalProperty('members', getGlobalJsonObject().members);
                      setGlobalProperty('teamTranche', getGlobalJsonObject().tranche);
                      setGlobalProperty('teamPosition', getGlobalJsonObject().periode);
                      setGlobalProperty('formule', getGlobalJsonObject().formule);
                      setGlobalProperty('isComplete', getGlobalProperties().nbrScramblePlayers === getGlobalProperties().members.length ? "normal" : "incomplete");
                      const donnees = {
                        operationType: "getAllUsers",
                        isMobile: "1",
                        nom_competition: getGlobalJsonObject().nom_competition,
                        isScramble: getGlobalProperties().isScramble
                      };
                      fetchDataFromServer(donnees);
                      return false;
                    }
                  }
                ]
              }
            );
            return false;
          }
        return true;
      }
    }
    return true;
  }

  const getRemoveResaUser = (jsonObject: any) => {
    if (jsonObject.status === "KO") {
      showAlert("Gestion des erreurs", jsonObject.error);
      return;
    }
    let isRemoved = true;
    let data;
    if (getGlobalJsonObject().userAffected == '0') {
      return;
    }
    if (jsonObject.sendMail !== false) {
      let _tranche = null;
      if(jsonObject.duree_trou === "0"){
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf("TRANCHE") + 8, jsonObject.tranche.indexOf("</span>"));
      }else{
        _tranche = jsonObject.tranche.substring(jsonObject.tranche.indexOf(">") + 1,jsonObject.tranche.indexOf("</"));
      }
      data = {
        operationType: getGlobalProperties().isScramble ? "sendTeamResaMail" : "sendResaMail",
        action: jsonObject.action,
        massResa: "NO",
        recipient: jsonObject.email,
        recipientName: jsonObject.userName,
        subject: "Confirmation désinscription compétition",
        identMember: jsonObject.identMember,
        prenom: jsonObject.prenom,
        competition: jsonObject.nom_competition,
        date: jsonObject.date_competition,
        tranche: _tranche,
        periode: jsonObject.periode.substring(jsonObject.periode.indexOf(">--") + 2, jsonObject.periode.indexOf("-<")),
        duree_trou: jsonObject.duree_trou,
        isResaRepas: jsonObject.isResaRepas,
        resa_repas: jsonObject.resa_repas,
        menu_choice: [],
        isResaMenu: false,
        resaMenuLicences: [],
        nbrScramblePlayers: getGlobalProperties().nbrScramblePlayers,
        isComplete: getGlobalProperties().isComplete,
        resaMenu: [],
        identTeamLeader: jsonObject.identTeamLeader,
        isEclectic: getGlobalJsonObject().isEclectic,
        licence: jsonObject.licence,
      };
      fetchDataFromServer(data);
    }
    if(getGlobalProperties().sous_menu !== "Désinscription") {
      router.replace('/');
    }
  }

  const getFormuleOfCurrentCompetition = (jsonObject: any) => {
    // À compléter plus tard
  }

  const calculateJauge = () => {
    if(getGlobalProperties().duree_trou == 0) {
      setGlobalProperty('jauge', Math.round((2 * getGlobalProperties().nbre_joueurs) * 18));
    } else {
      setGlobalProperty('jauge', Math.round((getGlobalProperties().tranche_duree / getGlobalProperties().duree_trou)) * getGlobalProperties().nbre_joueurs);
    }
  };

  const setButtonState = (id: string, enabled: boolean) => {
    setButtonStates(prev => ({
      ...prev,
      [id]: enabled,
    }));
  };

  const displayErrorMessage = async (message: string, type: string) => {
    const confirmed = await showAlert(
      "Login - Gestion des erreurs", message,
      {
        buttons: [
          {
            text: "OK",
            onPress: () => { return; },
            style: 'destructive',
          },
        ],
      }
    );
  };

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Connexion</Text>
        <SafeAreaView style={styles.inputContainer}>
          <View>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Adresse e-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Mot de passe actuel</Text>
            <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mot de passe actuel"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Bouton pour afficher/masquer la section de changement de mot de passe */}
          <TouchableOpacity
            style={styles.togglePasswordButton}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={styles.togglePasswordButtonText}>
              {showChangePassword ? "Masquer le changement de mot de passe" : "Changer le mot de passe"}
            </Text>
          </TouchableOpacity>

          {/* Section de changement de mot de passe, affichée conditionnellement */}
          {showChangePassword && (
            <>
              <View>
                <Text style={styles.label}>Nouveau mot de passe</Text>
                <View style={[styles.passwordContainer, newPasswordError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!isNewPasswordVisible}
                  />
                  <TouchableOpacity onPress={toggleNewPasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons name={isNewPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
              </View>

              <View>
                <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirmer le nouveau mot de passe"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!isConfirmNewPasswordVisible}
                  />
                  <TouchableOpacity onPress={toggleConfirmNewPasswordVisibility} style={styles.eyeIcon}>
                    <Ionicons name={isConfirmNewPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                {newPassword !== confirmNewPassword && confirmNewPassword !== '' && (
                  <Text style={styles.errorText}>Les mots de passe ne correspondent pas</Text>
                )}
              </View>
            </>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
          ) : (
            <View style={styles.buttonsContainer}>
              <CustomButton
                id="abandonner-btn"
                title="Abandonner"
                onPress={() => router.back()}
                buttonStates={buttonStates}
                setButtonState={setButtonState}
              />
              <CustomButton
                id="valider-btn"
                title="Valider"
                onPress={handleLogin}
                buttonStates={buttonStates}
                setButtonState={setButtonState}
              />
            </View>
          )}
        </SafeAreaView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 20,
    paddingHorizontal: 0,
  },
  container: {
    height: '94%',
    padding: 20,
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: -20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 15,
    height: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: 'red',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  loader: {
    marginTop: 20,
  },
  togglePasswordButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
  },
  togglePasswordButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
