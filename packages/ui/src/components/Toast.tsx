import React, { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../utils";

const toastVariants = cva(
  "relative flex items-start gap-3 w-full max-w-md rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-card-foreground",
        success: "bg-success/10 border-success/30 text-success-foreground",
        error:
          "bg-destructive/10 border-destructive/30 text-destructive-foreground",
        warning: "bg-warning/10 border-warning/30 text-warning-foreground",
        info: "bg-info/10 border-info/30 text-info-foreground",
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
  default: "text-foreground",
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
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
        "animate-in slide-in-from-right fade-in duration-300"
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
