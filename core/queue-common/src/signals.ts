import { z } from "zod";
import { createSignal } from "@checkstack/signal-common";
import { LagSeveritySchema } from "./schemas";

/**
 * Signal broadcast when queue lag status changes.
 * Frontend listens to update lag warning UI in real-time.
 */
export const QUEUE_LAG_CHANGED = createSignal(
  "queue.lag.changed",
  z.object({
    pending: z.number(),
    severity: LagSeveritySchema,
  })
);
