import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva("relative w-full rounded-md border p-4", {
  variants: {
    variant: {
      default: "bg-muted/50 border-border text-foreground",
      success: "bg-success/10 border-success/30 text-success-foreground",
      warning: "bg-warning/10 border-warning/30 text-warning-foreground",
      error:
        "bg-destructive/10 border-destructive/30 text-destructive-foreground",
      info: "bg-info/10 border-info/30 text-info-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  children: React.ReactNode;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={alertVariants({ variant, className })}
        {...props}
      >
        <div className="flex gap-3">{children}</div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={`font-semibold text-sm ${className || ""}`}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`text-sm mt-1 ${className || ""}`} {...props} />
));

AlertDescription.displayName = "AlertDescription";
