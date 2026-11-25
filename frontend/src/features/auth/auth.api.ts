import axios from "axios";
import { apiClient } from "../../services/apiClient";
import type { LoginFormValues, RegisterFormValues } from "./auth.schemas";

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AuthData {
  user: AuthUser;
}

interface ApiError {
  message?: string;
}

export const authApi = {
  async register(input: RegisterFormValues): Promise<AuthUser> {
    const response = await apiClient.post<ApiEnvelope<AuthData>>(
      "/auth/register",
      input
    );
    return response.data.data.user;
  },

  async login(input: LoginFormValues): Promise<AuthUser> {
    const response = await apiClient.post<ApiEnvelope<AuthData>>(
      "/auth/login",
      input
    );
    return response.data.data.user;
  },

  async me(signal?: AbortSignal): Promise<AuthUser> {
    const response = await apiClient.get<ApiEnvelope<AuthData>>("/auth/me", {
      signal,
    });
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiEnvelope<unknown> & ApiError>(error)) {
    if (error.response?.data.message) {
      return error.response.data.message;
    }
    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }
    return "Unable to complete your request.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unable to complete your request.";
};

export const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;
