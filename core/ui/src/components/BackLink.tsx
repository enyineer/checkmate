import React from "react";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  /** The destination to navigate to. Can be a path string or onClick handler. */
  to?: string;
  /** Click handler for navigation. If not provided with 'to', component will render a button. */
  onClick?: () => void;
  /** The text to display. Defaults to "Back" */
  children?: React.ReactNode;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * A standardized back navigation link component.
 * Use with react-router's Link by wrapping it in your own Link component
 * or pass an onClick handler for programmatic navigation.
 */
export const BackLink: React.FC<BackLinkProps> = ({
  to,
  onClick,
  children = "Back",
  className = "",
}) => {
  const baseClasses =
    "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors";

  // If 'to' is provided, render an anchor-like element that can be wrapped by Link
  // Otherwise render a button with onClick
  if (to) {
    return (
      <a
        href={to}
        onClick={(e) => {
          // Let react-router handle actual navigation if this is wrapped in Link
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${baseClasses} ${className}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`}>
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  );
};
