"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import Uppy from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";

import { Paperclip, X, FileText, Image as ImageIcon, File, Music, Video, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

type FilePreview = {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
};

// ============================================
// Utilities
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("rar")) return Archive;
  return File;
}

// ============================================
// File Preview Component
// ============================================

function FilePreviewItem({ file, onRemove }: { file: FilePreview; onRemove: (id: string) => void }) {
  const Icon = getFileIcon(file.type);
  const isImage = file.type.startsWith("image/");
  
  return (
    <div className="relative group flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-1.5 pr-2">
      {/* Preview or Icon */}
      {isImage && file.preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.preview}
          alt={file.name}
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-700">
          <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </div>
      )}
      
      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] md:text-xs font-medium text-zinc-700 dark:text-zinc-200 max-w-[100px] md:max-w-[160px]">
          {file.name}
        </p>
        <p className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">
          {formatFileSize(file.size)}
          {file.status === "uploading" && ` · ${file.progress}%`}
          {file.status === "complete" && " · ✓"}
          {file.status === "error" && " · Fehler"}
        </p>
      </div>
      
      {/* Progress bar */}
      {file.status === "uploading" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
      
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-600"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ============================================
// Main ChatComposer Component
// ============================================

export function ChatComposer({ threadId, disabled }: { threadId: string; disabled?: boolean }) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uppy = useMemo(() => {
    const u = new Uppy({
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 10,
        maxFileSize: 50 * 1024 * 1024, // 50MB
      },
    });

    u.use(XHRUpload, {
      endpoint: "/api/upload",
      fieldName: "file",
      formData: true,
    });

    return u;
  }, []);

  // Ensure each upload includes threadId.
  useEffect(() => {
    uppy.setMeta({ threadId });
  }, [uppy, threadId]);

  // Handle file added
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFileAdded = (file: any) => {
      const preview = file.type?.startsWith("image/") && file.data
        ? URL.createObjectURL(file.data)
        : undefined;
      
      setFiles(prev => [...prev, {
        id: file.id,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size || 0,
        preview,
        progress: 0,
        status: "pending",
      }]);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadProgress = (file: any, progress: any) => {
      if (!file?.id) return;
      const bytesTotal = progress.bytesTotal || 1;
      const pct = Math.round((progress.bytesUploaded / bytesTotal) * 100);
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: pct, status: "uploading" } : f
      ));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadSuccess = (file: any) => {
      if (!file?.id) return;
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 100, status: "complete" } : f
      ));
      // Remove after 2s
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }, 2000);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUploadError = (file: any) => {
      if (!file?.id) return;
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: "error" } : f
      ));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFileRemoved = (file: any) => {
      setFiles(prev => {
        const toRemove = prev.find(f => f.id === file.id);
        if (toRemove?.preview) {
          URL.revokeObjectURL(toRemove.preview);
        }
        return prev.filter(f => f.id !== file.id);
      });
    };

    uppy.on("file-added", handleFileAdded);
    uppy.on("upload-progress", handleUploadProgress);
    uppy.on("upload-success", handleUploadSuccess);
    uppy.on("upload-error", handleUploadError);
    uppy.on("file-removed", handleFileRemoved);

    return () => {
      uppy.off("file-added", handleFileAdded);
      uppy.off("upload-progress", handleUploadProgress);
      uppy.off("upload-success", handleUploadSuccess);
      uppy.off("upload-error", handleUploadError);
      uppy.off("file-removed", handleFileRemoved);
    };
  }, [uppy]);

  // Clipboard paste -> add file to uppy.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (!file) continue;
          
          e.preventDefault();
          uppy.addFile({
            name: file.name || `paste-${Date.now()}`,
            type: file.type,
            data: file,
          });
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uppy]);

  // Global drag&drop
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      if (e.dataTransfer.types?.includes?.("Files")) {
        e.preventDefault();
      }
    };

    const onDrop = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt?.files?.length) return;
      e.preventDefault();

      Array.from(dt.files).forEach((file) => {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      });
    };

    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [uppy]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (uppy as any).close?.({ reason: "unmount" });
    };
  }, [uppy, files]);

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    Array.from(selectedFiles).forEach((file) => {
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    });
    
    // Reset input
    e.target.value = "";
  }, [uppy]);

  // Remove file
  const handleRemoveFile = useCallback((id: string) => {
    uppy.removeFile(id);
  }, [uppy]);

  return (
    <div className="relative flex-shrink-0">
      {/* File previews - rendered above the composer */}
      {files.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[200px] max-w-[300px]">
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-2 shadow-lg">
            {files.map((file) => (
              <FilePreviewItem key={file.id} file={file} onRemove={handleRemoveFile} />
            ))}
          </div>
        </div>
      )}
      
      {/* Attachment button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
          "bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm",
          "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
          "ring-1 ring-zinc-200/50 dark:ring-zinc-700/50",
          "hover:ring-zinc-300 dark:hover:ring-zinc-600 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
          disabled && "opacity-50 pointer-events-none"
        )}
        title="Datei anhängen"
      >
        <Paperclip className="h-[18px] w-[18px]" />
      </button>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
