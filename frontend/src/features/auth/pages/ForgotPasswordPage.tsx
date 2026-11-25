import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import TextInput from "../../../components/ui/TextInput";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { authApi, getApiErrorMessage } from "../auth.api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../auth.schemas";

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitted(false);
    try {
      await authApi.requestPasswordReset(values);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="eyebrow">Account help</span>
        <h2>Forgot your password?</h2>
        <p className="auth-subtitle">
          Enter your email address and we’ll send you a link to reset your password.
        </p>
        {submitted && (
          <div className="form-alert form-alert-success" role="status">
            If an account exists for that email, reset instructions have been sent.
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
          <button
            className="button button-primary button-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="auth-switch">
          Remembered your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
