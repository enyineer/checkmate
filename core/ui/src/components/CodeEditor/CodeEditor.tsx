import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import {
  EditorView,
  ViewPlugin,
  Decoration,
  keymap,
  type ViewUpdate,
  type DecorationSet,
} from "@codemirror/view";
import { RangeSetBuilder, Prec } from "@codemirror/state";
import {
  autocompletion,
  completionStatus,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { indentUnit, getIndentUnit, indentString } from "@codemirror/language";
import {
  jsonLanguageSupport,
  yamlLanguageSupport,
  xmlLanguageSupport,
  markdownLanguageSupport,
  isBetweenBrackets,
  type LanguageSupport,
} from "./languageSupport";

export type CodeEditorLanguage = "json" | "yaml" | "xml" | "markdown";

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
   * Optional template properties for autocomplete.
   * When provided, typing "{{" triggers autocomplete with available template variables.
   */
  templateProperties?: TemplateProperty[];
}

// Language support registry - add new languages here
const languageRegistry: Record<CodeEditorLanguage, LanguageSupport> = {
  json: jsonLanguageSupport,
  yaml: yamlLanguageSupport,
  xml: xmlLanguageSupport,
  markdown: markdownLanguageSupport,
};

/**
 * Get display type with color info for autocomplete
 */
function getTypeInfo(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Create a ViewPlugin for template-aware syntax highlighting.
 * Uses the language's buildDecorations function to generate decorations.
 */
function createTemplateHighlighter(languageSupport: LanguageSupport) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const doc = view.state.doc.toString();
        const ranges = languageSupport.buildDecorations(doc);

        for (const range of ranges) {
          builder.add(range.from, range.to, range.decoration);
        }

        return builder.finish();
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}

/**
 * Create a CodeMirror autocomplete extension for template properties.
 * Triggers when user types "{{" and offers completions from templateProperties.
 */
function createTemplateAutocomplete(
  templateProperties: TemplateProperty[],
  languageSupport: LanguageSupport,
): ReturnType<typeof autocompletion> {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        // Look for {{ pattern before cursor
        const textBefore = context.state.sliceDoc(0, context.pos);
        const recentText = context.state.sliceDoc(
          Math.max(0, context.pos - 50),
          context.pos,
        );

        // Find the last {{ that doesn't have a matching }}
        const lastOpenBrace = recentText.lastIndexOf("{{");
        const lastCloseBrace = recentText.lastIndexOf("}}");

        if (lastOpenBrace === -1 || lastOpenBrace < lastCloseBrace) {
          // eslint-disable-next-line unicorn/no-null -- CodeMirror API requires null
          return null;
        }

        // Validate position based on text BEFORE the {{ started
        // We exclude the {{ from validation because it confuses most parsers
        const positionOfTemplateStart =
          context.pos - recentText.length + lastOpenBrace;
        const textBeforeTemplate = textBefore.slice(0, positionOfTemplateStart);
        if (!languageSupport.isValidTemplatePosition(textBeforeTemplate)) {
          // eslint-disable-next-line unicorn/no-null -- CodeMirror API requires null
          return null;
        }

        // Calculate the position in the document where {{ starts
        const startOffset = context.pos - recentText.length + lastOpenBrace;
        const query = recentText.slice(lastOpenBrace + 2).toLowerCase();

        // Check for auto-closed braces after cursor position
        // When user types {{ with bracket auto-close, it becomes {{}}
        // We need to consume any trailing }} when completing
        const textAfter = context.state.sliceDoc(context.pos, context.pos + 4);
        let endOffset = context.pos;
        if (textAfter.startsWith("}}")) {
          endOffset += 2;
        } else if (textAfter.startsWith("}")) {
          // Just one } from first auto-close
          endOffset += 1;
        }

        // Filter properties based on query
        const filtered = templateProperties.filter((prop) =>
          prop.path.toLowerCase().includes(query),
        );

        if (filtered.length === 0 && query.length > 0) {
          // eslint-disable-next-line unicorn/no-null -- CodeMirror API requires null
          return null;
        }

        return {
          from: startOffset,
          to: endOffset,
          options: filtered.map((prop) => ({
            label: `{{${prop.path}}}`,
            displayLabel: prop.path,
            type: "variable",
            detail: getTypeInfo(prop.type),
            info: prop.description,
            boost: prop.path.toLowerCase().startsWith(query) ? 1 : 0,
          })),
          validFor: /^\{\{[\w.]*$/,
        };
      },
    ],
    activateOnTyping: true,
    icons: false,
  });
}

