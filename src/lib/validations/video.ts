import { z } from "zod";

export const videoStatusValues = [
  "SCRIPT_APPROVED",
  "SHOOT_PENDING",
  "RAW_FOOTAGE_RECEIVED",
  "VIDEO_EDITING",
  "INTERNAL_QA",
  "CLIENT_REVIEW",
  "REVISION",
  "FINAL_APPROVED",
  "DELIVERED",
] as const;

export const createVideoSchema = z.object({
  scriptId: z.string().min(1, "Script is required"),
  shootId: z.string().trim().optional().or(z.literal("")),
  editorId: z.string().trim().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Title is required"),
  status: z.enum(videoStatusValues),
  deadline: z.string().trim().optional().or(z.literal("")),
});

export const updateVideoSchema = createVideoSchema.partial();

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
