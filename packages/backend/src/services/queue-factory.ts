import { Queue, QueueFactory } from "@checkmate/queue-api";
import { QueuePluginRegistryImpl } from "./queue-plugin-registry";
import { Logger, ConfigService } from "@checkmate/backend-api";
import { z } from "zod";

// Schema for queue configuration stored in ConfigService
const queueConfigSchema = z.object({
  pluginId: z.string(),
  config: z.record(z.string(), z.unknown()),
});

export class QueueFactoryImpl implements QueueFactory {
  private activePluginId: string = "memory"; // Default
  private activeConfig: unknown = { concurrency: 10, maxQueueSize: 10_000 };

  constructor(
    private registry: QueuePluginRegistryImpl,
    private configService: ConfigService,
    private logger: Logger
  ) {}

  async loadConfiguration(): Promise<void> {
    try {
      const config = await this.configService.get(
        "active",
        queueConfigSchema,
        1
      );

      if (config) {
        this.activePluginId = config.pluginId;
        this.activeConfig = config.config;
        this.logger.info(
          `📋 Loaded queue configuration: plugin=${this.activePluginId}`
        );
      } else {
        this.logger.info(
          `📋 No queue configuration found, using default: plugin=${this.activePluginId}`
        );
      }
    } catch (error) {
      this.logger.error("Failed to load queue configuration", error);
      // Continue with defaults
    }
  }

  createQueue<T>(name: string): Queue<T> {
    const plugin = this.registry.getPlugin(this.activePluginId);
    if (!plugin) {
      throw new Error(`Queue plugin '${this.activePluginId}' not found`);
    }
    return plugin.createQueue(name, this.activeConfig);
  }

  getActivePlugin(): string {
    return this.activePluginId;
  }

  async setActivePlugin(pluginId: string, config: unknown): Promise<void> {
    // Validate plugin exists
    const plugin = this.registry.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Validate config against schema
    plugin.configSchema.parse(config);

    // Save to ConfigService
    await this.configService.set("active", queueConfigSchema, 1, {
      pluginId,
      config: config as Record<string, unknown>,
    });

    this.activePluginId = pluginId;
    this.activeConfig = config;

    this.logger.info(`📋 Updated queue configuration: plugin=${pluginId}`);
  }
}
