import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <Link className="brand brand-light" to="/" aria-label="Socially home">
          <span className="brand-symbol">s</span>
          <span>socially</span>
        </Link>
        <div className="story-copy">
          <span className="eyebrow">A little more connected</span>
          <h1>Make room for the moments that matter.</h1>
          <p>
            Find your people, share what you love, and make everyday moments
            feel a little brighter.
          </p>
        </div>
        <div className="story-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-card art-card-back">
            <span className="art-avatar art-avatar-one">M</span>
            <span className="art-line art-line-long" />
            <span className="art-line" />
            <span className="art-image" />
          </div>
          <div className="art-card art-card-front">
            <span className="art-avatar art-avatar-two">J</span>
            <span className="art-line art-line-long" />
            <span className="art-line" />
            <span className="art-image art-image-green" />
          </div>
          <span className="art-spark art-spark-one">✦</span>
          <span className="art-spark art-spark-two">✦</span>
        </div>
        <p className="story-caption">Your people are just around the corner.</p>
      </aside>

      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <Link className="brand" to="/" aria-label="Socially home">
            <span className="brand-symbol">s</span>
            <span>socially</span>
          </Link>
        </div>
        {children}
        <p className="auth-legal">
          By continuing, you agree to our <a href="#terms">Terms</a> and{" "}
          <a href="#privacy">Privacy Policy</a>.
        </p>
      </section>
    </main>
  );
}
