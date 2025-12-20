import React, { useState } from "react";
import {
  HealthCheckConfiguration,
  HealthCheckStrategyDto,
  CreateHealthCheckConfiguration,
} from "@checkmate/healthcheck-common";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@checkmate/ui";

interface HealthCheckEditorProps {
  strategies: HealthCheckStrategyDto[];
  initialData?: HealthCheckConfiguration;
  onSave: (data: CreateHealthCheckConfiguration) => Promise<void>;
  onCancel: () => void;
}

export const HealthCheckEditor: React.FC<HealthCheckEditorProps> = ({
  strategies,
  initialData,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [strategyId, setStrategyId] = useState(initialData?.strategyId || "");
  const [interval, setInterval] = useState(
    initialData?.intervalSeconds?.toString() || "60"
  );
  const [config, setConfig] = useState<string>(
    initialData ? JSON.stringify(initialData.config, undefined, 2) : "{}"
  );
  const [loading, setLoading] = useState(false);

  // In a real implementation, we would use a dynamic form generator based on strategy.configSchema
  // For now, we'll use a simple JSON text area.

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(config);
      } catch {
        alert("Invalid JSON config");
        setLoading(false);
        return;
      }

      await onSave({
        name,
        strategyId,
        intervalSeconds: Number.parseInt(interval, 10),
        config: parsedConfig,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Edit Health Check" : "Create Health Check"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy</Label>
            <Select
              value={strategyId}
              onValueChange={setStrategyId}
              disabled={!!initialData} // Changing strategy changes schema, tricky for edit
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Interval (seconds)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <textarea
              id="config"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={10}
              value={config}
              onChange={(e) => setConfig(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter valid JSON for the strategy configuration.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
