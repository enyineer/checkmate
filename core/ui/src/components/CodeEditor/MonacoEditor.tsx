import React from "react";
import Editor, {
  loader,
  type OnMount,
  type Monaco,
} from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";
import { detectOpenTemplate, detectAutoClosedBraces } from "./templateUtils";

// Configure Monaco to use self-hosted files (for air-gapped environments)
// The @monaco-editor/react package will load from node_modules by default
loader.config({
  "vs/nls": { availableLanguages: { "*": "en" } },
});

export type CodeEditorLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "markdown"
  | "javascript"
  | "typescript"
  | "shell";

/**
 * A single payload property available for templating
 */
export interface TemplateProperty {
  /** Full path to the property, e.g., "payload.incident.title" */
  path: string;
  /** Type of the property, e.g., "string", "number", "boolean" */
  type: string;
  /** Optional description of the property */
  description?: string;
}

export interface CodeEditorProps {
  /** Unique identifier for the editor */
  id?: string;
  /** Current value of the editor */
  value: string;
  /** Callback when the value changes */
  onChange: (value: string) => void;
  /** Language for syntax highlighting */
  language?: CodeEditorLanguage;
  /** Minimum height of the editor */
  minHeight?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /**
   * TypeScript type definitions to inject for IntelliSense.
   * Generated from JSON schemas for context-aware autocomplete.
   */
  typeDefinitions?: string;
  /**
   * Optional template properties for autocomplete.
   * When provided, typing "{{" triggers autocomplete with available template variables.
   */
  templateProperties?: TemplateProperty[];
}

// Map language names to Monaco language IDs
const languageMap: Record<string, string> = {
  json: "json",
  yaml: "yaml",
  xml: "xml",
  markdown: "markdown",
  javascript: "javascript",
  typescript: "typescript",
  shell: "shell",
};

// Track if we've registered the json-template language
let jsonTemplateLanguageRegistered = false;

/**
 * Default type definitions for backend TypeScript/JavaScript editors.
 * Provides console and fetch APIs without DOM types.
 * Used when no custom typeDefinitions are provided to the editor.
 */
const DEFAULT_BACKEND_TYPE_DEFINITIONS = `
/** Expected return type for healthcheck scripts */
interface HealthCheckScriptResult {
  /** Whether the health check passed */
  success: boolean;
  /** Optional status message */
  message?: string;
  /** Optional numeric value for metrics */
  value?: number;
}

/** Console for logging */
declare const console: {
  /** Log an info message */
  log(...args: unknown[]): void;
  /** Log a warning message */
  warn(...args: unknown[]): void;
  /** Log an error message */
  error(...args: unknown[]): void;
  /** Log an info message */
  info(...args: unknown[]): void;
};

/** HTTP Request configuration */
interface RequestInit {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: string | FormData | URLSearchParams;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache';
  redirect?: 'follow' | 'error' | 'manual';
  signal?: AbortSignal;
}

/** HTTP Response */
interface Response {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly redirected: boolean;
  json(): Promise<unknown>;
  text(): Promise<string>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
  clone(): Response;
}

/** HTTP Headers */
interface Headers {
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
  delete(name: string): void;
  forEach(callback: (value: string, key: string) => void): void;
}

/** Fetch API for making HTTP requests */
declare function fetch(input: string | URL, init?: RequestInit): Promise<Response>;
`;

