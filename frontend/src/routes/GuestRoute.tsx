import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

export function GuestRoute() {
  const { user, isLoading, ageRestricted } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Checking your session…</div>;
  }
  if (ageRestricted) {
    return <Navigate to="/dashboard/age-restricted" replace />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
