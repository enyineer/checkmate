import { oc } from "@orpc/contract";
import type { ContractRouterClient } from "@orpc/contract";
import { z } from "zod";
import { permissions } from "./permissions";
import {
  NotificationSchema,
  NotificationGroupSchema,
  NotificationSubscriptionSchema,
  RetentionSettingsSchema,
  PaginationInputSchema,
} from "./schemas";

// Permission metadata type
export interface NotificationMetadata {
  permissions?: string[];
}

// Base builder with metadata support
const _base = oc.$meta<NotificationMetadata>({});

// Notification RPC Contract
export const notificationContract = {
  // --- User Notification Endpoints ---

  // Get current user's notifications (paginated)
  getNotifications: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .input(PaginationInputSchema)
    .output(
      z.object({
        notifications: z.array(NotificationSchema),
        total: z.number(),
      })
    ),

  // Get unread count for badge
  getUnreadCount: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .output(z.object({ count: z.number() })),

  // Mark notification(s) as read
  markAsRead: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .input(
      z.object({
        notificationId: z.string().uuid().optional(), // If not provided, mark all as read
      })
    )
    .output(z.void()),

  // Delete a notification
  deleteNotification: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .input(z.object({ notificationId: z.string().uuid() }))
    .output(z.void()),

  // --- Group & Subscription Endpoints ---

  // Get all available notification groups
  getGroups: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .output(z.array(NotificationGroupSchema)),

  // Get current user's subscriptions
  getSubscriptions: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .output(z.array(NotificationSubscriptionSchema)),

  // Subscribe to a notification group (any authenticated user)
  subscribe: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .input(z.object({ groupId: z.string() }))
    .output(z.void()),

  // Unsubscribe from a notification group (any authenticated user)
  unsubscribe: _base
    .meta({ permissions: [permissions.notificationRead.id] })
    .input(z.object({ groupId: z.string() }))
    .output(z.void()),

  // --- Admin Settings Endpoints ---

  // Get retention schema for DynamicForm
  getRetentionSchema: _base
    .meta({ permissions: [permissions.notificationAdmin.id] })
    .output(z.record(z.string(), z.unknown())),

  // Get retention settings
  getRetentionSettings: _base
    .meta({ permissions: [permissions.notificationAdmin.id] })
    .output(RetentionSettingsSchema),

  // Update retention settings
  setRetentionSettings: _base
    .meta({ permissions: [permissions.notificationAdmin.id] })
    .input(RetentionSettingsSchema)
    .output(z.void()),
};

// Export contract type for frontend
export type NotificationContract = typeof notificationContract;

// Export typed client for frontend/backend communication
export type NotificationClient = ContractRouterClient<
  typeof notificationContract
>;
