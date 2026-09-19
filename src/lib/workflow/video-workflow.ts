import type { VideoPipelineStatus } from "@prisma/client";

// Spec section 6.2's 9-stage pipeline, encoded as an explicit
// allowed-transitions map — same "state-enforced" pattern as scripts. The
// one branch point (CLIENT_REVIEW) mirrors spec 7.1's "Approve or Request
// Revision" client action.
export const VIDEO_TRANSITIONS: Record<VideoPipelineStatus, VideoPipelineStatus[]> = {
  SCRIPT_APPROVED: ["SHOOT_PENDING"],
  SHOOT_PENDING: ["RAW_FOOTAGE_RECEIVED"],
  RAW_FOOTAGE_RECEIVED: ["VIDEO_EDITING"],
  VIDEO_EDITING: ["INTERNAL_QA"],
  INTERNAL_QA: ["CLIENT_REVIEW"],
  CLIENT_REVIEW: ["REVISION", "FINAL_APPROVED"],
  REVISION: ["VIDEO_EDITING"],
  FINAL_APPROVED: ["DELIVERED"],
  DELIVERED: [],
};

export function canTransitionVideo(from: VideoPipelineStatus, to: VideoPipelineStatus): boolean {
  return VIDEO_TRANSITIONS[from]?.includes(to) ?? false;
}
