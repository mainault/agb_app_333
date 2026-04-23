// context/MenuContext.tsx
import React, { createContext, useContext, useState } from 'react';

type MenuContextType = {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
};

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <MenuContext.Provider value={{ menuVisible, setMenuVisible }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}

// Exportez par défaut un composant vide ou redirigez si ce fichier est utilisé comme route par erreur
const MenuContextRoute = () => {
  return null; // ou une redirection si nécessaire
};

export default MenuContextRoute; // Export par défaut requis par expo-router