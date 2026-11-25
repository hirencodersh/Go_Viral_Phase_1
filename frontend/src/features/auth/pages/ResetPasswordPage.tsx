import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import TextInput from "../../../components/ui/TextInput";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { authApi, getApiErrorMessage } from "../auth.api";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../auth.schemas";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const hasValidToken = /^[A-Za-z0-9_-]{32,128}$/.test(token);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  useEffect(() => {
    reset({ token, password: "", confirmPassword: "" });
  }, [reset, token]);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await authApi.resetPassword(values);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">Account help</span>
        <h2>Choose a new password</h2>
        <p className="auth-subtitle">
          Use at least 8 characters. Your reset link expires after 15 minutes.
        </p>
        {!hasValidToken ? (
          <>
            <div className="form-alert" role="alert">
              This password reset link is invalid or missing. Request a new link to continue.
            </div>
            <Link className="button button-primary button-full" to="/forgot-password">
              Request a new reset link
            </Link>
          </>
        ) : submitted ? (
          <>
            <div className="form-alert form-alert-success" role="status">
              Your password has been reset. You can now sign in.
            </div>
            <Link className="button button-primary button-full" to="/login">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            {submitError && (
              <div className="form-alert" role="alert">
                {submitError}
              </div>
            )}
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <input type="hidden" {...register("token")} />
              <TextInput
                label="New password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                maxLength={72}
                {...register("password")}
                error={errors.password?.message}
              />
              <TextInput
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter your new password again"
                maxLength={72}
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />
              <button
                className="button button-primary button-full"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating…" : "Reset password"}
              </button>
            </form>
            <p className="auth-switch">
              Need a new reset link? <Link to="/forgot-password">Request one</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
