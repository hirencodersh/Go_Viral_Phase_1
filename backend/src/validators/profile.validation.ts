import { z } from "zod";

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/,
      "Username must be 3-30 characters and use letters, numbers, dots, or underscores"
    ),
  bio: z.string().trim().max(250, "Bio must not exceed 250 characters").default(""),
});

export const rolesUpdateSchema = z.object({
  roles: z
    .array(z.enum(["fan", "creator"]))
    .min(1, "At least one role is required")
    .refine((roles) => new Set(roles).size === roles.length, "Duplicate roles are not allowed"),
});
