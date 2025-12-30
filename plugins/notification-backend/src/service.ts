import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, count, desc, lt } from "drizzle-orm";
import type {
  NotificationAction,
  Importance,
  RetentionSettings,
} from "@checkmate/notification-common";
import * as schema from "./schema";

export interface NotifyUserOptions {
  userId: string;
  title: string;
  description: string;
  actions?: NotificationAction[];
  importance?: Importance;
}

export interface NotifyGroupOptions {
  groupName: string;
  title: string;
  description: string;
  actions?: NotificationAction[];
  importance?: Importance;
}

export interface CreateGroupOptions {
  groupId: string;
  name: string;
  description: string;
}

/**
 * Scoped NotificationService - each plugin gets an instance prefixed with its pluginId
 */
export class NotificationService {
  constructor(
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly pluginId: string
  ) {}

  /**
   * Get the namespaced group ID for this plugin
   */
  private getNamespacedGroupId(groupName: string): string {
    return `${this.pluginId}.${groupName}`;
  }

  /**
   * Send notification to a single user
   */
  async notifyUser(options: NotifyUserOptions): Promise<string> {
    const {
      userId,
      title,
      description,
      actions,
      importance = "info",
    } = options;

    const result = await this.db
      .insert(schema.notifications)
      .values({
        userId,
        title,
        description,
        actions,
        importance,
      })
      .returning({ id: schema.notifications.id });

    return result[0].id;
  }

  /**
   * Send notification to all subscribers of a group.
   * Group name is auto-prefixed with plugin namespace.
   */
  async notifyGroup(options: NotifyGroupOptions): Promise<number> {
    const {
      groupName,
      title,
      description,
      actions,
      importance = "info",
    } = options;

    const groupId = this.getNamespacedGroupId(groupName);

    // Get all subscribers for this group
    const subscribers = await this.db
      .select({ userId: schema.notificationSubscriptions.userId })
      .from(schema.notificationSubscriptions)
      .where(eq(schema.notificationSubscriptions.groupId, groupId));

    if (subscribers.length === 0) {
      return 0;
    }

    // Create a notification for each subscriber
    const notificationValues = subscribers.map((sub) => ({
      userId: sub.userId,
      title,
      description,
      actions,
      importance,
      groupId,
    }));

    await this.db.insert(schema.notifications).values(notificationValues);

    return subscribers.length;
  }

  /**
   * Broadcast notification to ALL users.
   * This requires fetching all user IDs - typically done via auth-backend RPC.
   * For now, accepts a list of user IDs to notify.
   */
  async broadcast(
    userIds: string[],
    options: Omit<NotifyUserOptions, "userId">
  ): Promise<number> {
    const { title, description, actions, importance = "info" } = options;

    if (userIds.length === 0) {
      return 0;
    }

    const notificationValues = userIds.map((userId) => ({
      userId,
      title,
      description,
      actions,
      importance,
    }));

    await this.db.insert(schema.notifications).values(notificationValues);

    return userIds.length;
  }

  /**
   * Create a notification group.
   * The groupId is auto-prefixed with plugin namespace.
   */
  async createGroup(options: CreateGroupOptions): Promise<string> {
    const { groupId, name, description } = options;
    const namespacedId = this.getNamespacedGroupId(groupId);

    await this.db
      .insert(schema.notificationGroups)
      .values({
        id: namespacedId,
        name,
        description,
        ownerPlugin: this.pluginId,
      })
      .onConflictDoUpdate({
        target: [schema.notificationGroups.id],
        set: {
          name,
          description,
        },
      });

    return namespacedId;
  }

  /**
   * Delete a notification group (only groups owned by this plugin)
   */
  async deleteGroup(groupName: string): Promise<boolean> {
    const groupId = this.getNamespacedGroupId(groupName);

    const result = await this.db
      .delete(schema.notificationGroups)
      .where(
        and(
          eq(schema.notificationGroups.id, groupId),
          eq(schema.notificationGroups.ownerPlugin, this.pluginId)
        )
      )
      .returning({ id: schema.notificationGroups.id });

    return result.length > 0;
  }

  /**
   * Get all subscribers for a group (only groups owned by this plugin)
   */
  async getGroupSubscribers(groupName: string): Promise<string[]> {
    const groupId = this.getNamespacedGroupId(groupName);

    // Verify the group is owned by this plugin
    const group = await this.db
      .select({ id: schema.notificationGroups.id })
      .from(schema.notificationGroups)
      .where(
        and(
          eq(schema.notificationGroups.id, groupId),
          eq(schema.notificationGroups.ownerPlugin, this.pluginId)
        )
      )
      .limit(1);

    if (group.length === 0) {
      return [];
    }

    const subscribers = await this.db
      .select({ userId: schema.notificationSubscriptions.userId })
      .from(schema.notificationSubscriptions)
      .where(eq(schema.notificationSubscriptions.groupId, groupId));

    return subscribers.map((s) => s.userId);
  }
}

