import axios from "axios";
import { useEffect, useState } from "react";
import { FiCompass, FiGrid, FiLogOut, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../auth/auth.api";
import { useAuth } from "../../auth/hooks/useAuth";
import { PostCard } from "../components/PostCard";
import { postsApi, type Post } from "../posts.api";

export function ExplorePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    postsApi
      .getExploreFeed(undefined, controller.signal)
      .then((page) => {
        if (active) {
          setPosts(page.posts);
          setNextCursor(page.nextCursor);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active && !axios.isCancel(caught)) {
          setError(getApiErrorMessage(caught));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryCount]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setError(null);
    setIsLoadingMore(true);
    try {
      const page = await postsApi.getExploreFeed(nextCursor);
      setPosts((current) => [...current, ...page.posts]);
      setNextCursor(page.nextCursor);
    } catch (caught) {
      setError(getApiErrorMessage(caught));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (caught) {
      setLogoutError(getApiErrorMessage(caught));
    }
  };

  const retryFeed = () => {
    setPosts([]);
    setNextCursor(null);
    setIsLoading(true);
    setError(null);
    setRetryCount((count) => count + 1);
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="brand" to="/dashboard">
          <span className="brand-symbol">s</span>
          <span>socially</span>
        </Link>
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
            <Link className="nav-item" to="/dashboard">
              <FiGrid aria-hidden="true" />
              <span>Home</span>
            </Link>
            <Link className="nav-item nav-item-active" to="/explore" aria-current="page">
              <FiCompass aria-hidden="true" />
              <span>Explore</span>
            </Link>
            <Link className="nav-item" to="/profile">
              <FiUser aria-hidden="true" />
              <span>Profile</span>
            </Link>
          </nav>
        </aside>

        <main className="dashboard-main">
          <section className="welcome-panel explore-welcome">
            <div>
              <span className="eyebrow">Discover something new</span>
              <h1>Explore</h1>
              <p>Photos and videos shared by the Socially community.</p>
            </div>
            <FiCompass className="welcome-decoration" aria-hidden="true" />
          </section>

          {logoutError && (
            <div className="form-alert" role="alert">
              {logoutError}
            </div>
          )}

          <section className="posts-section" aria-labelledby="explore-posts-title">
            <div className="section-heading posts-heading">
              <div>
                <span className="eyebrow">All creators and fans</span>
                <h2 id="explore-posts-title">Community posts</h2>
              </div>
            </div>

            {isLoading && (
              <p className="posts-status" role="status">
                Loading community posts…
              </p>
            )}

            {error && (
              <div className="posts-load-error" role="alert">
                <span>{error}</span>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={nextCursor ? loadMore : retryFeed}
                  disabled={isLoadingMore}
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !error && posts.length === 0 && (
              <div className="empty-feed">
                <span className="empty-feed-icon">
                  <FiCompass aria-hidden="true" />
                </span>
                <h3>No posts yet</h3>
                <p>When people share photos or videos, you’ll find them here.</p>
                <Link className="button button-secondary" to="/dashboard">
                  Go to home
                </Link>
              </div>
            )}

            {posts.length > 0 && (
              <div className="posts-list">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}

            {nextCursor && !isLoading && (
              <button
                className="button button-secondary explore-load-more"
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load more posts"}
              </button>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
