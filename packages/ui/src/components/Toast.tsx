import React, { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../utils";

const toastVariants = cva(
  "relative flex items-start gap-3 w-full max-w-md rounded-lg border-2 p-4 shadow-xl transition-all backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-card-foreground shadow-card/50",
        success:
          "bg-success border-success text-success-foreground shadow-success/30",
        error:
          "bg-destructive border-destructive text-destructive-foreground shadow-destructive/30",
        warning:
          "bg-warning border-warning text-warning-foreground shadow-warning/30",
        info: "bg-info border-info text-info-foreground shadow-info/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap = {
  default: "text-card-foreground",
  success: "text-success-foreground",
  error: "text-destructive-foreground",
  warning: "text-warning-foreground",
  info: "text-info-foreground",
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = "default",
  duration = 4000,
  onDismiss,
}) => {
  const Icon = iconMap[variant || "default"];
  const iconColor = iconColorMap[variant || "default"];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div
      className={cn(
        toastVariants({ variant }),
        "animate-in slide-in-from-right fade-in zoom-in-95 duration-300"
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
