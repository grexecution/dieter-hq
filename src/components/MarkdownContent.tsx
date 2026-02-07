"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Pre-process content to convert MEDIA: tags to markdown images
 * MEDIA:/path/to/file.png → ![Screenshot](/api/media?path=/path/to/file.png)
 * Note: We don't encode the path here - the browser/fetch will handle it
 */
function preprocessContent(content: string): string {
  // Match MEDIA: tags - supports absolute paths and ~/paths
  const mediaPattern = /MEDIA:((?:\/[^\s\n\]]+|~\/[^\s\n\]]+))/g;
  
  return content.replace(mediaPattern, (_match, filePath) => {
    // Don't double-encode - just pass the path directly
    const mediaUrl = `/api/media?path=${filePath}`;
    return `![Screenshot](${mediaUrl})`;
  });
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  // Pre-process content to handle MEDIA: tags
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
        // Style code blocks
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;
          
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
            <code
              className={cn(
                "block bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-sm font-mono overflow-x-auto",
                className
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
        // Style pre blocks
        pre: ({ children, ...props }) => (
          <pre
            className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto my-2"
            {...props}
          >
            {children}
          </pre>
        ),
        // Style links
        a: ({ href, children, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
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
            className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-600 dark:text-zinc-400 my-2"
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
