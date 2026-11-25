import { useState } from "react";
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

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
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
        <button
          className="icon-button logout-button"
          onClick={handleLogout}
          type="button"
          aria-label="Log out"
          title="Log out"
        >
          <FiLogOut aria-hidden="true" />
        </button>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav aria-label="Main navigation">
            <Link className="nav-item nav-item-active" to="/dashboard">
              <FiGrid aria-hidden="true" />
              <span>Home</span>
            </Link>
            <button className="nav-item" type="button" disabled title="Coming soon">
              <FiCompass aria-hidden="true" />
              <span>Explore</span>
            </button>
            <button className="nav-item" type="button" disabled title="Coming soon">
              <FiPlusSquare aria-hidden="true" />
              <span>Create</span>
            </button>
            <button className="nav-item" type="button" disabled title="Coming soon">
              <FiHeart aria-hidden="true" />
              <span>Activity</span>
            </button>
          </nav>
          <div className="sidebar-profile">
            <Link to="/profile" className="profile-avatar" aria-label="Open profile">
              {user?.profilePhoto && failedAvatar !== user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt=""
                  className="sidebar-profile-photo"
                  onError={() => setFailedAvatar(user.profilePhoto || null)}
                />
              ) : (
                user?.fullName.charAt(0).toUpperCase()
              )}
            </Link>
            <Link to="/profile">
              <strong>{user?.fullName}</strong>
              <small>@{user?.username}</small>
            </Link>
          </div>
        </aside>

        <main className="dashboard-main">
          <section className="welcome-panel">
            <div>
              <span className="eyebrow">Your space, your pace</span>
              <h1>Good to see you, {user?.fullName.split(" ")[0]}.</h1>
              <p>Your account is ready. More ways to connect are on the way.</p>
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

          <section className="empty-feed">
            <span className="empty-feed-icon">
              <FiHeart aria-hidden="true" />
            </span>
            <h2>A fresh start feels good</h2>
            <p>
              You’re all set. The feed will be here when you’re ready to share
              your first moment.
            </p>
            <button className="button button-secondary" type="button" disabled>
              Explore your community
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
