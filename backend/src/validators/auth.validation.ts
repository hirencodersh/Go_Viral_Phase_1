import type { RequestHandler } from "express";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Password must not exceed 72 bytes"
  );

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/,
        "Username must be 3-30 characters and use letters, numbers, dots, or underscores"
      ),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).refine(
    (password) => Buffer.byteLength(password, "utf8") <= 72,
    "Invalid email or password"
  ),
  rememberMe: z.boolean().default(false),
});

export const validateBody =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
