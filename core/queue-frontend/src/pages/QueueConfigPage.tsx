import { useEffect, useState } from "react";
import { useApi, wrapInSuspense, accessApiRef } from "@checkstack/frontend-api";
import { queueApiRef } from "../api";
import { QueuePluginDto, queueAccess } from "@checkstack/queue-common";
import {
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  PageLayout,
  PluginConfigForm,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  useToast,
} from "@checkstack/ui";
import { AlertTriangle, Save, Info, Gauge, Activity } from "lucide-react";
import { QueueLagAlert } from "../components/QueueLagAlert";

const QueueConfigPageContent = () => {
  const api = useApi(queueApiRef);
  const accessApi = useApi(accessApiRef);
  const toast = useToast();
  const { allowed: canRead, loading: accessLoading } = accessApi.useAccess(
    queueAccess.settings.read
  );
  const { allowed: canUpdate } = accessApi.useAccess(
    queueAccess.settings.manage
  );

  const [plugins, setPlugins] = useState<QueuePluginDto[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string>("");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!selectedPluginId) return;
    setIsSaving(true);
    try {
      await api.updateConfiguration({
        pluginId: selectedPluginId,
        config,
      });
      toast.success("Configuration saved successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save configuration: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isMemoryQueue = selectedPluginId === "memory";

  return (
    <PageLayout
      title="Queue Settings"
      subtitle="Configure the queue system for background jobs"
      loading={accessLoading}
      allowed={canRead}
      maxWidth="3xl"
    >
      <QueueLagAlert requireAccess={false} />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Queue Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select and configure the queue plugin
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <PluginConfigForm
              label="Queue Plugin"
              plugins={plugins}
              selectedPluginId={selectedPluginId}
              onPluginChange={(value) => {
                setSelectedPluginId(value);
                setConfig({});
              }}
              config={config}
              onConfigChange={setConfig}
              disabled={!canUpdate}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={!canUpdate || isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </CardFooter>
        </Card>

        {/* Performance Guidance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Performance Tuning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium">
                  <Gauge className="h-4 w-4" />
                  Concurrency Settings
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Default (10)</strong>: Conservative, safe for most
                    workloads
                  </li>
                  <li>
                    <strong>Moderate (25-50)</strong>: Good for I/O-bound health
                    checks
                  </li>
                  <li>
                    <strong>Aggressive (100)</strong>: Maximum, monitor resource
                    usage
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Formula: throughput ≈ concurrency / avg_job_duration
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 font-medium">
                  <Activity className="h-4 w-4" />
                  Bottleneck Indicators
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Jobs queueing</strong>: Increase concurrency or
                    scale horizontally
                  </li>
                  <li>
                    <strong>High CPU (&gt;70%)</strong>: Scale horizontally,
                    don't increase concurrency
                  </li>
                  <li>
                    <strong>DB connection errors</strong>: Reduce concurrency or
                    increase pool
                  </li>
                  <li>
                    <strong>Rate limit errors</strong>: Reduce concurrency for
                    external checks
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export const QueueConfigPage = wrapInSuspense(QueueConfigPageContent);
