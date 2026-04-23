export const validPaths = ['SubMenu', 'index', 'SelectCompetition'] as const;
export type ValidPath = typeof validPaths[number];


// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const pathnames = () => {
  return null; // ou une redirection si nécessaire
};

export default pathnames; // Export par défaut requis par expo-router
