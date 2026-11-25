export type UserRole = "fan" | "creator";

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePhoto: string;
  bio: string;
  roles: UserRole[];
}
