import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../utils";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Page = React.forwardRef<HTMLDivElement, PageProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col w-full h-full", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Page.displayName = "Page";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, icon: Icon, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col md:flex-row items-center justify-between py-3 pb-2 md:py-6 md:pb-2",
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  ),
);
PageHeader.displayName = "PageHeader";

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContent = React.forwardRef<HTMLDivElement, PageContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex-1 py-3 pt-2 md:py-6 md:pt-2", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
PageContent.displayName = "PageContent";
