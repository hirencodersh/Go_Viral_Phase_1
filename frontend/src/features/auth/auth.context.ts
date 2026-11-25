import { createContext } from "react";
import type { AuthUser } from "./auth.api";
import type { LoginFormValues, RegisterFormValues } from "./auth.schemas";

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  ageRestricted: boolean;
  initializationError: string | null;
  retrySessionCheck: () => void;
  register: (input: RegisterFormValues) => Promise<void>;
  login: (input: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