/**
 * A code editor component with syntax highlighting, IntelliSense, and template autocomplete.
 * Uses Monaco Editor (VS Code's editor) for full TypeScript/JavaScript language support.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  id,
  value,
  onChange,
  language = "json",
  minHeight = "100px",
  readOnly = false,
  placeholder,
  typeDefinitions,
  templateProperties,
}) => {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = React.useRef<Monaco | null>(null);
  const disposablesRef = React.useRef<{ dispose: () => void }[]>([]);
  // Track when editor is mounted to re-trigger useEffects
  const [isEditorMounted, setIsEditorMounted] = React.useState(false);

  // Register json-template language BEFORE editor creates the model
  const handleEditorWillMount = (monaco: Monaco) => {
    if (!jsonTemplateLanguageRegistered) {
      monaco.languages.register({ id: "json-template" });
      // Use JSON syntax highlighting
      monaco.languages.setLanguageConfiguration("json-template", {
        comments: {
          lineComment: "//",
          blockComment: ["/*", "*/"],
        },
        brackets: [
          ["{", "}"],
          ["[", "]"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: '"', close: '"' },
        ],
      });
      // Custom tokenizer that highlights {{...}} templates specially
      monaco.languages.setMonarchTokensProvider("json-template", {
        tokenizer: {
          root: [
            [/\{\{[^}]*\}\}/, "variable"], // Template syntax - highlight specially
            [/"([^"\\]|\\.)*$/, "string.invalid"], // Unterminated string
            [/"/, "string", "@string"],
            [/[{}[\]]/, "delimiter.bracket"],
            [/-?\d+\.?\d*([eE][-+]?\d+)?/, "number"],
            [/true|false/, "keyword"],
            [/null/, "keyword"],
            [/[,:]/, "delimiter"],
            [/\s+/, "white"],
          ],
          string: [
            [/[^\\"]+/, "string"],
            [/\\./, "string.escape"],
            [/"/, "string", "@pop"],
          ],
        },
      });
      jsonTemplateLanguageRegistered = true;
    }
  };

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorMounted(true);

    // Configure TypeScript/JavaScript to exclude DOM types for backend scripts
    // This prevents Web API autocompletions (AudioContext, Canvas, etc.)
    if (language === "typescript" || language === "javascript") {
      const defaults =
        language === "typescript"
          ? monaco.languages.typescript.typescriptDefaults
          : monaco.languages.typescript.javascriptDefaults;

      // Configure compiler options to exclude DOM types but keep ES libs
      // This gives us Promise, Array, etc. but not AudioContext, Canvas, etc.
      defaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        lib: ["esnext"], // Include ES libs but NOT DOM
        allowNonTsExtensions: true,
        noEmit: true,
        strict: true,
      });

      // Suppress certain diagnostics that don't apply to our script context
      // - 1108: "A 'return' statement can only be used within a function body"
      //         Our scripts are wrapped in async function at runtime, so return is valid
      defaults.setDiagnosticsOptions({
        diagnosticCodesToIgnore: [1108],
      });

      // Disable fetching default lib content (prevents DOM types loading)
      defaults.setEagerModelSync(true);

      // Add custom type definitions if provided, otherwise add minimal defaults
      const definitions = typeDefinitions ?? DEFAULT_BACKEND_TYPE_DEFINITIONS;
      const lib = defaults.addExtraLib(definitions, "file:///context.d.ts");
      disposablesRef.current.push(lib);
    }

    // Handle validation for template syntax in JSON
    // Since we're using json-template language (no built-in validation),
    // we run our own validation with preprocessed content.
    if (
      templateProperties &&
      templateProperties.length > 0 &&
      language === "json"
    ) {
      const model = editor.getModel();
      if (model) {
        // Custom validation function
        const runCustomValidation = () => {
          const content = model.getValue();

          // Replace {{...}} templates with valid JSON strings of same length
          // Using same length ensures error positions map correctly
          const preprocessed = content.replaceAll(
            /\{\{[^}]*\}\}/g,
            (match) => `"${"_".repeat(Math.max(0, match.length - 2))}"`,
          );

          // Try to parse the preprocessed JSON
          const markers: editor.IMarkerData[] = [];
          try {
            JSON.parse(preprocessed);
          } catch (error) {
            if (error instanceof SyntaxError) {
              // Extract position from error message (varies by browser)
              const message = error.message;
              // Try to find line/column info - JSON.parse errors are at position
              const posMatch = message.match(/position (\d+)/i);

              if (posMatch) {
                const pos = Number.parseInt(posMatch[1], 10);
                const position = model.getPositionAt(pos);
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  message: message,
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column + 1,
                });
              } else {
                // Fallback: put error at start
                markers.push({
                  severity: monaco.MarkerSeverity.Error,
                  message: message,
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: 1,
                  endColumn: 2,
                });
              }
            }
          }

          monaco.editor.setModelMarkers(model, "json-template", markers);
        };

        // Run validation on content changes
        const contentListener = model.onDidChangeContent(() => {
          runCustomValidation();
        });

        // Run initial validation
        runCustomValidation();

        disposablesRef.current.push(contentListener, {
          dispose: () => {
            // Re-enable Monaco's JSON validation when unmounted
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
              validate: true,
            });
          },
        });
      }
    }
  };

  // Track the template provider separately so we can update it
  const templateProviderRef = React.useRef<{ dispose: () => void } | undefined>(
    undefined,
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      for (const d of disposablesRef.current) {
        d.dispose();
      }
      disposablesRef.current = [];
      if (templateProviderRef.current) {
        templateProviderRef.current.dispose();
      }
    };
  }, []);

  // Update template completion provider when templateProperties changes
  React.useEffect(() => {
    if (!monacoRef.current) return;

    if (templateProviderRef.current) {
      templateProviderRef.current.dispose();
    }

    if (!templateProperties || templateProperties.length === 0) return;

    const monaco = monacoRef.current;

    // Compute effective language - same logic as used for Editor
    const hasTemplates = templateProperties && templateProperties.length > 0;
    const providerLanguage =
      hasTemplates && language === "json"
        ? "json-template"
        : (languageMap[language] ?? language);

    const provider = monaco.languages.registerCompletionItemProvider(
      providerLanguage,
      {
        triggerCharacters: ["{"],
        provideCompletionItems: (
          model: editor.ITextModel,
          position: Position,
        ) => {
          // Get full content and cursor offset for utility functions
          const content = model.getValue();
          const cursorOffset = model.getOffsetAt(position);

          // Use tested utility to detect if we're in an open template
          const openTemplate = detectOpenTemplate({ content, cursorOffset });

          if (!openTemplate.isInTemplate) {
            return { suggestions: [] };
          }

          const query = openTemplate.query.toLowerCase();
          const startColumn = openTemplate.startColumn;

          // Check if Monaco auto-closed with }} after cursor using tested utility
          const autoClosedBraces = detectAutoClosedBraces({
            content,
            cursorOffset,
          });
          const endColumn = position.column + autoClosedBraces;

          const suggestions = templateProperties
            .filter(
              (prop) => query === "" || prop.path.toLowerCase().includes(query),
            )
            .map((prop, index) => ({
              label: `{{${prop.path}}}`,
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: prop.type,
              documentation: prop.description,
              insertText: `{{${prop.path}}}`,
              // Use sortText starting with space to appear before other completions
              sortText: ` ${String(index).padStart(4, "0")}`,
              // Use the query as filterText so it matches what user typed
              filterText: `{{${query}${prop.path}`,
              preselect: index === 0, // Preselect first item
              range: {
                startLineNumber: position.lineNumber,
                startColumn: startColumn,
                endLineNumber: position.lineNumber,
                endColumn: endColumn,
              },
            }));

          return { suggestions, incomplete: false };
        },
      },
    );

    templateProviderRef.current = provider;

    return () => {
      provider.dispose();
    };
  }, [templateProperties, language, isEditorMounted]);

  // Update type definitions when they change
  React.useEffect(() => {
    if (!monacoRef.current) return;
    if (language !== "typescript" && language !== "javascript") return;

    const monaco = monacoRef.current;
    const defaults =
      language === "typescript"
        ? monaco.languages.typescript.typescriptDefaults
        : monaco.languages.typescript.javascriptDefaults;

    // Configure compiler options to exclude DOM types but keep ES libs
    defaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      lib: ["esnext"], // Include ES libs but NOT DOM
      allowNonTsExtensions: true,
      noEmit: true,
      strict: true,
    });

    // Suppress certain diagnostics that don't apply to our script context
    defaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [1108], // "A 'return' statement can only be used within a function body"
    });

    // Add type definitions (custom or default)
    const definitions = typeDefinitions ?? DEFAULT_BACKEND_TYPE_DEFINITIONS;
    const lib = defaults.addExtraLib(definitions, "file:///context.d.ts");
    disposablesRef.current.push(lib);

    return () => {
      lib.dispose();
    };
  }, [typeDefinitions, language]);

  // Calculate height from minHeight
  const heightValue = minHeight.replace("px", "");
  const numericHeight = Number.parseInt(heightValue, 10) || 100;

  // Compute effective language - use json-template when we have templates for JSON
  const hasTemplates = templateProperties && templateProperties.length > 0;
  const effectiveLanguage =
    hasTemplates && language === "json"
      ? "json-template"
      : (languageMap[language] ?? language);

  return (
    <div
      id={id}
      className="w-full rounded-md border border-input bg-background font-mono text-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all box-border overflow-visible"
      style={{ minHeight }}
    >
      <Editor
        height={`${Math.max(numericHeight, 100)}px`}
        language={effectiveLanguage}
        value={value}
        onChange={(newValue) => onChange(newValue ?? "")}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          folding: false,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "ui-monospace, monospace",
          tabSize: 2,
          automaticLayout: true,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          renderLineHighlight: "none",
          contextmenu: false,
          // Placeholder support via aria-label
          ariaLabel: placeholder ?? "Code editor",
        }}
        theme="vs-dark"
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Loading editor...
          </div>
        }
      />
    </div>
  );
};
