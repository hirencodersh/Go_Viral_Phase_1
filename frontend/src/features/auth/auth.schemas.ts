import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "Password must be 72 bytes or fewer"
  );

const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter your date of birth")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid date")
  .refine((value) => value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/,
        "Use 3-30 letters, numbers, dots, or underscores"
      ),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254, "Email must be 254 characters or fewer"),
    dateOfBirth: dateOfBirthSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((accepted) => accepted, "You must agree to the Terms and Conditions"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254, "Email must be 254 characters or fewer"),
  password: z
    .string()
    .min(1, "Enter your password")
    .refine(
      (password) => new TextEncoder().encode(password).length <= 72,
      "Password must be 72 bytes or fewer"
    ),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254, "Email must be 254 characters or fewer"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
