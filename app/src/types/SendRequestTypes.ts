// Définition des types pour les réponses API
export interface ReponseAPI<T = any> {
  success: boolean;
  message?: string;
  data?: T; // Utilisation du type générique T
  error?: string;
  status?: number;
}

export interface Request {
  [key: string]: any; // À adapter selon vos besoins
}

// Export par défaut requis par expo-router
export default {};
