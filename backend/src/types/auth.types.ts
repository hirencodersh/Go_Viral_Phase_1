export interface RegisterInput {
  fullName: string;
  username: string;
  email: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface PublicUser {
  id: string;
  _id?: string;
  fullName: string;
  username: string;
  email: string;
  profilePhoto?: string;
  bio?: string;
  roles?: ("fan" | "creator")[];
}

export interface AuthResult {
  token: string;
  rememberMe: boolean;
  user: PublicUser;
}
