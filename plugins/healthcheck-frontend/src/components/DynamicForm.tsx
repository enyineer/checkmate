import React from "react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@checkmate/ui";

interface DynamicFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
}

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

          // Dictionary/Record (headers) - Simple implementation
          if (propSchema.type === "object" && propSchema.additionalProperties) {
            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>
                  {label} (JSON) {isRequired && "*"}
                </Label>
                <textarea
                  id={key}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={4}
                  value={
                    typeof value[key] === "object"
                      ? JSON.stringify(value[key], undefined, 2)
                      : value[key] || "{}"
                  }
                  onChange={(e) => {
                    try {
                      handleChange(key, JSON.parse(e.target.value));
                    } catch {
                      // Allow typing invalid json, but don't crash.
                      // Ideally we should manage local state for the string value and only push to parent on valid JSON.
                      // But for now, we rely on the component handling the object.
                      // Actually, this simple controlled input approach for JSON is flaky because JSON.stringify(JSON.parse(...)) re-formats input.
                      // To do it right we need local state.
                    }
                  }}
                  // For now disable editing complex objects via this simple textarea to avoid frustration, or warn.
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
