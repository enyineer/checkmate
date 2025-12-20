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
  return (
    <div
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-indigo-200 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors",
        checked ? "bg-indigo-600 border-indigo-600" : "bg-white",
        className
      )}
      onClick={() => !props.disabled && onCheckedChange?.(!checked)}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </div>
  );
};
