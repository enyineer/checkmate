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
      {icon && <div className="text-indigo-500">{icon}</div>}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-800">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};
