import { z } from "zod";

// companyName is the one and only name used for this field end-to-end
// (this schema, the Prisma model, the form field, the API JSON key) — the
// concrete fix for the spec's called-out company/company_name mismatch.
export const clientStatusValues = [
  "LEAD",
  "NEW",
  "ONBOARDING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "INACTIVE",
] as const;

export const createClientSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().min(1, "Contact name is required"),
  contactEmail: z.string().trim().email("Enter a valid email"),
  contactPhone: z.string().trim().optional().or(z.literal("")),
  industry: z.string().trim().optional().or(z.literal("")),
  status: z.enum(clientStatusValues),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
