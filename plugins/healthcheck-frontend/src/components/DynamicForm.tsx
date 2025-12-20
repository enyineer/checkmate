import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@checkmate/ui";

interface DynamicFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
}

const JsonField: React.FC<{
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (val: any) => void;
}> = ({ id, value, onChange }) => {
  const [internalValue, setInternalValue] = React.useState(
    JSON.stringify(value || {}, undefined, 2)
  );

  // Sync internal value when external value changes (e.g. strategy change)
  React.useEffect(() => {
    try {
      const currentParsed = JSON.parse(internalValue);
      if (JSON.stringify(currentParsed) !== JSON.stringify(value)) {
        setInternalValue(JSON.stringify(value || {}, undefined, 2));
      }
    } catch {
      setInternalValue(JSON.stringify(value || {}, undefined, 2));
    }
  }, [value]);

  return (
    <Textarea
      id={id}
      rows={4}
      value={internalValue}
      onChange={(e) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        try {
          const parsed = JSON.parse(newValue);
          onChange(parsed);
        } catch {
          // Keep internal state but don't propagate invalid JSON
        }
      }}
    />
  );
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  value,
  onChange,
}) => {
  if (!schema || !schema.properties) return <></>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (key: string, val: any) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ([key, propSchema]: [string, any]) => {
          const isRequired = schema.required?.includes(key);
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          const description = propSchema.description || "";

          // Enum handling
          if (propSchema.enum) {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {label} {isRequired && "*"}
                </Label>
                <div className="relative">
                  <Select
                    value={value[key] || propSchema.default}
                    onValueChange={(val) => handleChange(key, val)}
                  >
                    <SelectTrigger id={key}>
                      <SelectValue placeholder={`Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {propSchema.enum.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            );
          }

          // String
          if (propSchema.type === "string") {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {label} {isRequired && "*"}
                </Label>
                <Input
                  id={key}
                  value={value[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={
                    propSchema.default ? `Default: ${propSchema.default}` : ""
                  }
                />
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            );
          }

          // Number
          if (propSchema.type === "number" || propSchema.type === "integer") {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {label} {isRequired && "*"}
                </Label>
                <Input
                  id={key}
                  type="number"
                  value={value[key] || propSchema.default || ""}
                  onChange={(e) =>
                    handleChange(
                      key,
                      propSchema.type === "integer"
                        ? Number.parseInt(e.target.value, 10)
                        : Number.parseFloat(e.target.value)
                    )
                  }
                />
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            );
          }

          // Dictionary/Record (headers) - Fixed with local state string
          if (propSchema.type === "object" && propSchema.additionalProperties) {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {label} (JSON) {isRequired && "*"}
                </Label>
                <JsonField
                  id={key}
                  value={value[key]}
                  onChange={(val) => handleChange(key, val)}
                />
                <p className="text-xs text-muted-foreground">
                  Complex configuration object.
                </p>
              </div>
            );
          }

          return;
        }
      )}
    </div>
  );
};
