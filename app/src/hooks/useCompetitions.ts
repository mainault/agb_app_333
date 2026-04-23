// src/hooks/useCompetition.ts
import { useState } from 'react';

export const useCompetition = () => {
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  return {
    selectedCompetition,
    setSelectedCompetition,
  };
};

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const useCompetitions = () => {
  return null; // ou une redirection si nécessaire
};

export default useCompetitions; // Export par défaut requis par expo-router