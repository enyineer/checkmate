import React, { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../utils";

const toastVariants = cva(
  "relative flex items-start gap-3 w-full max-w-md rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 text-gray-900",
        success: "bg-green-50 border-green-200 text-green-900",
        error: "bg-red-50 border-red-200 text-red-900",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
        info: "bg-blue-50 border-blue-200 text-blue-900",
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
  default: "text-gray-600",
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
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
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
