import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export function ProtectedRoute() {
  const { user, isLoading, initializationError, retrySessionCheck } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Checking your session…</div>;
  }
  if (initializationError) {
    return (
      <main className="route-error">
        <p>We couldn’t verify your session. Check your connection and try again.</p>
        <button className="button button-primary" onClick={retrySessionCheck}>
          Try again
        </button>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
