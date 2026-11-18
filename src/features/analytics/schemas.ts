import { z } from "zod";
import { ANALYTICS } from "@/config/analytics";

const propValue = z.union([z.string().max(60), z.number().finite(), z.boolean()]);

export const incomingEventSchema = z.object({
  name: z.enum(["pageview", "engagement", ...ANALYTICS.events]),
  /** The page's address as the browser sees it. Only the path and campaign tags are kept. */
  url: z.string().max(1000),
  referrer: z.string().max(1000).optional(),
  pageviewId: z.uuid().optional(),
  engagedMs: z.number().int().min(0).max(1_800_000).optional(),
  screenWidth: z.number().int().min(0).max(10_000).optional(),
  props: z
    .record(z.string().regex(/^[a-z][a-z0-9_]{0,29}$/), propValue)
    .refine((props) => Object.keys(props).length <= 5)
    .optional(),
});

export type IncomingEvent = z.infer<typeof incomingEventSchema>;

export const eventBatchSchema = z.object({
  events: z.array(incomingEventSchema).min(1).max(ANALYTICS.maxBatch),
});

export const reportRangeSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});
