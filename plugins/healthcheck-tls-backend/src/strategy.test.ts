import { describe, expect, it, mock } from "bun:test";
import {
  TlsHealthCheckStrategy,
  TlsClient,
  TlsConnection,
  CertificateInfo,
} from "./strategy";

describe("TlsHealthCheckStrategy", () => {
  // Create a valid certificate info (30 days until expiry)
  const createCertInfo = (
    overrides: Partial<{
      subject: string;
      issuer: string;
      issuerOrg: string | undefined;
      validFrom: Date;
      validTo: Date;
    }> = {}
  ): CertificateInfo => {
    const validFrom =
      overrides.validFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const validTo =
      overrides.validTo ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Check if issuerOrg was explicitly set (even to undefined)
    const hasIssuerOrg = "issuerOrg" in overrides;
    const issuerOrg = hasIssuerOrg ? overrides.issuerOrg : "DigiCert Inc";

    return {
      subject: { CN: overrides.subject ?? "example.com" },
      issuer: {
        CN: overrides.issuer ?? "DigiCert",
        O: issuerOrg,
      },
      valid_from: validFrom.toISOString(),
      valid_to: validTo.toISOString(),
    };
  };

  // Helper to create mock TLS client
  const createMockClient = (
    config: {
      authorized?: boolean;
      cert?: CertificateInfo;
      protocol?: string;
      cipher?: string;
      error?: Error;
    } = {}
  ): TlsClient => ({
    connect: mock(() =>
      config.error
        ? Promise.reject(config.error)
        : Promise.resolve({
            authorized: config.authorized ?? true,
            getPeerCertificate: () => config.cert ?? createCertInfo(),
            getProtocol: () => config.protocol ?? "TLSv1.3",
            getCipher: () => (config.cipher ? { name: config.cipher } : null),
            end: mock(() => {}),
          } as TlsConnection)
    ),
  });

  describe("execute", () => {
    it("should return healthy for valid certificate", async () => {
      const strategy = new TlsHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: true,
      });

      expect(result.status).toBe("healthy");
      expect(result.metadata?.isValid).toBe(true);
      expect(result.metadata?.daysUntilExpiry).toBeGreaterThan(0);
    });

    it("should return unhealthy for unauthorized certificate", async () => {
      const strategy = new TlsHealthCheckStrategy(
        createMockClient({ authorized: false })
      );

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: true,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("not valid");
    });

    it("should return unhealthy when certificate expires soon", async () => {
      const expiringCert = createCertInfo({
        validTo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      });

      const strategy = new TlsHealthCheckStrategy(
        createMockClient({ cert: expiringCert })
      );

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 14,
        rejectUnauthorized: true,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("expires in");
    });

    it("should return unhealthy for connection error", async () => {
      const strategy = new TlsHealthCheckStrategy(
        createMockClient({ error: new Error("Connection refused") })
      );

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: true,
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Connection refused");
    });

    it("should pass daysUntilExpiry assertion", async () => {
      const strategy = new TlsHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: true,
        assertions: [
          {
            field: "daysUntilExpiry",
            operator: "greaterThanOrEqual",
            value: 7,
          },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should pass issuer assertion", async () => {
      const strategy = new TlsHealthCheckStrategy(createMockClient());

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: true,
        assertions: [
          { field: "issuer", operator: "contains", value: "DigiCert" },
        ],
      });

      expect(result.status).toBe("healthy");
    });

    it("should fail isValid assertion when certificate is invalid", async () => {
      const strategy = new TlsHealthCheckStrategy(
        createMockClient({ authorized: false })
      );

      const result = await strategy.execute({
        host: "example.com",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 7,
        rejectUnauthorized: false, // Don't reject to test assertion
        assertions: [{ field: "isValid", operator: "isTrue" }],
      });

      expect(result.status).toBe("unhealthy");
      expect(result.message).toContain("Assertion failed");
    });

    it("should detect self-signed certificates", async () => {
      const selfSignedCert = createCertInfo({
        subject: "localhost",
        issuer: "localhost",
        issuerOrg: undefined,
      });

      const strategy = new TlsHealthCheckStrategy(
        createMockClient({ cert: selfSignedCert, authorized: false })
      );

      const result = await strategy.execute({
        host: "localhost",
        port: 443,
        timeout: 5000,
        minDaysUntilExpiry: 0,
        rejectUnauthorized: false,
      });

      expect(result.metadata?.isSelfSigned).toBe(true);
    });
  });

  describe("aggregateResult", () => {
    it("should calculate averages correctly", () => {
      const strategy = new TlsHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "healthy" as const,
          latencyMs: 100,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            isValid: true,
            isSelfSigned: false,
            issuer: "DigiCert",
            subject: "example.com",
            validFrom: "2024-01-01",
            validTo: "2025-01-01",
            daysUntilExpiry: 30,
          },
        },
        {
          id: "2",
          status: "healthy" as const,
          latencyMs: 150,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            isValid: true,
            isSelfSigned: false,
            issuer: "DigiCert",
            subject: "example.com",
            validFrom: "2024-01-01",
            validTo: "2025-01-01",
            daysUntilExpiry: 20,
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.avgDaysUntilExpiry).toBe(25);
      expect(aggregated.minDaysUntilExpiry).toBe(20);
      expect(aggregated.invalidCount).toBe(0);
      expect(aggregated.errorCount).toBe(0);
    });

    it("should count invalid and errors", () => {
      const strategy = new TlsHealthCheckStrategy();
      const runs = [
        {
          id: "1",
          status: "unhealthy" as const,
          latencyMs: 100,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: true,
            isValid: false,
            isSelfSigned: false,
            issuer: "",
            subject: "",
            validFrom: "",
            validTo: "",
            daysUntilExpiry: 0,
          },
        },
        {
          id: "2",
          status: "unhealthy" as const,
          latencyMs: 0,
          checkId: "c1",
          timestamp: new Date(),
          metadata: {
            connected: false,
            isValid: false,
            isSelfSigned: false,
            issuer: "",
            subject: "",
            validFrom: "",
            validTo: "",
            daysUntilExpiry: 0,
            error: "Connection refused",
          },
        },
      ];

      const aggregated = strategy.aggregateResult(runs);

      expect(aggregated.invalidCount).toBe(1);
      expect(aggregated.errorCount).toBe(1);
    });
  });
});
