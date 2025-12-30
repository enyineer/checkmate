import React from "react";
import { cn } from "../utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  description?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  description,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex items-center gap-2 mb-6", className)} {...props}>
      {icon && <div className="text-primary">{icon}</div>}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
