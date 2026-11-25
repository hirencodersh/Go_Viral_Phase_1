import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .refine(
    (password) => new TextEncoder().encode(password).length <= 72,
    "Password must be 72 bytes or fewer"
  );

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
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean(),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
