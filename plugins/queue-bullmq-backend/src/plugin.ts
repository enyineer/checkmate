import { QueuePlugin, Queue } from "@checkmate-monitor/queue-api";
import { configString, configNumber } from "@checkmate-monitor/backend-api";
import { z } from "zod";
import { BullMQQueue } from "./bullmq-queue";

const configSchema = z.object({
  host: z.string().default("localhost").describe("Redis host"),
  port: z.number().min(1).max(65_535).default(6379).describe("Redis port"),
  password: configString({ "x-secret": true })
    .describe("Redis password (optional)")
    .optional(),
  db: configNumber({}).min(0).default(0).describe("Redis database number"),
  keyPrefix: configString({})
    .default("checkmate:")
    .describe("Key prefix for queue names"),
  concurrency: configNumber({})
    .min(1)
    .max(100)
    .default(10)
    .describe("Maximum number of concurrent jobs to process"),
});

export type BullMQConfig = z.infer<typeof configSchema>;

export class BullMQPlugin implements QueuePlugin<BullMQConfig> {
  id = "bullmq";
  displayName = "BullMQ (Redis)";
  description =
    "Production-grade distributed queue with Redis backend supporting multi-instance deployments";
  configVersion = 1;
  configSchema = configSchema;

  createQueue<T>(name: string, config: BullMQConfig): Queue<T> {
    return new BullMQQueue<T>(name, config);
  }
}
