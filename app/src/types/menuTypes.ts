//import { ValidPath } from './paths';

export type MenuItemType = {
  name: string;
  screen?: string;
  params?: any;
  subMenus?: MenuItemType[];
  parentName?: string;
  competitionType?: string;
  subMenuTitle?: string;
};


export type AppRouteNames =
  | "/"
  | "/subMenu/[subMenuTitle]";


  /*
  export type MenuItemParams = {
  subMenuTitle: string;
  parentName?: string;
  competitionType?: string;
  [key: string]: any;
};

export type MenuItemType = {
  name: string;
  params?: MenuItemParams;
  subMenus?: MenuItemType[];
};
*/

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const menuTypes = () => {
  return null; // ou une redirection si nécessaire
};

export default menuTypes; // Export par défaut requis par expo-router