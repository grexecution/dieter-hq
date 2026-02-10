"use client";

import { useMemo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Pre-process content to convert MEDIA: tags to markdown images
 * and auto-link URLs that aren't already in markdown format
 */
function preprocessContent(content: string): string {
  // Match MEDIA: tags - supports absolute paths and ~/paths
  const mediaPattern = /MEDIA:((?:\/[^\s\n\]]+|~\/[^\s\n\]]+))/g;
  
  let processed = content.replace(mediaPattern, (_match, filePath) => {
    const mediaUrl = `/api/media?path=${filePath}`;
    return `![Screenshot](${mediaUrl})`;
  });

  // Auto-link URLs that aren't already in markdown format
  // Match URLs not preceded by ]( or "
  const urlPattern = /(?<!["\](])((https?:\/\/)[^\s<>\[\]"']+)/g;
  processed = processed.replace(urlPattern, (match) => {
    // Don't double-wrap if already a markdown link
    if (match.includes('](')) return match;
    return `[${match}](${match})`;
  });

  return processed;
}

// Copy button component
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs transition-all",
        "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600",
        "text-zinc-600 dark:text-zinc-300",
        copied && "bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300",
        className
      )}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  // Pre-process content to handle MEDIA: tags and auto-link URLs
  const processedContent = useMemo(() => preprocessContent(content), [content]);
  
  return (
    <ReactMarkdown
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      remarkPlugins={[remarkGfm]}
      components={{
        // Render images with proper styling
        img: ({ src, alt, ...props }) => {
          // Handle base64 images
          if (src?.startsWith("data:image")) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || "Image"}
                className="max-h-[400px] w-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-2"
                loading="lazy"
                {...props}
              />
            );
          }
          // Handle regular URLs
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || "Image"}
              className="max-h-[400px] w-auto rounded-lg border border-zinc-200 dark:border-zinc-700 my-2"
              loading="lazy"
              {...props}
            />
          );
        },
        // Style code blocks with copy button
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;
          const codeText = String(children).replace(/\n$/, "");
          
          if (isInline) {
            return (
              <code
                className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }
          
          return (
            <div className="relative group">
              <code
                className={cn(
                  "block bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-sm font-mono overflow-x-auto",
                  className
                )}
                {...props}
              >
                {children}
              </code>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={codeText} />
              </div>
            </div>
          );
        },
        // Style pre blocks with copy button
        pre: ({ children, ...props }) => {
          // Extract text content from children for copy
          const getTextContent = (node: React.ReactNode): string => {
            if (typeof node === "string") return node;
            if (Array.isArray(node)) return node.map(getTextContent).join("");
            if (node && typeof node === "object" && "props" in node) {
              return getTextContent((node as React.ReactElement).props.children);
            }
            return "";
          };
          const textContent = getTextContent(children);

          return (
            <div className="relative group">
              <pre
                className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto my-2"
                {...props}
              >
                {children}
              </pre>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={textContent} />
              </div>
            </div>
          );
        },
        // Style links with copy button
        a: ({ href, children, ...props }) => {
          const isUrl = href?.startsWith("http");
          
          return (
            <span className="inline-flex items-center gap-1 group/link">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-blue-600 dark:text-blue-400 hover:underline",
                  isUrl && "font-medium"
                )}
                {...props}
              >
                {children}
              </a>
              {isUrl && href && (
                <CopyButton 
                  text={href} 
                  className="opacity-0 group-hover/link:opacity-100 ml-0.5"
                />
              )}
            </span>
          );
        },
        // Style tables
        table: ({ children, ...props }) => (
          <div className="overflow-x-auto my-2">
            <table
              className="min-w-full border-collapse border border-zinc-200 dark:border-zinc-700"
              {...props}
            >
              {children}
            </table>
          </div>
        ),
        th: ({ children, ...props }) => (
          <th
            className="border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-left font-semibold"
            {...props}
          >
            {children}
          </th>
        ),
        td: ({ children, ...props }) => (
          <td
            className="border border-zinc-200 dark:border-zinc-700 px-3 py-2"
            {...props}
          >
            {children}
          </td>
        ),
        // Style blockquotes
        blockquote: ({ children, ...props }) => (
          <blockquote
            className="border-l-4 border-blue-400 dark:border-blue-500 pl-4 italic text-zinc-600 dark:text-zinc-400 my-2 bg-blue-50/50 dark:bg-blue-900/20 py-2 rounded-r"
            {...props}
          >
            {children}
          </blockquote>
        ),
        // Style lists
        ul: ({ children, ...props }) => (
          <ul className="list-disc list-inside my-2 space-y-1" {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
            {children}
          </ol>
        ),
        // Style headings
        h1: ({ children, ...props }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 text-zinc-900 dark:text-zinc-100" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-lg font-bold mt-3 mb-2 text-zinc-900 dark:text-zinc-100" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-base font-bold mt-2 mb-1 text-zinc-900 dark:text-zinc-100" {...props}>
            {children}
          </h3>
        ),
        // Strong/bold
        strong: ({ children, ...props }) => (
          <strong className="font-semibold text-zinc-900 dark:text-zinc-100" {...props}>
            {children}
          </strong>
        ),
        // Emphasis/italic
        em: ({ children, ...props }) => (
          <em className="italic text-zinc-700 dark:text-zinc-300" {...props}>
            {children}
          </em>
        ),
        // Horizontal rule
        hr: ({ ...props }) => (
          <hr className="my-4 border-zinc-200 dark:border-zinc-700" {...props} />
        ),
        // Paragraphs
        p: ({ children, ...props }) => (
          <p className="my-1.5 leading-relaxed" {...props}>
            {children}
          </p>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