/**
 * Factory function to create a scoped NotificationService for a plugin
 */
export function createNotificationService(
  db: NodePgDatabase<typeof schema>,
  pluginId: string
): NotificationService {
  return new NotificationService(db, pluginId);
}

// --- Internal service functions for router (not namespaced) ---

/**
 * Get notifications for a user (for router use)
 */
export async function getUserNotifications(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  options: { limit: number; offset: number; unreadOnly: boolean }
): Promise<{
  notifications: (typeof schema.notifications.$inferSelect)[];
  total: number;
}> {
  const conditions = [eq(schema.notifications.userId, userId)];

  if (options.unreadOnly) {
    conditions.push(eq(schema.notifications.isRead, false));
  }

  const whereClause = and(...conditions);

  const [notificationsResult, countResult] = await Promise.all([
    db
      .select()
      .from(schema.notifications)
      .where(whereClause)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(options.limit)
      .offset(options.offset),
    db.select({ count: count() }).from(schema.notifications).where(whereClause),
  ]);

  return {
    notifications: notificationsResult,
    total: countResult[0]?.count ?? 0,
  };
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(
  db: NodePgDatabase<typeof schema>,
  userId: string
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Mark notification(s) as read
 */
export async function markAsRead(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  notificationId?: string
): Promise<void> {
  const whereClause = notificationId
    ? and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      )
    : eq(schema.notifications.userId, userId);

  await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(whereClause);
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  notificationId: string
): Promise<void> {
  await db
    .delete(schema.notifications)
    .where(
      and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      )
    );
}

/**
 * Get all notification groups
 */
export async function getAllGroups(
  db: NodePgDatabase<typeof schema>
): Promise<(typeof schema.notificationGroups.$inferSelect)[]> {
  return db.select().from(schema.notificationGroups);
}

/**
 * Get user's subscriptions
 */
export async function getUserSubscriptions(
  db: NodePgDatabase<typeof schema>,
  userId: string
): Promise<(typeof schema.notificationSubscriptions.$inferSelect)[]> {
  return db
    .select()
    .from(schema.notificationSubscriptions)
    .where(eq(schema.notificationSubscriptions.userId, userId));
}

/**
 * Subscribe user to a group
 */
export async function subscribeToGroup(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  groupId: string
): Promise<void> {
  await db
    .insert(schema.notificationSubscriptions)
    .values({
      userId,
      groupId,
    })
    .onConflictDoNothing();
}

/**
 * Unsubscribe user from a group
 */
export async function unsubscribeFromGroup(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  groupId: string
): Promise<void> {
  await db
    .delete(schema.notificationSubscriptions)
    .where(
      and(
        eq(schema.notificationSubscriptions.userId, userId),
        eq(schema.notificationSubscriptions.groupId, groupId)
      )
    );
}

/**
 * Get retention settings
 */
export async function getRetentionSettings(
  db: NodePgDatabase<typeof schema>
): Promise<RetentionSettings> {
  const result = await db
    .select({ value: schema.notificationSettings.value })
    .from(schema.notificationSettings)
    .where(eq(schema.notificationSettings.id, "retention"))
    .limit(1);

  if (result.length === 0) {
    // Default settings
    return { retentionDays: 30, enabled: false };
  }

  return result[0].value as RetentionSettings;
}

/**
 * Set retention settings
 */
export async function setRetentionSettings(
  db: NodePgDatabase<typeof schema>,
  settings: RetentionSettings
): Promise<void> {
  await db
    .insert(schema.notificationSettings)
    .values({
      id: "retention",
      value: settings,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.notificationSettings.id],
      set: {
        value: settings,
        updatedAt: new Date(),
      },
    });
}

/**
 * Purge old notifications based on retention policy
 */
export async function purgeOldNotifications(
  db: NodePgDatabase<typeof schema>
): Promise<number> {
  const settings = await getRetentionSettings(db);

  if (!settings.enabled) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays);

  const result = await db
    .delete(schema.notifications)
    .where(lt(schema.notifications.createdAt, cutoffDate))
    .returning({ id: schema.notifications.id });

  return result.length;
}
