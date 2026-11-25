import type { UserProfile } from "../types/profile";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

interface Props {
  profile: UserProfile;
  photoBusy: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onEdit: () => void;
  onLogout: () => void;
  logoutBusy: boolean;
}

export function ProfileCard({ profile, photoBusy, onUpload, onEdit, onLogout, logoutBusy }: Props) {
  return (
    <section className="profile-card profile-information" aria-labelledby="profile-information-title">
      <div className="profile-photo-column">
        <ProfilePhotoUpload profilePhoto={profile.profilePhoto} username={profile.username}
          busy={photoBusy} onUpload={onUpload} />
      </div>
      <div className="profile-details">
        <span className="eyebrow">Profile</span>
        <h1 id="profile-information-title">{profile.username}</h1>
        <p className="profile-email">{profile.email}</p>
        <p className="profile-bio">{profile.bio || "No bio added yet."}</p>
        <div className="profile-role-pills" aria-label="Selected account types">
          {profile.roles.map((role) => <span key={role}>{role === "fan" ? "Fan" : "Creator"}</span>)}
        </div>
        <div className="profile-actions">
          <button type="button" className="button button-primary" onClick={onEdit}>Edit profile</button>
          <button type="button" className="button button-secondary" onClick={onLogout} disabled={logoutBusy}>
            {logoutBusy ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </section>
  );
}
