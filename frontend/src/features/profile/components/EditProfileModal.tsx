import { useState, type FormEvent } from "react";
import { z } from "zod";
import type { UserProfile } from "../types/profile";

const schema = z.object({
  username: z.string().trim().toLowerCase().regex(
    /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/,
    "Use 3-30 letters, numbers, dots, or underscores"
  ),
  bio: z.string().trim().max(250, "Bio must not exceed 250 characters"),
});

interface Props {
  profile: UserProfile;
  busy: boolean;
  onClose: () => void;
  onSave: (input: { username: string; bio: string }) => Promise<void>;
}

export function EditProfileModal({ profile, busy, onClose, onSave }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [errors, setErrors] = useState<{ username?: string; bio?: string }>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = schema.safeParse({ username, bio });
    if (!result.success) {
      const next: { username?: string; bio?: string } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "username" || field === "bio") next[field] = issue.message;
      });
      setErrors(next);
      return;
    }
    await onSave(result.data);
  };

  return (
    <div className="profile-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"
        onMouseDown={(event) => event.stopPropagation()}>
        <div className="profile-modal-header">
          <h2 id="edit-profile-title">Edit profile</h2>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="profile-edit-form">
          <label className="field-group">
            <span className="field-label">Username</span>
            <input className="field-control" value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy} />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </label>
          <label className="field-group">
            <span className="field-label">Bio</span>
            <textarea className="field-control profile-textarea" value={bio} maxLength={250}
              onChange={(event) => setBio(event.target.value)} disabled={busy} />
            <span className="profile-counter">{bio.length}/250</span>
            {errors.bio && <span className="field-error">{errors.bio}</span>}
          </label>
          <div className="profile-modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
