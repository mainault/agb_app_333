import { parseScores } from "../store/GlobalPropertiesManager";
import { GlobalPlayerRanking, GlobalPlayerRankingRS } from "../store/GlobalStore";

const isHtmlContent = (content: string): boolean => {
if (!content) return false;
    return content.includes('<') || content.includes('&');
};

// Détermine si c'est une ligne de catégorie ou Série
const checkIfBreakLine = (item: GlobalPlayerRanking): boolean => {
// Si le nom contient "Série" ou est une catégorie (Dames, Messieurs)
return isHtmlContent(item.nom_prenom) ||
        item.nom_prenom.includes("Dames") ||
        item.nom_prenom.includes("Messieurs") ||
        item.nom_prenom.startsWith("Série") ||
        item.nom_prenom === "Série";
};

// Extrait les scores bruts (priorité à `score`, sinon utilise `T1`-`T18`)
// Dans votre fichier functions/getScores.ts
export const getHoleScores = (item: GlobalPlayerRanking | GlobalPlayerRankingRS): number[] => {
  if (!item) return Array(18).fill(0);
  return item.score ? parseScores(item.score) : Array(18).fill(0);
};

export const getNetHoleScores = (item: GlobalPlayerRanking | GlobalPlayerRankingRS): number[] => {
  if (!item) return Array(18).fill(0);
  return item.score_net ? parseScores(item.score_net) : Array(18).fill(0);
};


// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const getSScores = () => {
  return null; // ou une redirection si nécessaire
};
export default getSScores; // Export par défaut requis par expo-router