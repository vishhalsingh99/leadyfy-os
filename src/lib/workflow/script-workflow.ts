import type { ScriptStatus } from "@prisma/client";

// Spec section 5.1's status flow, encoded as an explicit allowed-transitions
// map — the "state-enforced" mechanism referenced in section 6.2. Any
// transition not listed here is rejected by advanceScriptStatus, regardless
// of who's asking.
export const SCRIPT_TRANSITIONS: Record<ScriptStatus, ScriptStatus[]> = {
  DRAFT: ["ASSIGNED"],
  ASSIGNED: ["IN_REVIEW"],
  IN_REVIEW: ["SENT_TO_CLIENT"],
  SENT_TO_CLIENT: ["REVISION_REQUIRED", "APPROVED"],
  REVISION_REQUIRED: ["IN_REVIEW"],
  APPROVED: ["READY_FOR_SHOOT"],
  READY_FOR_SHOOT: [],
};

export function canTransitionScript(from: ScriptStatus, to: ScriptStatus): boolean {
  return SCRIPT_TRANSITIONS[from]?.includes(to) ?? false;
}
