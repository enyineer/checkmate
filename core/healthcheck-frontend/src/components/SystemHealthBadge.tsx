import React, { useEffect, useState } from "react";
import { useApi, type SlotContext } from "@checkmate/frontend-api";
import { SystemStateBadgesSlot } from "@checkmate/catalog-common";
import { healthCheckApiRef } from "../api";
import { HealthBadge, type HealthStatus } from "@checkmate/ui";

type Props = SlotContext<typeof SystemStateBadgesSlot>;

/**
 * Displays a health badge for a system based on its health check results.
 * Uses the backend's getSystemHealthStatus endpoint which evaluates
 * health status based on configured state thresholds.
 */
export const SystemHealthBadge: React.FC<Props> = ({ system }) => {
  const api = useApi(healthCheckApiRef);
  const [status, setStatus] = useState<HealthStatus>();

  useEffect(() => {
    if (!system?.id) return;

    api
      .getSystemHealthStatus({ systemId: system.id })
      .then((result) => {
        setStatus(result.status);
      })
      .catch(console.error);
  }, [system?.id, api]);

  if (!status) return;
  return <HealthBadge status={status} />;
};
