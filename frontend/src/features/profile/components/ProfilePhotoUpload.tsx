import { useEffect, useState, type ChangeEvent } from "react";

interface Props {
  profilePhoto: string;
  username: string;
  busy: boolean;
  onUpload: (file: File) => Promise<string | null>;
}

function ProfileImage({ src, username }: { src: string; username: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="profile-photo profile-photo-default" aria-label={`${username}'s default avatar`}>
        {username.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className="profile-photo"
      src={src}
      alt={`${username}'s profile`}
      onError={() => setFailed(true)}
    />
  );
}

export function ProfilePhotoUpload({ profilePhoto, username, busy, onUpload }: Props) {
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    const savedPhoto = await onUpload(file);
    setPreview("");
    if (savedPhoto) setFileError(null);
    event.target.value = "";
  };

  return (
    <div className="profile-photo-wrap">
      {profilePhoto || preview ? (
        <ProfileImage key={preview || profilePhoto} src={preview || profilePhoto} username={username} />
      ) : (
        <div className="profile-photo profile-photo-default" aria-label={`${username}'s default avatar`}>
          {username.charAt(0).toUpperCase()}
        </div>
      )}
      <label className={`profile-photo-button ${busy ? "disabled" : ""}`}>
        {busy ? "Uploading…" : "Change photo"}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} disabled={busy} />
      </label>
      {fileError && <span className="field-error" role="alert">{fileError}</span>}
    </div>
  );
}
