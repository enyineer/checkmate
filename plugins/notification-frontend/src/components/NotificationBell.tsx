import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Button,
} from "@checkmate/ui";
import { useApi, rpcApiRef } from "@checkmate/frontend-api";
import type {
  Notification,
  NotificationClient,
} from "@checkmate/notification-common";

const POLLING_INTERVAL_MS = 60_000; // 1 minute

export const NotificationBell = () => {
  const rpcApi = useApi(rpcApiRef);
  const notificationClient = rpcApi.forPlugin<NotificationClient>(
    "notification-backend"
  );

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<
    Notification[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationClient.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [notificationClient]);

  const fetchRecentNotifications = useCallback(async () => {
    try {
      const { notifications } = await notificationClient.getNotifications({
        limit: 5,
        offset: 0,
        unreadOnly: false,
      });
      setRecentNotifications(notifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [notificationClient]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchUnreadCount(), fetchRecentNotifications()]);
      setLoading(false);
    };
    void init();
  }, [fetchUnreadCount, fetchRecentNotifications]);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, POLLING_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      void fetchRecentNotifications();
    }
  }, [isOpen, fetchRecentNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await notificationClient.markAsRead({});
      setUnreadCount(0);
      setRecentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getImportanceColor = (importance: Notification["importance"]) => {
    switch (importance) {
      case "critical": {
        return "text-destructive";
      }
      case "warning": {
        return "text-warning-foreground";
      }
      default: {
        return "text-foreground";
      }
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        isOpen={isOpen}
        onClose={handleClose}
        className="w-80"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                void handleMarkAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </div>

        {recentNotifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 px-3 py-2 cursor-pointer ${
                  notification.isRead ? "" : "bg-muted/50"
                }`}
              >
                <div
                  className={`font-medium text-sm ${getImportanceColor(
                    notification.importance
                  )}`}
                >
                  {notification.title}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {notification.description}
                </div>
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {notification.actions.slice(0, 2).map((action, idx) => (
                      <Link
                        key={idx}
                        to={action.href}
                        className={`text-xs ${
                          action.variant === "destructive"
                            ? "text-destructive"
                            : "text-primary"
                        } hover:underline`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                        }}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            handleClose();
          }}
        >
          <Link
            to="/notifications"
            className="w-full text-center text-sm text-primary"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
