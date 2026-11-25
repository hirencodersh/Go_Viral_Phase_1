import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextInput from "../../../components/ui/TextInput";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { getApiErrorMessage } from "../auth.api";
import { isAgeRestrictedError } from "../age";
import { useAuth } from "../hooks/useAuth";
import { loginSchema, type LoginFormValues } from "../auth.schemas";

export function LoginPage() {
  const { login, initializationError } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (isAgeRestrictedError(error)) {
        navigate("/dashboard/age-restricted", { replace: true });
        return;
      }
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in to your account</h2>
        <p className="auth-subtitle">
          Pick up right where you left off.
        </p>

        {initializationError && (
          <div className="form-alert form-alert-warning" role="status">
            Your saved session couldn’t be checked. You can still sign in.
          </div>
        )}
        {submitError && (
          <div className="form-alert" role="alert">
            {submitError}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <TextInput
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            {...register("email")}
            error={errors.email?.message}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            maxLength={72}
            {...register("password")}
            error={errors.password?.message}
          />
          <div className="form-options">
            <label className="check-label">
              <input type="checkbox" {...register("rememberMe")} />
              <span>Remember me</span>
            </label>
            <Link className="text-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <button
            className="button button-primary button-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New to Socially? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
