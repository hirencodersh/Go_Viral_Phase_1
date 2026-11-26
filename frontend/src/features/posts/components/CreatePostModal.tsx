import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { postsApi, type Post } from "../posts.api";
import { getApiErrorMessage } from "../../auth/auth.api";

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

interface Props {
  onClose: () => void;
  onCreated: (post: Post) => void;
}

export function CreatePostModal({ onClose, onCreated }: Props) {
  const [media, setMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    if (!selected) {
      setMedia(null);
      setPreviewUrl("");
      return;
    }
    if (!ACCEPTED_MEDIA_TYPES.has(selected.type)) {
      setMedia(null);
      setPreviewUrl("");
      setError("Choose a JPG, PNG, or WebP image, or an MP4, WebM, or MOV video.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_MEDIA_SIZE) {
      setMedia(null);
      setPreviewUrl("");
      setError("Media must be 50 MB or smaller.");
      event.target.value = "";
      return;
    }
    setMedia(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!media) {
      setError("Choose a photo or video to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Add a title for your post.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const post = await postsApi.createPost(
        { media, title: title.trim(), caption: caption.trim() },
        setUploadProgress
      );
      onCreated(post);
      onClose();
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="create-post-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <section
        className="create-post-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="create-post-header">
          <div>
            <span className="eyebrow">Share with the community</span>
            <h2 id="create-post-title">Create a post</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close create post"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </header>

        <form className="create-post-form" onSubmit={submit}>
          <label className="field-group">
            <span className="field-label">Photo or video</span>
            <input
              className="field-control create-post-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleMediaChange}
              disabled={isSubmitting}
              aria-describedby="post-media-help"
            />
            <span className="create-post-help" id="post-media-help">
              JPG, PNG, WebP, MP4, WebM, or MOV · up to 50 MB
            </span>
          </label>

          {previewUrl && media && (
            <div className="create-post-preview">
              {media.type.startsWith("video/") ? (
                <video src={previewUrl} controls playsInline />
              ) : (
                <img src={previewUrl} alt="Selected post preview" />
              )}
            </div>
          )}

          <label className="field-group">
            <span className="field-label">Title</span>
            <input
              className="field-control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Give your post a title"
              required
              disabled={isSubmitting}
            />
            <span className="create-post-counter">{title.length}/120</span>
          </label>

          <label className="field-group">
            <span className="field-label">Bio / caption</span>
            <textarea
              className="field-control create-post-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={1000}
              placeholder="Tell people about your photo or video"
              disabled={isSubmitting}
            />
            <span className="create-post-counter">{caption.length}/1000</span>
          </label>

          {error && (
            <div className="form-alert" role="alert">
              {error}
            </div>
          )}

          {isSubmitting && (
            <div
              className="upload-progress"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress}
            >
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          <div className="create-post-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing…" : "Publish post"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
