import { z } from "zod";

const jwtSecretSchema = z
  .string()
  .min(32, "JWT_SECRET must be at least 32 characters")
  .refine(
    (secret) => !secret.toLowerCase().startsWith("replace-"),
    "Replace the JWT_SECRET placeholder with a random secret"
  );

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGO_URI: z.string().trim().min(1, "MONGO_URI is required"),
    JWT_SECRET: jwtSecretSchema,
    CLIENT_URL: z.string().url().default("http://localhost:5173"),
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.enum(["true", "false"]).default("false"),
    SMTP_USER: z.string().trim().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().trim().optional(),
  })
  .superRefine((config, context) => {
    if (config.NODE_ENV === "production" && !process.env.CLIENT_URL) {
      context.addIssue({
        code: "custom",
        path: ["CLIENT_URL"],
        message: "CLIENT_URL is required in production",
      });
    }
  });

export const getConfig = () => environmentSchema.parse(process.env);
export const getJwtSecret = () => jwtSecretSchema.parse(process.env.JWT_SECRET);

export type AppConfig = ReturnType<typeof getConfig>;
