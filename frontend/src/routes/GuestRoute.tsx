import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Checking your session…</div>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
