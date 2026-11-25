import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="route-error">
      <span className="eyebrow">404</span>
      <h1>We can’t find that page.</h1>
      <Link className="button button-primary" to="/dashboard">
        Go to your space
      </Link>
    </main>
  );
}
