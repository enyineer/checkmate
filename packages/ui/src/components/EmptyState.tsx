import React from "react";
import { Card, CardContent } from "./Card";
import { cn } from "../utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  className,
  ...props
}) => {
  return (
    <Card
      className={cn("border-dashed border-2 bg-gray-50/50", className)}
      {...props}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && <div className="text-gray-300 mb-4">{icon}</div>}
        <p className="text-gray-500 font-medium">{title}</p>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
