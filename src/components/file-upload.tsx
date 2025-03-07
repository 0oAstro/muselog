"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as motion from "motion/react-client";
import { Upload, X, File, FileText, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type FileWithPreview = File & {
  preview?: string;
  progress?: number;
  id: string;
};

type FileUploadProps = {
  onFilesUploaded?: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  mode?: "vertical" | "horizontal";
  instructionText?: string;
  dragActiveText?: string;
};

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "text/markdown": [".md"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
  className,
  mode = "vertical",
  instructionText = "Drag & drop files here or click to browse",
  dragActiveText = "Drop files here",
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          progress: 100,
          id: crypto.randomUUID(),
        })
      );

      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      onFilesUploaded?.([...files, ...newFiles]);
    },
    [files, maxFiles, onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    maxFiles,
  });

  const removeFile = (id: string) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== id);
      onFilesUploaded?.(updatedFiles);
      return updatedFiles;
    });
  };

  const getFileIcon = (file: FileWithPreview) => {
    const type = file.type;
    if (type.includes("image")) return <Image className="w-5 h-5" />;
    if (type.includes("video")) return <Video className="w-5 h-5" />;
    if (type.includes("pdf")) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors",
          mode === "vertical" ? "p-8" : "p-4",
          dragActive || isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          "focus:outline-none cursor-pointer"
        )}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            "flex items-center justify-center gap-3 text-center",
            mode === "vertical" ? "flex-col" : "flex-row"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/10",
              mode === "vertical" ? "p-4" : "p-2"
            )}
          >
            <Upload
              className={cn(
                "text-primary",
                mode === "vertical" ? "w-6 h-6" : "w-4 h-4"
              )}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {dragActive || isDragActive ? dragActiveText : instructionText}
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB
              each
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 space-y-2"
        >
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 border rounded-md bg-muted/40"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {typeof file.progress === "number" && (
                  <Progress value={file.progress} className="w-20 h-2" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
