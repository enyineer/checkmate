import React, { useEffect, useState, useCallback } from "react";
import { useApi, type SlotContext } from "@checkstack/frontend-api";
import { useSignal } from "@checkstack/signal-frontend";
import { SystemStateBadgesSlot } from "@checkstack/catalog-common";
import { HEALTH_CHECK_RUN_COMPLETED } from "@checkstack/healthcheck-common";
import { healthCheckApiRef } from "../api";
import { HealthBadge, type HealthStatus } from "@checkstack/ui";

type Props = SlotContext<typeof SystemStateBadgesSlot>;

/**
 * Displays a health badge for a system based on its health check results.
 * Uses the backend's getSystemHealthStatus endpoint which evaluates
 * health status based on configured state thresholds.
 * Listens for realtime updates via signals.
 */
export const SystemHealthBadge: React.FC<Props> = ({ system }) => {
  const api = useApi(healthCheckApiRef);
  const [status, setStatus] = useState<HealthStatus>();

  const refetch = useCallback(() => {
    if (!system?.id) return;

    api
      .getSystemHealthStatus({ systemId: system.id })
      .then((result) => {
        setStatus(result.status);
      })
      .catch(console.error);
  }, [system?.id, api]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for realtime health check updates
  useSignal(HEALTH_CHECK_RUN_COMPLETED, ({ systemId: changedId }) => {
    if (changedId === system?.id) {
      refetch();
    }
  });

  if (!status) return;
  return <HealthBadge status={status} />;
};
