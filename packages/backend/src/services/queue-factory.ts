import { Queue, QueueFactory } from "@checkmate/queue-api";
import { QueuePluginRegistryImpl } from "./queue-plugin-registry";
import { Logger, ConfigService } from "@checkmate/backend-api";
import { z } from "zod";

// Schema for active plugin pointer
const activePluginPointerSchema = z.object({
  activePluginId: z.string(),
});

export class QueueFactoryImpl implements QueueFactory {
  private activePluginId: string = "memory"; // Default
  private activeConfig: unknown = { concurrency: 10, maxQueueSize: 10_000 };
  private createdQueues: Map<string, Queue<unknown>> = new Map();

  constructor(
    private registry: QueuePluginRegistryImpl,
    private configService: ConfigService,
    private logger: Logger
  ) {}

  async loadConfiguration(): Promise<void> {
    try {
      // Load active plugin pointer
      const pointer = await this.configService.get(
        "queue:active",
        activePluginPointerSchema,
        1
      );

      if (pointer) {
        this.activePluginId = pointer.activePluginId;

        // Load the actual config for this plugin
        const plugin = this.registry.getPlugin(this.activePluginId);
        if (plugin) {
          const config = await this.configService.get(
            this.activePluginId,
            plugin.configSchema,
            plugin.configVersion
          );

          if (config) {
            this.activeConfig = config;
          }
        }

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

    const queue = plugin.createQueue<T>(name, this.activeConfig);

    // Track the queue for graceful shutdown
    this.createdQueues.set(name, queue);

    return queue;
  }

  getActivePlugin(): string {
    return this.activePluginId;
  }

  getActiveConfig(): unknown {
    return this.activeConfig;
  }

  async setActivePlugin(pluginId: string, config: unknown): Promise<void> {
    // Validate plugin exists
    const plugin = this.registry.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Validate config against schema
    plugin.configSchema.parse(config);

    // Test connection by creating a test queue
    this.logger.info("🔍 Testing queue connection...");
    try {
      const testQueue = plugin.createQueue("__connection_test__", config);
      await testQueue.testConnection();
      await testQueue.stop();
      this.logger.info("✅ Connection test successful");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Connection test failed: ${message}`);
      throw new Error(`Failed to connect to queue: ${message}`);
    }

    // Stop all active queues gracefully before switching
    this.logger.info(
      "🛑 Stopping active queues before switching configuration..."
    );
    const stopPromises: Promise<void>[] = [];
    for (const [name, queue] of this.createdQueues.entries()) {
      this.logger.debug(`Stopping queue: ${name}`);
      stopPromises.push(
        queue.stop().catch((error) => {
          this.logger.error(`Failed to stop queue ${name}`, error);
        })
      );
    }
    await Promise.all(stopPromises);

    // Clear the queue tracking
    this.createdQueues.clear();
    this.logger.info("✅ All active queues stopped successfully");

    // Save plugin config under plugin ID
    await this.configService.set(
      pluginId,
      plugin.configSchema,
      plugin.configVersion,
      config
    );

    // Save active plugin pointer
    await this.configService.set("queue:active", activePluginPointerSchema, 1, {
      activePluginId: pluginId,
    });

    this.activePluginId = pluginId;
    this.activeConfig = config;

    this.logger.info(`📋 Updated queue configuration: plugin=${pluginId}`);
  }
}
