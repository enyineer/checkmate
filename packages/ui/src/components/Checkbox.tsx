import React from "react";
import { Check } from "lucide-react";
import { cn } from "../utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  className,
  checked,
  onCheckedChange,
  ...props
}) => {
  // Compute styles to avoid nested ternary
  const getBackgroundStyles = () => {
    if (props.disabled) {
      return "bg-muted border-border cursor-not-allowed";
    }
    if (checked) {
      return "bg-primary border-primary cursor-pointer";
    }
    return "bg-background border-input cursor-pointer";
  };

  return (
    <div
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center transition-colors",
        getBackgroundStyles(),
        className
      )}
      onClick={() => !props.disabled && onCheckedChange?.(!checked)}
    >
      {checked && (
        <Check
          className={cn(
            "h-3 w-3",
            props.disabled ? "text-muted-foreground" : "text-primary-foreground"
          )}
          strokeWidth={3}
        />
      )}
    </div>
  );
};
