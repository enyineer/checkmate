import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { cn } from "../utils";

export interface MarkdownProps {
  /** The markdown content to render */
  children: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Size variant affecting text size */
  size?: "sm" | "base" | "lg";
}

/**
 * Styled markdown renderer using Tailwind.
 *
 * Renders markdown content with consistent styling that matches
 * the application's design system.
 *
 * @example
 * ```tsx
 * <Markdown>**Bold** and *italic* text</Markdown>
 * <Markdown size="sm">Small text with [links](url)</Markdown>
 * ```
 */
export function Markdown({
  children,
  className,
  size = "base",
}: MarkdownProps) {
  const sizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  const components: Components = {
    // Paragraphs - no extra margin for inline use
    p: ({ children }) => <span>{children}</span>,

    // Bold text
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),

    // Italic text
    em: ({ children }) => <em className="italic">{children}</em>,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Inline code
    code: ({ children }) => (
      <code className="px-1 py-0.5 rounded bg-muted font-mono text-[0.9em]">
        {children}
      </code>
    ),

    // Strikethrough
    del: ({ children }) => (
      <del className="line-through text-muted-foreground">{children}</del>
    ),
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </span>
  );
}

export interface MarkdownBlockProps extends MarkdownProps {
  /** Whether to show as a prose block with proper spacing */
  prose?: boolean;
}

/**
 * Styled markdown block renderer for longer content.
 *
 * Unlike `Markdown`, this renders full blocks with proper paragraph
 * spacing, headers, lists, and other block-level elements.
 *
 * @example
 * ```tsx
 * <MarkdownBlock>
 *   # Heading
 *
 *   Paragraph with **bold** text.
 *
 *   - List item 1
 *   - List item 2
 * </MarkdownBlock>
 * ```
 */
export function MarkdownBlock({
  children,
  className,
  size = "base",
  prose = true,
}: MarkdownBlockProps) {
  const sizeClasses = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  };

  const components: Components = {
    // Paragraphs with proper spacing
    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,

    // Headers
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mb-2 text-foreground">{children}</h3>
    ),

    // Bold text
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),

    // Italic text
    em: ({ children }) => <em className="italic">{children}</em>,

    // Links
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    // Lists
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li>{children}</li>,

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground mb-4">
        {children}
      </blockquote>
    ),

    // Code blocks
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      // Check if this is a code block (has language class)
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return <code>{children}</code>;
      }
      return (
        <code className="px-1 py-0.5 rounded bg-muted font-mono text-[0.9em]">
          {children}
        </code>
      );
    },

    // Horizontal rule
    hr: () => <hr className="border-border my-6" />,

    // Strikethrough
    del: ({ children }) => (
      <del className="line-through text-muted-foreground">{children}</del>
    ),
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        prose && "prose prose-neutral dark:prose-invert max-w-none",
        className
      )}
    >
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
