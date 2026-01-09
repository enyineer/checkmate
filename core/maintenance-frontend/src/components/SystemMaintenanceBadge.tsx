import React, { useEffect, useState, useCallback } from "react";
import { useApi, type SlotContext } from "@checkstack/frontend-api";
import { useSignal } from "@checkstack/signal-frontend";
import { SystemStateBadgesSlot } from "@checkstack/catalog-common";
import { maintenanceApiRef } from "../api";
import {
  MAINTENANCE_UPDATED,
  type MaintenanceWithSystems,
} from "@checkstack/maintenance-common";
import { Badge } from "@checkstack/ui";

type Props = SlotContext<typeof SystemStateBadgesSlot>;

/**
 * Displays a maintenance badge for a system when it has an active maintenance.
 * Shows nothing if no active maintenance.
 * Listens for realtime updates via signals.
 */
export const SystemMaintenanceBadge: React.FC<Props> = ({ system }) => {
  const api = useApi(maintenanceApiRef);
  const [hasActiveMaintenance, setHasActiveMaintenance] = useState(false);

  const refetch = useCallback(() => {
    if (!system?.id) return;

    api
      .getMaintenancesForSystem({ systemId: system.id })
      .then((maintenances: MaintenanceWithSystems[]) => {
        const active = maintenances.some((m) => m.status === "in_progress");
        setHasActiveMaintenance(active);
      })
      .catch(console.error);
  }, [system?.id, api]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for realtime maintenance updates
  useSignal(MAINTENANCE_UPDATED, ({ systemIds }) => {
    if (system?.id && systemIds.includes(system.id)) {
      refetch();
    }
  });

  if (!hasActiveMaintenance) return;
  return <Badge variant="warning">Under Maintenance</Badge>;
};
