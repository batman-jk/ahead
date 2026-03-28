import { createContext, useContext } from 'react';

export const UiContext = createContext({
  confirm: async () => false,
  showToast: () => {},
  theme: 'dark',
  toggleTheme: () => {},
});

export const useUi = () => useContext(UiContext);
