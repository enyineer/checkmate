import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./Card";
import { cn } from "../utils";

interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  variant?: "default" | "gradient";
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = "default",
  className,
  ...props
}) => {
  const isGradient = variant === "gradient";

  return (
    <Card
      className={cn(
        "border-none shadow-sm transition-all duration-200",
        isGradient
          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md active:scale-[0.98]"
          : "bg-white hover:border-gray-200",
        className
      )}
      {...props}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "text-lg font-medium",
            isGradient ? "opacity-90 text-white" : "text-gray-700"
          )}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-2xl font-semibold",
              isGradient ? "text-3xl font-bold" : "text-gray-900"
            )}
          >
            {value}
          </span>
          {icon && (
            <div className={cn(isGradient ? "text-white" : "text-gray-400")}>
              {icon}
            </div>
          )}
        </div>
        {description && (
          <p
            className={cn(
              "mt-1 text-sm",
              isGradient ? "opacity-80" : "text-gray-500"
            )}
          >
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
