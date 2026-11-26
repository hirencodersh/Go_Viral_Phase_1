import axios from "axios";
import { useEffect, useState } from "react";
import {
  FiCompass,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiPlusSquare,
  FiSearch,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../auth/auth.api";
import { useAuth } from "../auth/hooks/useAuth";
import { CreatePostModal } from "../posts/components/CreatePostModal";
import { PostCard } from "../posts/components/PostCard";
import { postsApi, type Post } from "../posts/posts.api";

const stories = [
  { initials: "AM", name: "Amara", tone: "rose" },
  { initials: "JL", name: "Jordan", tone: "peach" },
  { initials: "SK", name: "Suki", tone: "lavender" },
  { initials: "RB", name: "Riley", tone: "mint" },
];

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [feedRetry, setFeedRetry] = useState(0);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    postsApi
      .getFeed(controller.signal)
      .then((feed) => {
        if (active) {
          setPosts(feed);
          setPostsError(null);
        }
      })
      .catch((error: unknown) => {
        if (active && !axios.isCancel(error)) {
          setPostsError(getApiErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setPostsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [feedRetry]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
  };

  const handlePostCreated = (post: Post) => {
    setPosts((current) => [post, ...current]);
    setPostsError(null);
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" to="/dashboard">
          <span className="brand-symbol">s</span>
          <span>socially</span>
        </Link>
        <label className="search-box">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            aria-label="Search people and posts"
            placeholder="Search people and posts"
          />
        </label>
        <div className="header-account-actions">
          <Link className="header-account-link" to="/profile">
            {user?.profilePhoto && failedAvatar !== user.profilePhoto ? (
              <img
                className="header-account-avatar"
                src={user.profilePhoto}
                alt=""
                onError={() => setFailedAvatar(user.profilePhoto || null)}
              />
            ) : (
              <span className="header-account-avatar header-account-initial" aria-hidden="true">
                {user?.fullName.charAt(0).toUpperCase()}
              </span>
            )}
            <strong className="header-account-name">{user?.fullName}</strong>
          </Link>
          <button
            className="icon-button logout-button"
            onClick={handleLogout}
            type="button"
            aria-label="Log out"
            title="Log out"
          >
            <FiLogOut aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav aria-label="Main navigation">
            <Link className="nav-item nav-item-active" to="/dashboard">
              <FiGrid aria-hidden="true" />
              <span>Home</span>
            </Link>
            <Link className="nav-item" to="/explore">
              <FiCompass aria-hidden="true" />
              <span>Explore</span>
            </Link>
            <button
              className="nav-item"
              type="button"
              onClick={() => setCreatePostOpen(true)}
            >
              <FiPlusSquare aria-hidden="true" />
              <span>Create post</span>
            </button>
            <button className="nav-item" type="button" disabled title="Coming soon">
              <FiHeart aria-hidden="true" />
              <span>Activity</span>
            </button>
          </nav>
        </aside>

        <main className="dashboard-main">
          <section className="welcome-panel">
            <div>
              <span className="eyebrow">Your space, your pace</span>
              <h1>Good to see you, {user?.fullName.split(" ")[0]}.</h1>
              <p>Share a photo or video with the Socially community.</p>
              <button
                className="button button-primary dashboard-create-button"
                type="button"
                onClick={() => setCreatePostOpen(true)}
              >
                <FiPlusSquare aria-hidden="true" />
                Create a post
              </button>
            </div>
            <span className="welcome-decoration" aria-hidden="true">
              ✳
            </span>
          </section>

          {logoutError && (
            <div className="form-alert" role="alert">
              {logoutError}
            </div>
          )}

          <section className="stories-section" aria-labelledby="stories-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A few familiar faces</span>
                <h2 id="stories-title">Your circle</h2>
              </div>
              <span className="coming-soon">Stories coming soon</span>
            </div>
            <div className="story-list">
              {stories.map((story) => (
                <div className="story-person" key={story.name}>
                  <span className={`story-ring story-ring-${story.tone}`}>
                    <span>{story.initials}</span>
                  </span>
                  <span>{story.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="posts-section" aria-labelledby="posts-title">
            <div className="section-heading posts-heading">
              <div>
                <span className="eyebrow">From the community</span>
                <h2 id="posts-title">Latest posts</h2>
              </div>
            </div>
            {postsLoading && (
              <p className="posts-status" role="status">Loading posts…</p>
            )}
            {postsError && (
              <div className="posts-load-error" role="alert">
                <span>{postsError}</span>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setPostsLoading(true);
                    setFeedRetry((current) => current + 1);
                  }}
                >
                  Try again
                </button>
              </div>
            )}
            {!postsLoading && !postsError && posts.length === 0 && (
              <div className="empty-feed">
                <span className="empty-feed-icon">
                  <FiHeart aria-hidden="true" />
                </span>
                <h3>Your feed is ready</h3>
                <p>Be the first to share a photo or video with the community.</p>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setCreatePostOpen(true)}
                >
                  Create your first post
                </button>
              </div>
            )}
            {!postsLoading && posts.length > 0 && (
              <div className="posts-list">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </section>
        </main>
      </div>
      {createPostOpen && (
        <CreatePostModal
          onClose={() => setCreatePostOpen(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
