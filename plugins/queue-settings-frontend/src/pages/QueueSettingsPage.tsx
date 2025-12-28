import React, { useEffect, useState } from "react";
import {
  useApi,
  wrapInSuspense,
  permissionApiRef,
} from "@checkmate/frontend-api";
import { queueSettingsApiRef } from "../api";
import { QueuePluginDto, permissions } from "@checkmate/queue-settings-common";
import {
  Button,
  Page,
  PageHeader,
  PageContent,
  PermissionDenied,
  LoadingSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
  DynamicForm,
} from "@checkmate/ui";
import { AlertTriangle, Save } from "lucide-react";

const QueueSettingsPageContent = () => {
  const api = useApi(queueSettingsApiRef);
  const permissionApi = useApi(permissionApiRef);
  const { allowed: canRead, loading: permissionLoading } =
    permissionApi.usePermission(permissions.queueRead.id);
  const { allowed: canUpdate } = permissionApi.usePermission(
    permissions.queueUpdate.id
  );

  const [plugins, setPlugins] = useState<QueuePluginDto[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string>("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [pluginsList, configuration] = await Promise.all([
        api.getPlugins(),
        api.getConfiguration(),
      ]);
      setPlugins(pluginsList);
      setSelectedPluginId(configuration.pluginId);
      setConfig(configuration.config);
    };
    fetchData();
  }, [api]);

  const selectedPlugin = plugins.find((p) => p.id === selectedPluginId);

  const handleSave = async () => {
    if (!selectedPluginId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateConfiguration({
        pluginId: selectedPluginId,
        config,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (permissionLoading) {
    return <LoadingSpinner />;
  }

  if (!canRead) {
    return <PermissionDenied />;
  }

  const isMemoryQueue = selectedPluginId === "memory";

  return (
    <Page>
      <PageHeader
        title="Queue Settings"
        subtitle="Configure the queue system for background jobs"
      />
      <PageContent>
        <div className="max-w-3xl space-y-6">
          {isMemoryQueue && (
            <Alert variant="warning">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <AlertTitle>In-Memory Queue Warning</AlertTitle>
                <AlertDescription>
                  The in-memory queue is suitable for development and
                  single-instance deployments only. It will not scale across
                  multiple instances and jobs will be lost on restart. For
                  production environments with multiple instances, consider
                  using a persistent queue implementation.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {saveSuccess && (
            <Alert variant="success">
              <AlertDescription>
                Configuration saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="queue-plugin">Queue Plugin</Label>
            <Select
              value={selectedPluginId}
              onValueChange={(value) => {
                setSelectedPluginId(value);
                setConfig({});
              }}
              disabled={!canUpdate}
            >
              <SelectTrigger id="queue-plugin">
                <SelectValue placeholder="Select a queue plugin" />
              </SelectTrigger>
              <SelectContent>
                {plugins.map((plugin) => (
                  <SelectItem key={plugin.id} value={plugin.id}>
                    <div>
                      <div className="font-medium">{plugin.displayName}</div>
                      {plugin.description && (
                        <div className="text-xs text-muted-foreground">
                          {plugin.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlugin && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the settings for {selectedPlugin.displayName}
                </p>
              </div>

              <DynamicForm
                schema={selectedPlugin.configSchema}
                value={config}
                onChange={setConfig}
              />

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!canUpdate || isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </Page>
  );
};

export const QueueSettingsPage = wrapInSuspense(QueueSettingsPageContent);
