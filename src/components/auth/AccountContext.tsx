"use client";

import { createContext, useContext } from "react";

export interface AccountContextType {
  isAccountModalOpen: boolean;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  syncStatus: string;
  syncMessage: string;
  userEmail: string | null;
  onLogout?: () => void;
}

export const AccountContext = createContext<AccountContextType>({
  isAccountModalOpen: false,
  openAccountModal: () => {},
  closeAccountModal: () => {},
  syncStatus: "Sem sincronização",
  syncMessage: "",
  userEmail: null,
});

export function useAccount() {
  return useContext(AccountContext);
}
