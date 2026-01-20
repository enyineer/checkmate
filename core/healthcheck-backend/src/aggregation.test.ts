import { describe, it, expect, mock, beforeEach } from "bun:test";
import { HealthCheckService } from "./service";

describe("HealthCheckService.getAggregatedHistory", () => {
  // Mock database and registry
  let mockDb: ReturnType<typeof createMockDb>;
  let mockRegistry: ReturnType<typeof createMockRegistry>;
  let service: HealthCheckService;
  // Store mock data for different queries
  let mockConfigResult: { id: string; strategyId: string } | null = null;
  let mockRunsResult: unknown[] = [];
  let mockHourlyAggregates: unknown[] = [];
  let mockDailyAggregates: unknown[] = [];
  let selectCallCount = 0;

  function createMockDb() {
    // Reset call counter on creation
    selectCallCount = 0;

    // Create a mock that handles:
    // 1. Config query (uses limit(1))
    // 2. Raw runs query (first orderBy after where)
    // 3. Hourly aggregates query (second orderBy after where)
    // 4. Daily aggregates query (third orderBy after where)
    const createSelectChain = () => {
      const currentCall = selectCallCount++;

      return {
        from: mock(() => ({
          where: mock(() => ({
            // For config query: uses .limit(1)
            limit: mock(() =>
              Promise.resolve(mockConfigResult ? [mockConfigResult] : []),
            ),
            // For runs/aggregates queries: uses .orderBy()
            orderBy: mock(() => {
              // Call 1: raw runs, Call 2: hourly, Call 3: daily
              if (currentCall === 1) return Promise.resolve(mockRunsResult);
              if (currentCall === 2)
                return Promise.resolve(mockHourlyAggregates);
              if (currentCall === 3)
                return Promise.resolve(mockDailyAggregates);
              return Promise.resolve([]);
            }),
          })),
        })),
      };
    };

    return {
      select: mock(createSelectChain),
    };
  }

  function createMockRegistry() {
    return {
      register: mock(),
      getStrategies: mock(() => []),
      getStrategy: mock(() => ({
        id: "http",
        displayName: "HTTP",
        config: { version: 1, schema: {} },
        aggregatedResult: { version: 1, schema: {} },
        execute: mock(),
        aggregateResult: mock((runs: unknown[]) => ({
          totalRuns: runs.length,
          customMetric: "aggregated",
        })),
      })),
    };
  }

  beforeEach(() => {
    // Reset mock data
    mockConfigResult = null;
    mockRunsResult = [];
    mockHourlyAggregates = [];
    mockDailyAggregates = [];
    mockDb = createMockDb();
    mockRegistry = createMockRegistry();
    service = new HealthCheckService(mockDb as never, mockRegistry as never);
  });

  describe("dynamic bucket interval calculation", () => {
    it("returns bucketIntervalSeconds in response", async () => {
      const startDate = new Date("2024-01-01T00:00:00Z");
      const endDate = new Date("2024-01-02T00:00:00Z"); // 24 hours

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate,
          endDate,
          targetPoints: 500,
        },
        { includeAggregatedResult: true },
      );

      // 24 hours = 86400 seconds / 500 target points = ~173 seconds per bucket
      expect(result.bucketIntervalSeconds).toBe(173);
      expect(result.buckets).toEqual([]);
    });

    it("calculates interval based on targetPoints", async () => {
      const startDate = new Date("2024-01-01T00:00:00Z");
      const endDate = new Date("2024-01-01T01:00:00Z"); // 1 hour

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate,
          endDate,
          targetPoints: 100,
        },
        { includeAggregatedResult: true },
      );

      // 1 hour = 3600 seconds / 100 target points = 36 seconds per bucket
      expect(result.bucketIntervalSeconds).toBe(36);
    });

    it("enforces minimum interval of 1 second", async () => {
      const startDate = new Date("2024-01-01T00:00:00Z");
      const endDate = new Date("2024-01-01T00:00:10Z"); // 10 seconds

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate,
          endDate,
          targetPoints: 2000, // Would result in 0.005s intervals without minimum
        },
        { includeAggregatedResult: true },
      );

      // Minimum interval is 1 second
      expect(result.bucketIntervalSeconds).toBe(1);
    });
  });

  describe("bucketing and metrics calculation", () => {
    it("groups runs into dynamic buckets and calculates metrics", async () => {
      const runs = [
        {
          id: "run-1",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 100,
          result: { statusCode: 200 },
          timestamp: new Date("2024-01-01T10:00:10Z"),
        },
        {
          id: "run-2",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 150,
          result: { statusCode: 200 },
          timestamp: new Date("2024-01-01T10:00:20Z"),
        },
        {
          id: "run-3",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "unhealthy" as const,
          latencyMs: 300,
          result: { statusCode: 500 },
          timestamp: new Date("2024-01-01T10:01:00Z"),
        },
      ];

      // Setup mock data
      mockRunsResult = runs;
      mockConfigResult = { id: "config-1", strategyId: "http" };

      // Query for 1 hour with 60 target points = 1 minute buckets
      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T10:00:00Z"),
          endDate: new Date("2024-01-01T11:00:00Z"),
          targetPoints: 60,
        },
        { includeAggregatedResult: true },
      );

      // Should be ~60s buckets
      expect(result.bucketIntervalSeconds).toBe(60);

      // First two runs should be in the same bucket (00:10 and 00:20), third in next (01:00)
      expect(result.buckets).toHaveLength(2);

      // First bucket should have 2 runs
      const firstBucket = result.buckets[0];
      expect(firstBucket.runCount).toBe(2);
      expect(firstBucket.healthyCount).toBe(2);
      expect(firstBucket.unhealthyCount).toBe(0);
      expect(firstBucket.successRate).toBe(1);
      expect(firstBucket.avgLatencyMs).toBe(125);

      // Second bucket should have 1 run
      const secondBucket = result.buckets[1];
      expect(secondBucket.runCount).toBe(1);
      expect(secondBucket.healthyCount).toBe(0);
      expect(secondBucket.unhealthyCount).toBe(1);
      expect(secondBucket.successRate).toBe(0);
    });

    it("calculates p95 latency correctly", async () => {
      // Create 20 runs with latencies 100-200 (step 5)
      const runs = Array.from({ length: 20 }, (_, i) => ({
        id: `run-${i}`,
        systemId: "sys-1",
        configurationId: "config-1",
        status: "healthy" as const,
        latencyMs: 100 + i * 5,
        result: {},
        timestamp: new Date("2024-01-01T10:00:00Z"),
      }));

      // Setup mock data
      mockRunsResult = runs;
      mockConfigResult = { id: "config-1", strategyId: "http" };

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T10:00:00Z"),
          endDate: new Date("2024-01-01T11:00:00Z"),
        },
        { includeAggregatedResult: true },
      );

      expect(result.buckets).toHaveLength(1);
      expect(result.buckets[0].p95LatencyMs).toBe(190); // 95th percentile of 100-195
    });
  });

  describe("strategy metadata aggregation", () => {
    it("calls strategy.aggregateResult for each bucket", async () => {
      const runs = [
        {
          id: "run-1",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 100,
          result: { statusCode: 200 },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      // Setup mock data
      mockRunsResult = runs;
      mockConfigResult = { id: "config-1", strategyId: "http" };

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T10:00:00Z"),
          endDate: new Date("2024-01-01T11:00:00Z"),
        },
        { includeAggregatedResult: true },
      );

      const bucket = result.buckets[0];
      expect(
        "aggregatedResult" in bucket && bucket.aggregatedResult,
      ).toMatchObject({
        totalRuns: 1,
        customMetric: "aggregated",
      });

      // Verify getStrategy was called to look up the strategy
      expect(mockRegistry.getStrategy).toHaveBeenCalled();
    });

    it("returns undefined aggregatedResult when no strategy found", async () => {
      const runs = [
        {
          id: "run-1",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 100,
          result: {},
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
      ];

      // Setup mock data - no config found means no strategy
      mockRunsResult = runs;
      mockConfigResult = null;

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T10:00:00Z"),
          endDate: new Date("2024-01-01T11:00:00Z"),
        },
        { includeAggregatedResult: true },
      );

      const bucket = result.buckets[0];
      expect(
        "aggregatedResult" in bucket ? bucket.aggregatedResult : undefined,
      ).toBeUndefined();
    });
  });

  describe("bucketIntervalSeconds in buckets", () => {
    it("includes bucketIntervalSeconds in each bucket", async () => {
      const runs = [
        {
          id: "run-1",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 100,
          result: {},
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "run-2",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 150,
          result: {},
          timestamp: new Date("2024-01-02T10:00:00Z"),
        },
      ];

      // Setup mock data
      mockRunsResult = runs;
      mockConfigResult = { id: "config-1", strategyId: "http" };

      const result = await service.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T00:00:00Z"),
          endDate: new Date("2024-01-03T00:00:00Z"),
          targetPoints: 48, // 2 days / 48 = 1 hour buckets
        },
        { includeAggregatedResult: true },
      );

      expect(result.buckets).toHaveLength(2);

      // Each bucket should have bucketIntervalSeconds
      expect(result.buckets[0].bucketIntervalSeconds).toBe(3600); // 1 hour
      expect(result.buckets[1].bucketIntervalSeconds).toBe(3600);
    });
  });

  describe("collector data aggregation", () => {
    it("aggregates collector data per bucket using collector's aggregateResult", async () => {
      // Runs with collector data in metadata.collectors
      const runs = [
        {
          id: "run-1",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 100,
          result: {
            metadata: {
              collectors: {
                "uuid-1": {
                  _collectorId: "healthcheck-http.request",
                  responseTimeMs: 100,
                  success: true,
                },
              },
            },
          },
          timestamp: new Date("2024-01-01T10:00:00Z"),
        },
        {
          id: "run-2",
          systemId: "sys-1",
          configurationId: "config-1",
          status: "healthy" as const,
          latencyMs: 150,
          result: {
            metadata: {
              collectors: {
                "uuid-1": {
                  _collectorId: "healthcheck-http.request",
                  responseTimeMs: 200,
                  success: true,
                },
              },
            },
          },
          timestamp: new Date("2024-01-01T10:30:00Z"),
        },
      ];

      // Create a mock collector that aggregates response times
      const mockCollectorRegistry = {
        getCollector: mock((collectorId: string) => {
          if (collectorId === "healthcheck-http.request") {
            return {
              collector: {
                aggregateResult: (
                  runsData: Array<{
                    status: string;
                    metadata?: Record<string, unknown>;
                  }>,
                ) => {
                  const times = runsData
                    .map((r) => r.metadata?.responseTimeMs as number)
                    .filter((v) => typeof v === "number");
                  return {
                    avgResponseTimeMs:
                      times.reduce((a, b) => a + b, 0) / times.length,
                    successRate: 100,
                  };
                },
              },
            };
          }
          return undefined;
        }),
      };

      mockRunsResult = runs;
      mockConfigResult = { id: "config-1", strategyId: "http" };

      // Create a fresh mock db for this test (resets call counter)
      const freshMockDb = createMockDb();

      // Create service with mock collector registry
      const serviceWithCollectors = new HealthCheckService(
        freshMockDb as never,
        mockRegistry as never,
        mockCollectorRegistry as never,
      );

      const result = await serviceWithCollectors.getAggregatedHistory(
        {
          systemId: "sys-1",
          configurationId: "config-1",
          startDate: new Date("2024-01-01T10:00:00Z"),
          endDate: new Date("2024-01-01T11:00:00Z"),
          targetPoints: 1, // Single bucket for the whole hour
        },
        { includeAggregatedResult: true },
      );

      expect(result.buckets).toHaveLength(1);

      const bucket = result.buckets[0];
      expect("aggregatedResult" in bucket).toBe(true);

      const aggregatedResult = (
        bucket as { aggregatedResult: Record<string, unknown> }
      ).aggregatedResult;
      expect(aggregatedResult.collectors).toBeDefined();

      const collectors = aggregatedResult.collectors as Record<string, unknown>;
      const collectorData = collectors["uuid-1"] as Record<string, unknown>;

      expect(collectorData._collectorId).toBe("healthcheck-http.request");
      expect(collectorData.avgResponseTimeMs).toBe(150); // Average of 100 and 200
      expect(collectorData.successRate).toBe(100);
    });
  });
});
