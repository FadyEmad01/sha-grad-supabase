"use client";

import { useState, useCallback } from "react";
import { CircleUserRound, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  preview: string | null;
  fallbackText?: string;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  error?: string;
  className?: string;
}

export function AvatarUpload({
  preview,
  fallbackText = "?",
  onFileSelect,
  onFileRemove,
  error,
  className,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const openFileDialog = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  }, [onFileSelect]);

  const getInputProps = useCallback(() => ({
    type: "file" as const,
    accept: "image/*",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    className: "sr-only",
    tabIndex: -1 as const,
  }), [onFileSelect]);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* <Avatar className="w-24 h-24 ring-2 ring-primary/20">
        <AvatarImage src={preview ?? undefined} />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {fallbackText}
        </AvatarFallback>
      </Avatar> */}

      <div className="flex flex-col items-center gap-2">
        <div className="relative inline-flex">
          <button
            aria-label={preview ? "Change image" : "Upload image"}
            className={cn(
              "relative flex size-16 items-center justify-center overflow-hidden rounded-full border bg-primary/10",
              isDragging ? "border-primary bg-accent/50" : "border-input border-dashed",
              "outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
            data-dragging={isDragging || undefined}
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            type="button"
          >
            {preview ? (
              <img
                alt="Profile preview"
                className="size-full object-cover"
                height={64}
                src={preview}
                width={64}
              />
            ) : (
              <div aria-hidden="true">
                <CircleUserRound className="size-4 opacity-60" />
              </div>
            )}
          </button>

          {preview && (
            <Button
              aria-label="Remove image"
              className="-top-1 -right-1 absolute size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
              onClick={onFileRemove}
              size="icon"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        <input {...getInputProps()} aria-label="Upload image file" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
