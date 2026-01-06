import { useState, useEffect, useCallback } from "react";
import {
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from "@checkmate-monitor/ui";
import { useApi, rpcApiRef } from "@checkmate-monitor/frontend-api";
import type { ProviderConfigProps } from "@checkmate-monitor/integration-frontend";
import {
  JiraApi,
  type JiraSubscriptionConfig,
  type JiraConnectionRedacted,
  type JiraProject,
  type JiraIssueType,
} from "@checkmate-monitor/integration-jira-common";
import { Loader2 } from "lucide-react";

/**
 * Custom configuration component for Jira subscriptions.
 * Provides dynamic dropdowns for connections, projects, and issue types.
 */
export const JiraConfigComponent = ({
  value,
  onChange,
  isSubmitting,
}: ProviderConfigProps<JiraSubscriptionConfig>) => {
  const rpcApi = useApi(rpcApiRef);
  const client = rpcApi.forPlugin(JiraApi);
  const toast = useToast();

  // Local state for fetched data
  const [connections, setConnections] = useState<JiraConnectionRedacted[]>([]);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [priorities, setPriorities] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Loading states
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingIssueTypes, setLoadingIssueTypes] = useState(false);
  const [loadingPriorities, setLoadingPriorities] = useState(false);

  // Fetch connections on mount
  const fetchConnections = useCallback(async () => {
    try {
      setLoadingConnections(true);
      const result = await client.listConnections();
      setConnections(result);
    } catch (error) {
      toast.error("Failed to fetch Jira connections");
      console.error(error);
    } finally {
      setLoadingConnections(false);
    }
  }, [client, toast]);

  useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  // Fetch projects when connection changes
  useEffect(() => {
    if (!value.connectionId) {
      setProjects([]);
      return;
    }

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const result = await client.getProjects({
          connectionId: value.connectionId,
        });
        setProjects(result);

        // Also fetch priorities
        setLoadingPriorities(true);
        const prios = await client.getPriorities({
          connectionId: value.connectionId,
        });
        setPriorities(prios);
      } catch (error) {
        toast.error("Failed to fetch Jira projects");
        console.error(error);
      } finally {
        setLoadingProjects(false);
        setLoadingPriorities(false);
      }
    };

    void fetchProjects();
  }, [value.connectionId, client, toast]);

  // Fetch issue types when project changes
  useEffect(() => {
    if (!value.connectionId || !value.projectKey) {
      setIssueTypes([]);
      return;
    }

    const fetchIssueTypes = async () => {
      try {
        setLoadingIssueTypes(true);
        const result = await client.getIssueTypes({
          connectionId: value.connectionId,
          projectKey: value.projectKey,
        });
        setIssueTypes(result);
      } catch (error) {
        toast.error("Failed to fetch issue types");
        console.error(error);
      } finally {
        setLoadingIssueTypes(false);
      }
    };

    void fetchIssueTypes();
  }, [value.connectionId, value.projectKey, client, toast]);

  // Helper to update a single field
  const updateField = <K extends keyof JiraSubscriptionConfig>(
    field: K,
    fieldValue: JiraSubscriptionConfig[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-6">
      {/* Connection Selection */}
      <div className="space-y-2">
        <Label>Jira Connection *</Label>
        <p className="text-sm text-muted-foreground">
          Select a configured Jira connection to use
        </p>
        {loadingConnections ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading connections...
            </span>
          </div>
        ) : connections.length === 0 ? (
          <div className="px-3 py-2 border rounded-md bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm">
            No Jira connections configured. Please add a connection in Settings
            first.
          </div>
        ) : (
          <Select
            value={value.connectionId || ""}
            onValueChange={(v) => {
              updateField("connectionId", v);
              // Reset dependent fields
              updateField("projectKey", "");
              updateField("issueTypeId", "");
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a connection" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.id}>
                  {conn.name} ({conn.baseUrl})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Project Selection */}
      <div className="space-y-2">
        <Label>Project *</Label>
        {loadingProjects ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading projects...
            </span>
          </div>
        ) : (
          <Select
            value={value.projectKey || ""}
            onValueChange={(v) => {
              updateField("projectKey", v);
              updateField("issueTypeId", ""); // Reset issue type
            }}
            disabled={
              !value.connectionId || projects.length === 0 || isSubmitting
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  value.connectionId
                    ? projects.length === 0
                      ? "No projects available"
                      : "Select a project"
                    : "Select a connection first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {projects.map((proj) => (
                <SelectItem key={proj.key} value={proj.key}>
                  {proj.name} ({proj.key})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Issue Type Selection */}
      <div className="space-y-2">
        <Label>Issue Type *</Label>
        {loadingIssueTypes ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading issue types...
            </span>
          </div>
        ) : (
          <Select
            value={value.issueTypeId || ""}
            onValueChange={(v) => updateField("issueTypeId", v)}
            disabled={
              !value.projectKey || issueTypes.length === 0 || isSubmitting
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  value.projectKey
                    ? issueTypes.length === 0
                      ? "No issue types available"
                      : "Select an issue type"
                    : "Select a project first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {issueTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Priority Selection (optional) */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <p className="text-sm text-muted-foreground">
          Optional - leave empty to use project default
        </p>
        {loadingPriorities ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading priorities...
            </span>
          </div>
        ) : (
          <Select
            value={value.priorityId || ""}
            onValueChange={(v) => updateField("priorityId", v || undefined)}
            disabled={!value.connectionId || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a priority (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (use default)</SelectItem>
              {priorities.map((prio) => (
                <SelectItem key={prio.id} value={prio.id}>
                  {prio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Template */}
      <div className="space-y-2">
        <Label htmlFor="summaryTemplate">Summary Template *</Label>
        <p className="text-sm text-muted-foreground">
          Use {"{{payload.field}}"} syntax for dynamic values
        </p>
        <Input
          id="summaryTemplate"
          value={value.summaryTemplate || ""}
          onChange={(e) => updateField("summaryTemplate", e.target.value)}
          placeholder="e.g., Alert: {{payload.title}}"
          disabled={isSubmitting}
        />
      </div>

      {/* Description Template */}
      <div className="space-y-2">
        <Label htmlFor="descriptionTemplate">Description Template</Label>
        <p className="text-sm text-muted-foreground">
          Optional - leave empty for no description
        </p>
        <Textarea
          id="descriptionTemplate"
          value={value.descriptionTemplate || ""}
          onChange={(e) =>
            updateField("descriptionTemplate", e.target.value || undefined)
          }
          placeholder="e.g., Event Details:\n\n{{payload.description}}\n\nSystem: {{payload.system.name}}"
          rows={5}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};
