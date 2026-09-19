import { cn } from "@/lib/utils";

// One status -> color mapping shared by every module (spec section 11:
// "distinct color badges for pipeline states" — a single consistent scale,
// not ad hoc colors per module). Five semantic buckets regardless of which
// entity's enum the value comes from.
const NEUTRAL = "bg-secondary text-secondary-foreground";
const INFO = "bg-sky-500/15 text-sky-400";
const PROGRESS = "bg-amber-500/15 text-amber-400";
const SUCCESS = "bg-emerald-500/15 text-emerald-400";
const WARNING = "bg-orange-500/15 text-orange-400";
const DANGER = "bg-red-500/15 text-red-400";

const STATUS_STYLES: Record<string, string> = {
  // Client
  LEAD: NEUTRAL,
  NEW: INFO,
  ONBOARDING: PROGRESS,
  ACTIVE: SUCCESS,
  ON_HOLD: WARNING,
  COMPLETED: SUCCESS,
  INACTIVE: DANGER,

  // Order
  IN_PRODUCTION: PROGRESS,
  PARTIALLY_DELIVERED: PROGRESS,
  CANCELLED: DANGER,

  // Script
  DRAFT: NEUTRAL,
  ASSIGNED: INFO,
  IN_REVIEW: PROGRESS,
  SENT_TO_CLIENT: PROGRESS,
  REVISION_REQUIRED: WARNING,
  APPROVED: SUCCESS,
  READY_FOR_SHOOT: SUCCESS,

  // Creator availability
  AVAILABLE: SUCCESS,
  BOOKED: INFO,
  UNAVAILABLE: DANGER,

  // Shoot
  SCHEDULED: INFO,
  CONFIRMED: PROGRESS,
  IN_PROGRESS: PROGRESS,
  RESHOOT_REQUIRED: WARNING,

  // Video pipeline
  SCRIPT_APPROVED: NEUTRAL,
  SHOOT_PENDING: INFO,
  RAW_FOOTAGE_RECEIVED: PROGRESS,
  VIDEO_EDITING: PROGRESS,
  INTERNAL_QA: PROGRESS,
  CLIENT_REVIEW: PROGRESS,
  REVISION: WARNING,
  FINAL_APPROVED: SUCCESS,
  DELIVERED: SUCCESS,

  // Task
  TODO: NEUTRAL,
  DONE: SUCCESS,
  URGENT: DANGER,
  HIGH: WARNING,
  MEDIUM: PROGRESS,
  LOW: NEUTRAL,

  // Payment / payout
  UNPAID: NEUTRAL,
  PARTIALLY_PAID: PROGRESS,
  PAID: SUCCESS,
  OVERDUE: DANGER,
  PENDING: NEUTRAL,

  // Support ticket
  OPEN: INFO,
  RESOLVED: SUCCESS,
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? NEUTRAL;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        style,
        className,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
