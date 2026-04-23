// src/hooks/useAuth.ts
import { useState } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    // Logique de connexion (exemple)
    if (email && password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  return { isAuthenticated, login };
};

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const useAuths = () => {
  return null; // ou une redirection si nécessaire
};

export default useAuths; // Export par défaut requis par expo-router