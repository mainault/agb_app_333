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
    name?: string;
  }>();

  const subMenuTitle = params.name ?? params.subMenuTitle ?? '';

  React.useEffect(() => {
    if (subMenuTitle.includes('Classement')) {
      setGlobalProperty('sous_menu', subMenuTitle);

      router.replace({
        pathname: '/subMenu/Login',
        params: {
          subMenuTitle,
          menuTitle: subMenuTitle,
          parentName: params.parentName ?? '',
          competitionType: params.competitionType ?? '',
        },
      });
    }
  }, [subMenuTitle, params.parentName, params.competitionType]);

  if (subMenuTitle.includes('Classement')) {
    return null;
  }

  setGlobalProperty('sous_menu', subMenuTitle);

  if (subMenuTitle) {
    return (
      <Redirect
        href={{
          pathname: '/subMenu/ChoixCompetition',
          params: {
            subMenuTitle,
            parentName: params.parentName ?? '',
            competitionType: params.competitionType ?? '',
            name: params.name ?? '',
          },
        }}
      />
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Text style={styles.text}>Sous-menu non défini</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
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
