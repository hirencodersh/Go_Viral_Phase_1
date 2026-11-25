export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface PublicUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

export interface AuthResult {
  token: string;
  rememberMe: boolean;
  user: PublicUser;
}
