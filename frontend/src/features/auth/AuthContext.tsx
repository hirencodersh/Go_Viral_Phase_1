import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import {
  authApi,
  getApiErrorMessage,
  isUnauthorizedError,
  type AuthUser,
} from "./auth.api";
import { isAgeRestrictedError } from "./age";
import type { LoginFormValues, RegisterFormValues } from "./auth.schemas";
import { AuthContext } from "./auth.context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    authApi
      .me(controller.signal)
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setAgeRestricted(false);
          setInitializationError(null);
        }
      })
      .catch((error: unknown) => {
        if (!active || axios.isCancel(error)) {
          return;
        }
        if (isUnauthorizedError(error)) {
          setUser(null);
          setAgeRestricted(false);
          setInitializationError(null);
          return;
        }
        if (isAgeRestrictedError(error)) {
          setUser(null);
          setAgeRestricted(true);
          setInitializationError(null);
          return;
        }
        setInitializationError(getApiErrorMessage(error));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryCount]);

  const register = useCallback(async (input: RegisterFormValues) => {
    const registeredUser = await authApi.register(input);
    setUser(registeredUser);
    setAgeRestricted(false);
    setInitializationError(null);
  }, []);

  const login = useCallback(async (input: LoginFormValues) => {
    const authenticatedUser = await authApi.login(input);
    setUser(authenticatedUser);
    setAgeRestricted(false);
    setInitializationError(null);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setAgeRestricted(false);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((currentUser) => currentUser ? { ...currentUser, ...updates } : currentUser);
  }, []);

  const retrySessionCheck = useCallback(() => {
    setIsLoading(true);
    setInitializationError(null);
    setRetryCount((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      ageRestricted,
      initializationError,
      retrySessionCheck,
      register,
      login,
      logout,
      updateUser,
    }),
    [
      user,
      isLoading,
      ageRestricted,
      initializationError,
      retrySessionCheck,
      register,
      login,
      logout,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
