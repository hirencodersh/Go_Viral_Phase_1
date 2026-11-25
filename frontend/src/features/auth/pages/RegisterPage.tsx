import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextInput from "../../../components/ui/TextInput";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { getApiErrorMessage } from "../auth.api";
import { useAuth } from "../hooks/useAuth";
import {
  registerSchema,
  type RegisterFormValues,
} from "../auth.schemas";

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createAccount(values);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthLayout>
      <div className="auth-card auth-card-register">
        <span className="eyebrow">Your story starts here</span>
        <h2>Create your account</h2>
        <p className="auth-subtitle">
          Join a community built around the good stuff.
        </p>

        {submitError && (
          <div className="form-alert" role="alert">
            {submitError}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <TextInput
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <TextInput
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            {...register("username")}
            error={errors.username?.message}
          />
          <TextInput
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
            error={errors.password?.message}
          />
          <TextInput
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password again"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <button
            className="button button-primary button-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
