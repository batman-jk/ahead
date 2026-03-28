import { createContext, useContext } from 'react';

export const UiContext = createContext({
  confirm: async () => false,
  showToast: () => {},
});

export const useUi = () => useContext(UiContext);
