import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import TextInput from "../../../components/ui/TextInput";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { getApiErrorMessage } from "../auth.api";
import { isAgeRestrictedError } from "../age";
import { useAuth } from "../hooks/useAuth";
import {
  registerSchema,
  type RegisterFormValues,
} from "../auth.schemas";
import { signupTerms } from "../termsAndConditions";

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
      dateOfBirth: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createAccount(values);
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
            minLength={2}
            maxLength={80}
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <TextInput
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            minLength={3}
            maxLength={30}
            {...register("username")}
            error={errors.username?.message}
          />
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
            label="Date of birth"
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            {...register("dateOfBirth")}
            error={errors.dateOfBirth?.message}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            maxLength={72}
            {...register("password")}
            error={errors.password?.message}
          />
          <TextInput
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter your password again"
            maxLength={72}
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <div className="terms-field">
            <label className="terms-checkbox">
              <input type="checkbox" {...register("termsAccepted")} aria-invalid={Boolean(errors.termsAccepted)} />
              <span>I agree to the Terms and Conditions and Privacy Policy.</span>
            </label>
            {errors.termsAccepted?.message && (
              <span className="field-error" role="alert">{errors.termsAccepted.message}</span>
            )}
            <details className="terms-details" id="terms">
              <summary>Review Terms and Conditions &amp; Privacy Policy</summary>
              <div className="terms-content">
                <p className="terms-version">Version {signupTerms.version}</p>
                {signupTerms.sections.map((section) => (
                  <section key={section.title} id={section.id}>
                    <h3>{section.title}</h3>
                    <p>{section.content}</p>
                  </section>
                ))}
              </div>
            </details>
          </div>
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
