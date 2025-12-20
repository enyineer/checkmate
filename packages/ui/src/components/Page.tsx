import React from "react";
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
  )
);
Page.displayName = "Page";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col md:flex-row items-center justify-between p-6 pb-2",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  )
);
PageHeader.displayName = "PageHeader";

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContent = React.forwardRef<HTMLDivElement, PageContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 p-6 pt-2", className)} {...props}>
      {children}
    </div>
  )
);
PageContent.displayName = "PageContent";
