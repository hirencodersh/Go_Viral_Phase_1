import { Link } from "react-router-dom";
import { AuthLayout } from "../../../layouts/AuthLayout";

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">Account help</span>
        <h2>Forgot your password?</h2>
        <p className="auth-subtitle">
          Password reset is not available yet. For now, return to sign in or
          contact your administrator.
        </p>
        <Link className="button button-primary button-full" to="/login">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
