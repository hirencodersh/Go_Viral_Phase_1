import type { Post } from "../posts.api";

export function PostCard({ post }: { post: Post }) {
  const publishedAt = new Date(post.createdAt);

  return (
    <article className="post-card">
      <header className="post-card-header">
        <div className="post-author-avatar">
          {post.author.profilePhoto ? (
            <img src={post.author.profilePhoto} alt="" />
          ) : (
            post.author.fullName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="post-author-details">
          <strong>{post.author.fullName}</strong>
          <span>@{post.author.username}</span>
        </div>
        <time dateTime={post.createdAt}>
          {Number.isNaN(publishedAt.getTime())
            ? ""
            : publishedAt.toLocaleDateString()}
        </time>
      </header>

      <div className="post-card-media">
        {post.mediaType === "video" ? (
          <video src={post.mediaUrl} controls preload="metadata" playsInline />
        ) : (
          <img src={post.mediaUrl} alt={post.title} loading="lazy" />
        )}
      </div>

      <div className="post-card-content">
        <h2>{post.title}</h2>
        {post.caption && <p>{post.caption}</p>}
      </div>
    </article>
  );
}
