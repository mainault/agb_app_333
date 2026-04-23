// app/subMenu/[subMenuTitle].tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Redirect, router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { useCompetition } from '../src/hooks/useCompetitions';
import ScreenContainer from '../src/components/ScreenContainer';
import FormButton from '../src/components/FormButton';
import { setGlobalProperty } from '../src/store/GlobalPropertiesManager';

export default function SubMenuDetailScreen() {
  const params = useLocalSearchParams<{
    subMenuTitle?: string;
    parentName?: string;
    competitionType?: string;
    name: string,
  }>();
  params.subMenuTitle = params.name;
  setGlobalProperty('sous_menu', params.name);
  const { isAuthenticated } = useAuth();
  const { selectedCompetition } = useCompetition();

  if(params.subMenuTitle.includes('Classement')) {
    // Utilisation de useEffect pour gérer les redirections
    React.useEffect(() => {
      // Cas spécial pour les pages de classement
      if (params.subMenuTitle && params.subMenuTitle.includes('Classement')) {
        // Utilisation de router.push pour la redirection
        router.push({
          pathname: `subMenu/Login` as any,
          params: {
            subMenuTitle: params.subMenuTitle,
            menuTitle: params.subMenuTitle,
            parentName: params.parentName,
            competitionType: params.competitionType,
          },
        })
      }
    });
    return;
  }

  // Si une compétition sélectionnée, redirige vers ChoixCompetition
  if (params.subMenuTitle) {
    return (
      <Redirect
        href={{
          pathname: `/subMenu/ChoixCompetition`,
          params: {
            subMenuTitle: params.subMenuTitle || '',
            parentName: params.parentName || '',
            competitionType: params.competitionType || '',
            name: params.name || '',
          },
        }}
      />
    );
  }

  // Sinon, redirige vers la page métier correspondante
  const getPagePath = () => {
    if (!params.subMenuTitle || !params.parentName) {
      return null;
    }

    const { subMenuTitle, parentName, name } = params;
    switch (parentName) {
      case 'Standard':
        return { pathname: `/subMenu/standard/${subMenuTitle}` };
      case 'Eclectic':
        return { pathname: `/subMenu/eclectic/${subMenuTitle.replace('eclectic_', '')}` };
      case 'Challenge - hiver':
        return { pathname: `/subMenu/challenge_hiver/${subMenuTitle.replace('is_', '')}` };
      case 'Ringer score':
        return { pathname: `/subMenu/ringer_score/${subMenuTitle.replace('rs_', '')}` };
      case 'Payer droit de jeu en ligne':
        return { pathname: '/subMenu/OLP' };
      case 'Covoiturage':
        return { pathname: '/subMenu/covoiturage' };
      default:
        return { pathname: '/subMenu/standard/inscription' };
    }
  };
  
  // Affichage par défaut (si aucune redirection n'est déclenchée)
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.text}>
          Vous êtes dans le sous-menu :{' '}
          <Text style={styles.highlight}>
            {params.subMenuTitle || "Non défini"}
          </Text>
        </Text>
        {params.parentName && (
          <Text style={styles.text}>
            Parent :{' '}
            <Text style={styles.highlight}>
              {params.parentName}
            </Text>
          </Text>
        )}
        {params.competitionType && (
          <Text style={styles.text}>
            Type de compétition :{' '}
            <Text style={styles.highlight}>
              {params.competitionType}
            </Text>
          </Text>
        )}
        <FormButton
          title="Accéder au menu"
          onPress={() => {
            const path = getPagePath();
            if (path) {
              router.push(path as any);
            }
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 17,
    marginBottom: 10,
  },
  highlight: {
    color: '#1c19dbcc',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