/**
 * A code editor component with syntax highlighting and optional template autocomplete.
 * Wraps @uiw/react-codemirror for consistent styling and API across the platform.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  id,
  value,
  onChange,
  language = "json",
  minHeight = "100px",
  readOnly = false,
  placeholder,
  templateProperties,
}) => {
  const extensions = React.useMemo(() => {
    const languageSupport = languageRegistry[language];
    const hasTemplates = templateProperties && templateProperties.length > 0;

    const exts = [
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "14px",
          fontFamily: "ui-monospace, monospace",
          backgroundColor: "transparent",
        },
        ".cm-scroller": {
          backgroundColor: "transparent",
          overflow: "auto",
        },
        // minHeight must be on .cm-content and .cm-gutter, not the wrapper (per CM docs)
        ".cm-content, .cm-gutter": {
          minHeight: minHeight,
        },
        ".cm-content": {
          padding: "10px",
        },
        // Cursor/caret styling
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "hsl(var(--foreground))",
          borderLeftWidth: "2px",
        },
        ".cm-line": {
          color: "hsl(var(--foreground))",
        },
        ".cm-gutters": {
          backgroundColor: "transparent",
          color: "hsl(var(--muted-foreground))",
          border: "none",
        },
        "&.cm-focused": {
          outline: "none",
        },
        // JSON syntax highlighting for dark/light mode
        ".cm-string": {
          color: "hsl(142.1, 76.2%, 36.3%)",
        },
        ".cm-number": {
          color: "hsl(217.2, 91.2%, 59.8%)",
        },
        ".cm-propertyName": {
          color: "hsl(280, 65%, 60%)",
        },
        ".cm-keyword": {
          color: "hsl(280, 65%, 60%)",
        },
        ".cm-punctuation": {
          color: "hsl(var(--muted-foreground))",
        },
        // Placeholder styling
        ".cm-placeholder": {
          color: "hsl(var(--muted-foreground))",
        },
        // JSON syntax highlighting via decorations (overrides Lezer parser)
        ".cm-json-property": {
          color: "hsl(280, 65%, 60%)",
        },
        ".cm-json-string": {
          color: "hsl(142.1, 76.2%, 36.3%)",
        },
        ".cm-json-number": {
          color: "hsl(217.2, 91.2%, 59.8%)",
        },
        ".cm-json-keyword": {
          color: "hsl(280, 65%, 60%)",
        },
        // Template expression highlighting
        ".cm-template-expression": {
          color: "hsl(190, 70%, 50%)",
          fontWeight: "500",
        },
        // Style for autocomplete popup
        ".cm-tooltip.cm-tooltip-autocomplete": {
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "0.375rem",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
        ".cm-tooltip-autocomplete ul": {
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.75rem",
        },
        ".cm-tooltip-autocomplete ul li": {
          padding: "0.25rem 0.5rem",
        },
        ".cm-tooltip-autocomplete ul li[aria-selected]": {
          backgroundColor: "hsl(var(--accent))",
          color: "hsl(var(--accent-foreground))",
        },
        ".cm-completionLabel": {
          fontFamily: "ui-monospace, monospace",
        },
        ".cm-completionDetail": {
          marginLeft: "0.5rem",
          fontStyle: "normal",
          color: "hsl(var(--muted-foreground))",
        },
      }),
    ];

    // Always add language extension for features (indentation, bracket matching, etc.)
    if (languageSupport) {
      exts.push(languageSupport.extension);

      // Create custom Enter key handler that applies our indentation
      // This is needed because the language parsers may get confused by templates
      // or may not provide the indentation we want
      const customEnterKeymap = keymap.of([
        {
          key: "Enter",
          run: (view) => {
            const state = view.state;

            // If autocomplete is active, let it handle Enter for selection
            if (completionStatus(state) === "active") {
              return false;
            }

            const pos = state.selection.main.head;
            const textBefore = state.sliceDoc(0, pos);
            const textAfter = state.sliceDoc(pos);
            const unit = getIndentUnit(state);
            const indent = languageSupport.calculateIndentation(
              textBefore + "\n",
              unit,
            );
            const indentStr = indentString(state, indent);

            // Check if we're between matching brackets/tags
            // This handles cases like: {|}, [|], <tag>|</tag>
            if (isBetweenBrackets(textBefore, textAfter)) {
              // Split: add newline with indent, then newline with previous indent for closing
              const prevIndent = Math.max(0, indent - unit);
              const prevIndentStr = indentString(state, prevIndent);

              view.dispatch({
                changes: {
                  from: pos,
                  to: pos,
                  insert: "\n" + indentStr + "\n" + prevIndentStr,
                },
                selection: { anchor: pos + 1 + indentStr.length },
                scrollIntoView: true,
                userEvent: "input",
              });
            } else {
              // Normal: insert newline with calculated indentation
              view.dispatch({
                changes: { from: pos, to: pos, insert: "\n" + indentStr },
                selection: { anchor: pos + 1 + indentStr.length },
                scrollIntoView: true,
                userEvent: "input",
              });
            }
            return true;
          },
        },
      ]);

      // Always add indentation support and custom highlighter for consistent behavior
      // Prec.highest ensures our colors take precedence over language parser output
      exts.push(
        indentUnit.of("  "), // Configure 2-space indentation
        Prec.highest(customEnterKeymap), // Override default Enter behavior
        Prec.highest(createTemplateHighlighter(languageSupport)), // Consistent syntax colors
      );

      // Add template autocomplete if properties provided
      if (hasTemplates) {
        exts.push(
          createTemplateAutocomplete(templateProperties, languageSupport),
        );
      }
    }

    return exts;
  }, [language, templateProperties, minHeight]);

  return (
    <div
      id={id}
      className="w-full rounded-md border border-input bg-background font-mono text-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all box-border"
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        editable={!readOnly}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          autocompletion: false, // We use our own
        }}
        theme="none"
      />
    </div>
  );
};
