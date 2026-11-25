import { apiClient } from "../../../services/apiClient";
import type { UserProfile } from "../types/profile";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const profileService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiEnvelope<UserProfile>>("/users/profile");
    return response.data.data;
  },
  async updateProfile(input: { username: string; bio: string }): Promise<UserProfile> {
    const response = await apiClient.put<ApiEnvelope<UserProfile>>("/users/profile", input);
    return response.data.data;
  },
  async updateRoles(roles: ("fan" | "creator")[]): Promise<UserProfile> {
    const response = await apiClient.patch<ApiEnvelope<UserProfile>>("/users/roles", { roles });
    return response.data.data;
  },
  async uploadPhoto(file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append("profilePhoto", file);
    const response = await apiClient.post<ApiEnvelope<UserProfile>>("/users/profile/photo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },
};

export const hasRole = (profile: Pick<UserProfile, "roles">, role: "fan" | "creator") =>
  profile.roles.includes(role);
