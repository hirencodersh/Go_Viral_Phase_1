export type User = {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupCredentials = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type Profile = {
  id: string;
  userId: string;
  bio: string;
  profilePicture?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};