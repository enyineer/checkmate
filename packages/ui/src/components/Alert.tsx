import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva("relative w-full rounded-md border p-4", {
  variants: {
    variant: {
      default: "bg-gray-50 border-gray-200 text-gray-900",
      success: "bg-green-50 border-green-200 text-green-900",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
      error: "bg-red-50 border-red-200 text-red-900",
      info: "bg-blue-50 border-blue-200 text-blue-900",
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
