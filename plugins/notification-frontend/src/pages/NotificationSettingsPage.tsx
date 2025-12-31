import { useState, useEffect, useCallback } from "react";
import { Bell, Clock } from "lucide-react";
import {
  PageLayout,
  Card,
  Button,
  Toggle,
  useToast,
  SectionHeader,
  DynamicForm,
} from "@checkmate/ui";
import { useApi, rpcApiRef } from "@checkmate/frontend-api";
import type {
  NotificationGroup,
  NotificationSubscription,
  NotificationClient,
} from "@checkmate/notification-common";

export const NotificationSettingsPage = () => {
  const rpcApi = useApi(rpcApiRef);
  const notificationClient = rpcApi.forPlugin<NotificationClient>(
    "notification-backend"
  );
  const toast = useToast();

  // Retention settings state
  const [retentionSchema, setRetentionSchema] = useState<
    Record<string, unknown> | undefined
  >();
  const [retentionSettings, setRetentionSettings] = useState<
    Record<string, unknown>
  >({
    retentionDays: 30,
    enabled: false,
  });
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [retentionSaving, setRetentionSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscription state
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    NotificationSubscription[]
  >([]);
  const [subsLoading, setSubsLoading] = useState(true);

  // Fetch retention settings and schema (admin only)
  const fetchRetentionData = useCallback(async () => {
    try {
      const [schema, settings] = await Promise.all([
        notificationClient.getRetentionSchema(),
        notificationClient.getRetentionSettings(),
      ]);
      setRetentionSchema(schema as Record<string, unknown>);
      setRetentionSettings(settings);
      setIsAdmin(true); // If fetch succeeds, user has admin access
    } catch {
      // User might not have admin permission - that's okay
      setIsAdmin(false);
    } finally {
      setRetentionLoading(false);
    }
  }, [notificationClient]);

  // Fetch groups and subscriptions
  const fetchSubscriptionData = useCallback(async () => {
    try {
      const [groupsData, subsData] = await Promise.all([
        notificationClient.getGroups(),
        notificationClient.getSubscriptions(),
      ]);
      setGroups(groupsData);
      setSubscriptions(subsData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch subscription data";
      toast.error(message);
    } finally {
      setSubsLoading(false);
    }
  }, [notificationClient, toast]);

  useEffect(() => {
    void fetchRetentionData();
    void fetchSubscriptionData();
  }, [fetchRetentionData, fetchSubscriptionData]);

  const handleSaveRetention = async () => {
    try {
      setRetentionSaving(true);
      await notificationClient.setRetentionSettings(
        retentionSettings as { enabled: boolean; retentionDays: number }
      );
      toast.success("Retention settings saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setRetentionSaving(false);
    }
  };

  const handleSubscribe = async (groupId: string) => {
    try {
      await notificationClient.subscribe({ groupId });
      setSubscriptions((prev) => [
        ...prev,
        { userId: "", groupId, subscribedAt: new Date() },
      ]);
      toast.success("Subscribed to group");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to subscribe";
      toast.error(message);
    }
  };

  const handleUnsubscribe = async (groupId: string) => {
    try {
      await notificationClient.unsubscribe({ groupId });
      setSubscriptions((prev) => prev.filter((s) => s.groupId !== groupId));
      toast.success("Unsubscribed from group");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unsubscribe";
      toast.error(message);
    }
  };

  const isSubscribed = (groupId: string) =>
    subscriptions.some((s) => s.groupId === groupId);

  return (
    <PageLayout title="Notification Settings" loading={subsLoading}>
      <div className="space-y-8">
        {/* Subscription Management - Available to all users */}
        <section>
          <SectionHeader
            title="Notification Groups"
            description="Subscribe to notification groups to receive updates"
            icon={<Bell className="h-5 w-5" />}
          />
          <Card className="p-4">
            {groups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No notification groups available
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {group.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        From: {group.ownerPlugin}
                      </div>
                    </div>
                    <Toggle
                      checked={isSubscribed(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          void handleSubscribe(group.id);
                        } else {
                          void handleUnsubscribe(group.id);
                        }
                      }}
                      aria-label={`Subscribe to ${group.name}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Retention Policy - Admin only */}
        {isAdmin && retentionSchema && (
          <section>
            <SectionHeader
              title="Retention Policy"
              description="Configure how long notifications are kept (admin only)"
              icon={<Clock className="h-5 w-5" />}
            />
            <Card className="p-4">
              {retentionLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  <DynamicForm
                    schema={retentionSchema}
                    value={retentionSettings}
                    onChange={setRetentionSettings}
                  />
                  <Button
                    onClick={() => {
                      void handleSaveRetention();
                    }}
                    disabled={retentionSaving}
                  >
                    {retentionSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              )}
            </Card>
          </section>
        )}
      </div>
    </PageLayout>
  );
};
