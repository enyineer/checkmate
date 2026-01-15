import React, { useEffect, useState } from "react";
import { useApi, rpcApiRef, accessApiRef } from "@checkstack/frontend-api";
import { useSignal } from "@checkstack/signal-frontend";
import {
  QueueApi,
  QUEUE_LAG_CHANGED,
  queueAccess,
  type LagSeverity,
} from "@checkstack/queue-common";
import { Alert, AlertTitle, AlertDescription } from "@checkstack/ui";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface QueueLagAlertProps {
  /** Only show if user has queue settings access */
  requireAccess?: boolean;
}

/**
 * Displays a warning alert when queue is lagging (high pending jobs).
 * Uses signal for real-time updates + initial fetch on mount.
 */
export const QueueLagAlert: React.FC<QueueLagAlertProps> = ({
  requireAccess = true,
}) => {
  const rpcApi = useApi(rpcApiRef);
  const accessApi = useApi(accessApiRef);
  const queueApi = rpcApi.forPlugin(QueueApi);

  const [pending, setPending] = useState(0);
  const [severity, setSeverity] = useState<LagSeverity>("none");
  const [loading, setLoading] = useState(true);

  // Check access if required
  const { allowed, loading: accessLoading } = accessApi.useAccess(
    queueAccess.settings.read
  );

  // Fetch initial status on mount
  useEffect(() => {
    if (requireAccess && !allowed) {
      setLoading(false);
      return;
    }

    queueApi
      .getLagStatus()
      .then((status) => {
        setPending(status.pending);
        setSeverity(status.severity);
      })
      .catch(() => {
        // Silently fail - alert won't show
      })
      .finally(() => {
        setLoading(false);
      });
  }, [queueApi, requireAccess, allowed]);

  // Listen for real-time lag updates
  useSignal(QUEUE_LAG_CHANGED, (payload) => {
    setPending(payload.pending);
    setSeverity(payload.severity);
  });

  // Don't render if loading, no access, or no lag
  if (loading || accessLoading) {
    return;
  }

  if (requireAccess && !allowed) {
    return;
  }

  if (severity === "none") {
    return;
  }

  const variant = severity === "critical" ? "error" : "warning";
  const Icon = severity === "critical" ? AlertCircle : AlertTriangle;
  const title =
    severity === "critical" ? "Queue backlog critical" : "Queue building up";
  const description =
    severity === "critical"
      ? `${pending} jobs pending. Consider scaling or reducing load.`
      : `${pending} jobs pending. Some jobs may be delayed.`;

  return (
    <Alert variant={variant} className="mb-4">
      <Icon className="h-5 w-5" />
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </div>
    </Alert>
  );
};
