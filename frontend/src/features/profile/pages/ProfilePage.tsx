import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../auth/hooks/useAuth";
import { getApiErrorMessage } from "../../auth/auth.api";
import { profileService } from "../services/profileService";
import type { UserProfile, UserRole } from "../types/profile";
import { ProfileCard } from "../components/ProfileCard";
import { EditProfileModal } from "../components/EditProfileModal";
import { AccountTypeSelector } from "../components/AccountTypeSelector";

export function ProfilePage() {
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [roleBusy, setRoleBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileService.getProfile()
      .then((currentProfile) => {
        setProfile(currentProfile);
        updateUser({
          id: currentProfile._id,
          _id: currentProfile._id,
          username: currentProfile.username,
          email: currentProfile.email,
          profilePhoto: currentProfile.profilePhoto,
          bio: currentProfile.bio,
          roles: currentProfile.roles,
        });
      })
      .catch((caught) => setError(getApiErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [updateUser]);

  const saveProfile = async (input: { username: string; bio: string }) => {
    setProfileBusy(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile(input);
      setProfile(updated);
      updateUser({ username: updated.username, bio: updated.bio, profilePhoto: updated.profilePhoto, roles: updated.roles });
      setEditOpen(false);
      setMessage("Profile updated successfully");
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setProfileBusy(false);
    }
  };

  const saveRoles = async (roles: UserRole[]) => {
    setRoleBusy(true);
    setError(null);
    try {
      const updated = await profileService.updateRoles(roles);
      setProfile(updated);
      updateUser({ roles: updated.roles });
      setMessage("Account type updated successfully");
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setRoleBusy(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setPhotoBusy(true);
    setError(null);
    try {
      const updated = await profileService.uploadPhoto(file);
      setProfile(updated);
      updateUser({ profilePhoto: updated.profilePhoto });
      setMessage("Profile photo uploaded successfully");
      return updated.profilePhoto;
    } catch (caught) {
      setError(getApiErrorMessage(caught));
      return null;
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleLogout = async () => {
    setLogoutBusy(true);
    setError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setLogoutBusy(false);
    }
  };

  if (loading) return <main className="route-loading">Loading profile…</main>;

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <Link to="/dashboard" className="profile-back"><FiArrowLeft aria-hidden="true" /> Back to dashboard</Link>
      </header>
      <div className="profile-page-content">
        <section className="profile-page-heading">
          <span className="eyebrow">Your account</span>
          <h1>Profile settings</h1>
          <p>Make your profile yours and choose how you want to be part of the community.</p>
        </section>
        {message && <div className="profile-notice profile-notice-success" role="status">{message}</div>}
        {error && <div className="profile-notice profile-notice-error" role="alert">{error}</div>}
        {profile && (
          <>
            <ProfileCard profile={profile} photoBusy={photoBusy} onUpload={uploadPhoto}
              onEdit={() => setEditOpen(true)} onLogout={handleLogout} logoutBusy={logoutBusy} />
            <AccountTypeSelector roles={profile.roles} busy={roleBusy} onSave={saveRoles} />
            {editOpen && (
              <EditProfileModal profile={profile} busy={profileBusy}
                onClose={() => setEditOpen(false)} onSave={saveProfile} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
