import { z } from "zod";

export const creatorAvailabilityStatusValues = [
  "AVAILABLE",
  "BOOKED",
  "UNAVAILABLE",
  "ON_HOLD",
] as const;

export const createCreatorSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  languages: z.string().trim().optional().or(z.literal("")),
  niches: z.string().trim().optional().or(z.literal("")),
  ratePerVideo: z.number().nonnegative("Must be 0 or more"),
});

export const updateCreatorSchema = createCreatorSchema.partial();

export const setAvailabilitySchema = z.object({
  date: z.string().trim().min(1, "Date is required"),
  status: z.enum(creatorAvailabilityStatusValues),
});

export type CreateCreatorInput = z.infer<typeof createCreatorSchema>;
export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;
