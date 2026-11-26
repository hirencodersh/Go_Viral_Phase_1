import axios from "axios";
import { dispatchSuccessToast } from "./successToast";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use((response) => {
  const method = response.config.method?.toUpperCase();
  const message: unknown = response.data?.message;

  if (
    method &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    typeof message === "string" &&
    message.trim()
  ) {
    dispatchSuccessToast(message);
  }

  return response;
});
