// utils/htmlUtils.js

export function formatHtmlForAlert(text) {
  // Remplace <br> par un saut de ligne
  let formatted = text.replace(/<br\s*\/?>/gi, '\n');
  // Supprime les autres balises
  formatted = formatted.replace(/<[^>]*>/g, '');
  // Remplace les entités HTML si nécessaire
  formatted = formatted.replace(/&nbsp;/g, ' ');
  return formatted;
}

/**
 * Supprime toutes les balises HTML.
 * @param {string} text
 * @returns {string}
 */
export function stripHtmlTags(text) {
  return text.replace(/<[^>]*>/g, '');
}

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const htmlUtilsRoute = () => {
  return null; // ou une redirection si nécessaire
};

export default htmlUtilsRoute; // Export par défaut requis par expo-router