import React, { useState, useMemo } from "react";
import { subDays, subHours, startOfDay } from "date-fns";
import { DateTimePicker } from "./DateTimePicker";
import { Button } from "./Button";
import { Calendar } from "lucide-react";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export enum DateRangePreset {
  Last24Hours = "24h",
  Last7Days = "7d",
  Last30Days = "30d",
  Custom = "custom",
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PRESETS: Array<{ id: DateRangePreset; label: string }> = [
  { id: DateRangePreset.Last24Hours, label: "Last 24h" },
  { id: DateRangePreset.Last7Days, label: "Last 7 days" },
  { id: DateRangePreset.Last30Days, label: "Last 30 days" },
  { id: DateRangePreset.Custom, label: "Custom" },
];

export function getPresetRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case DateRangePreset.Last24Hours: {
      return { startDate: subHours(now, 24), endDate: now };
    }
    case DateRangePreset.Last7Days: {
      return { startDate: startOfDay(subDays(now, 7)), endDate: now };
    }
    case DateRangePreset.Last30Days: {
      return { startDate: startOfDay(subDays(now, 30)), endDate: now };
    }
    case DateRangePreset.Custom: {
      return { startDate: startOfDay(subDays(now, 7)), endDate: now };
    }
  }
}

function detectPreset(range: DateRange): DateRangePreset {
  const now = new Date();
  const diffMs = now.getTime() - range.startDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours <= 25 && diffHours >= 23) return DateRangePreset.Last24Hours;
  if (diffDays <= 8 && diffDays >= 6) return DateRangePreset.Last7Days;
  if (diffDays <= 31 && diffDays >= 29) return DateRangePreset.Last30Days;
  return DateRangePreset.Custom;
}

/**
 * Date range filter with preset buttons and custom date pickers.
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  className,
}) => {
  const activePreset = useMemo(() => detectPreset(value), [value]);
  const [showCustom, setShowCustom] = useState(
    activePreset === DateRangePreset.Custom,
  );

  const handlePresetClick = (preset: DateRangePreset) => {
    if (preset === DateRangePreset.Custom) {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onChange(getPresetRange(preset));
    }
  };

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Time range:
        </span>
        <div className="flex gap-1">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={
                activePreset === preset.id && !showCustom
                  ? "primary"
                  : preset.id === DateRangePreset.Custom && showCustom
                    ? "primary"
                    : "outline"
              }
              size="sm"
              onClick={() => handlePresetClick(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">From:</span>
          <DateTimePicker
            value={value.startDate}
            onChange={(startDate) => {
              if (startDate) {
                onChange({ ...value, startDate });
              }
            }}
            maxDate={value.endDate}
          />
          <span className="text-sm text-muted-foreground">To:</span>
          <DateTimePicker
            value={value.endDate}
            onChange={(endDate) => {
              if (endDate) {
                onChange({ ...value, endDate });
              }
            }}
            minDate={value.startDate}
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  );
};

/** Create a default date range (last 7 days) */
export function getDefaultDateRange(): DateRange {
  return getPresetRange(DateRangePreset.Last7Days);
}
