import React, { useState, useEffect } from "react";
import { useApi } from "@checkmate/frontend-api";
import { healthCheckApiRef } from "../api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  LoadingSpinner,
} from "@checkmate/ui";
import { DEFAULT_RETENTION_CONFIG } from "@checkmate/healthcheck-common";

interface RetentionConfigDialogProps {
  systemId: string;
  configurationId: string;
  configurationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RetentionConfigDialog: React.FC<RetentionConfigDialogProps> = ({
  systemId,
  configurationId,
  configurationName,
  open,
  onOpenChange,
}) => {
  const api = useApi(healthCheckApiRef);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawRetentionDays, setRawRetentionDays] = useState(
    DEFAULT_RETENTION_CONFIG.rawRetentionDays
  );
  const [hourlyRetentionDays, setHourlyRetentionDays] = useState(
    DEFAULT_RETENTION_CONFIG.hourlyRetentionDays
  );
  const [dailyRetentionDays, setDailyRetentionDays] = useState(
    DEFAULT_RETENTION_CONFIG.dailyRetentionDays
  );
  const [isCustom, setIsCustom] = useState(false);

  // Load current retention config when dialog opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    api
      .getRetentionConfig({ systemId, configurationId })
      .then((response) => {
        if (response.retentionConfig) {
          setRawRetentionDays(response.retentionConfig.rawRetentionDays);
          setHourlyRetentionDays(response.retentionConfig.hourlyRetentionDays);
          setDailyRetentionDays(response.retentionConfig.dailyRetentionDays);
          setIsCustom(true);
        } else {
          setRawRetentionDays(DEFAULT_RETENTION_CONFIG.rawRetentionDays);
          setHourlyRetentionDays(DEFAULT_RETENTION_CONFIG.hourlyRetentionDays);
          setDailyRetentionDays(DEFAULT_RETENTION_CONFIG.dailyRetentionDays);
          setIsCustom(false);
        }
      })
      .finally(() => setLoading(false));
  }, [api, systemId, configurationId, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateRetentionConfig({
        systemId,
        configurationId,
        retentionConfig: {
          rawRetentionDays,
          hourlyRetentionDays,
          dailyRetentionDays,
        },
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setSaving(true);
    try {
      await api.updateRetentionConfig({
        systemId,
        configurationId,
        // eslint-disable-next-line unicorn/no-null -- RPC contract uses nullable()
        retentionConfig: null,
      });
      setRawRetentionDays(DEFAULT_RETENTION_CONFIG.rawRetentionDays);
      setHourlyRetentionDays(DEFAULT_RETENTION_CONFIG.hourlyRetentionDays);
      setDailyRetentionDays(DEFAULT_RETENTION_CONFIG.dailyRetentionDays);
      setIsCustom(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retention Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure data retention for <strong>{configurationName}</strong>
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {!isCustom && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Using default retention settings. Customize below to override.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rawRetention">Raw Data Retention (days)</Label>
              <Input
                id="rawRetention"
                type="number"
                min={1}
                max={30}
                value={rawRetentionDays}
                onChange={(e) => {
                  setRawRetentionDays(Number(e.target.value));
                  setIsCustom(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Individual run data before aggregating into hourly buckets
                (1-30)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRetention">
                Hourly Aggregates Retention (days)
              </Label>
              <Input
                id="hourlyRetention"
                type="number"
                min={7}
                max={90}
                value={hourlyRetentionDays}
                onChange={(e) => {
                  setHourlyRetentionDays(Number(e.target.value));
                  setIsCustom(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Hourly aggregates before rolling into daily buckets (7-90)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyRetention">
                Daily Aggregates Retention (days)
              </Label>
              <Input
                id="dailyRetention"
                type="number"
                min={30}
                max={1095}
                value={dailyRetentionDays}
                onChange={(e) => {
                  setDailyRetentionDays(Number(e.target.value));
                  setIsCustom(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Daily aggregates before deletion (30-1095, ~3 years max)
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleResetToDefaults}
            disabled={saving || loading || !isCustom}
          >
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
