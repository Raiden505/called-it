import { z } from "zod";
import { postgresUuidSchema } from "@/lib/validation/postgres";

export const profileSchema = z.object({
  username: z.string().trim().toLowerCase().min(3, "Use at least 3 characters.").max(30, "Keep your username under 30 characters.").regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only."),
  displayName: z.string().trim().min(1, "Add a display name.").max(60, "Keep your display name under 60 characters."),
  favoriteTeamId: postgresUuidSchema,
  countryCode: z.string().trim().toUpperCase().max(3, "Use a valid country code.").nullable(),
  bio: z.string().trim().max(280, "Keep your bio under 280 characters.").nullable(),
  isSearchable: z.boolean(),
  profileVisibility: z.enum(["public", "friends", "private"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
