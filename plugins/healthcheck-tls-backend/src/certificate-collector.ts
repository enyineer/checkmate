import {
  Versioned,
  z,
  type HealthCheckRunForAggregation,
  type CollectorResult,
  type CollectorStrategy,
  mergeAverage,
  averageStateSchema,
  mergeRate,
  rateStateSchema,
  type AverageState,
  type RateState,
} from "@checkstack/backend-api";
import {
  healthResultNumber,
  healthResultString,
  healthResultBoolean,
  healthResultSchema,
} from "@checkstack/healthcheck-common";
import { pluginMetadata } from "./plugin-metadata";
import type { TlsTransportClient } from "./transport-client";

// ============================================================================
// CONFIGURATION SCHEMA
// ============================================================================

const certificateConfigSchema = z.object({
  // No config needed - just returns cert info from connection
});

export type CertificateConfig = z.infer<typeof certificateConfigSchema>;

// ============================================================================
// RESULT SCHEMAS
// ============================================================================

const certificateResultSchema = healthResultSchema({
  subject: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Subject",
  }),
  issuer: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Issuer",
  }),
  validFrom: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Valid From",
  }),
  validTo: healthResultString({
    "x-chart-type": "text",
    "x-chart-label": "Valid To",
  }),
  daysRemaining: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Days Remaining",
    "x-chart-unit": "days",
  }),
  valid: healthResultBoolean({
    "x-chart-type": "boolean",
    "x-chart-label": "Valid",
  }),
});

export type CertificateResult = z.infer<typeof certificateResultSchema>;

const certificateAggregatedDisplaySchema = healthResultSchema({
  avgDaysRemaining: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Avg Days Remaining",
    "x-chart-unit": "days",
  }),
  validRate: healthResultNumber({
    "x-chart-type": "gauge",
    "x-chart-label": "Valid Rate",
    "x-chart-unit": "%",
  }),
});

const certificateAggregatedInternalSchema = z.object({
  _daysRemaining: averageStateSchema
    .optional(),
  _valid: rateStateSchema
    .optional(),
});

const certificateAggregatedSchema = certificateAggregatedDisplaySchema.merge(
  certificateAggregatedInternalSchema,
);

export type CertificateAggregatedResult = z.infer<
  typeof certificateAggregatedSchema
>;

// ============================================================================
// CERTIFICATE COLLECTOR
// ============================================================================

/**
 * Built-in TLS certificate collector.
 * Returns certificate information from the TLS connection.
 */
export class CertificateCollector implements CollectorStrategy<
  TlsTransportClient,
  CertificateConfig,
  CertificateResult,
  CertificateAggregatedResult
> {
  id = "certificate";
  displayName = "TLS Certificate";
  description = "Check TLS certificate validity and expiration";

  supportedPlugins = [pluginMetadata];

  allowMultiple = false;

  config = new Versioned({ version: 1, schema: certificateConfigSchema });
  result = new Versioned({ version: 1, schema: certificateResultSchema });
  aggregatedResult = new Versioned({
    version: 1,
    schema: certificateAggregatedSchema,
  });

  async execute({
    client,
  }: {
    config: CertificateConfig;
    client: TlsTransportClient;
    pluginId: string;
  }): Promise<CollectorResult<CertificateResult>> {
    const response = await client.exec({ action: "inspect" });

    if (response.error) {
      return {
        result: {
          subject: "",
          issuer: "",
          validFrom: "",
          validTo: "",
          daysRemaining: 0,
          valid: false,
        },
        error: response.error,
      };
    }

    return {
      result: {
        subject: response.subject ?? "",
        issuer: response.issuer ?? "",
        validFrom: response.validFrom ?? "",
        validTo: response.validTo ?? "",
        daysRemaining: response.daysRemaining ?? 0,
        valid: (response.daysRemaining ?? 0) > 0,
      },
    };
  }

  mergeResult(
    existing: CertificateAggregatedResult | undefined,
    run: HealthCheckRunForAggregation<CertificateResult>,
  ): CertificateAggregatedResult {
    const metadata = run.metadata;

    const daysState = mergeAverage(
      existing?._daysRemaining as AverageState | undefined,
      metadata?.daysRemaining,
    );

    const validState = mergeRate(
      existing?._valid as RateState | undefined,
      metadata?.valid,
    );

    return {
      avgDaysRemaining: daysState.avg,
      validRate: validState.rate,
      _daysRemaining: daysState,
      _valid: validState,
    };
  }
}
