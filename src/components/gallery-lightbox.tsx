"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

interface UserImage {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  is_public: boolean | null;
  created_at: string;
}

export default function GalleryLightbox({
  images,
  imageUrls,
  selectedIndex,
  onClose,
  onIndexChange,
  isOwnProfile,
}: {
  images: UserImage[];
  imageUrls: Record<string, string>;
  selectedIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  isOwnProfile: boolean;
}) {
  const supabase = createClient();
  const [localImages, setLocalImages] = useState(images);
  const current = localImages[selectedIndex];

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const prev = () =>
    onIndexChange(
      (selectedIndex - 1 + localImages.length) % localImages.length,
    );
  const next = () => onIndexChange((selectedIndex + 1) % localImages.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, localImages.length, onClose, prev, next]);

  const handleDelete = async () => {
    if (!confirm("Delete this photo?")) return;
    const img = localImages[selectedIndex];

    await supabase.storage.from("sha-gallery").remove([img.storage_path]);
    await supabase.from("user_images").delete().eq("id", img.id);

    const newImages = localImages.filter((_, i) => i !== selectedIndex);
    setLocalImages(newImages);
    if (newImages.length === 0) {
      onClose();
    } else {
      onIndexChange(Math.min(selectedIndex, newImages.length - 1));
    }
  };

  const toggleVisibility = async () => {
    const img = localImages[selectedIndex];
    const newVisibility = !img.is_public;

    const { error } = await supabase
      .from("user_images")
      .update({ is_public: newVisibility })
      .eq("id", img.id);

    if (!error) {
      const updated = [...localImages];
      updated[selectedIndex] = { ...img, is_public: newVisibility };
      setLocalImages(updated);
    }
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-2xl">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation */}
      {localImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 z-10 text-white/80 hover:text-white p-2"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 z-10 text-white/80 hover:text-white p-2"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div className="max-w-4xl max-h-[80vh] p-4 flex flex-col items-center">
        <img
          src={imageUrls[current.id]}
          alt={current.caption || current.file_name}
          className="max-w-full max-h-[70vh] object-contain rounded"
        />

        {/* Info */}
        <div className="mt-4 text-center text-white space-y-1">
          {current.caption && <p className="text-sm">{current.caption}</p>}
          <p className="text-xs text-white/50">
            {new Date(current.created_at).toLocaleDateString()}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                current.is_public
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {current.is_public ? "Public" : "Private"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {/* {isOwnProfile && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVisibility}
              className="gap-1.5 text-white border-white/20 hover:bg-white/10"
            >
              {current.is_public ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Make Private
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Make Public
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5 text-destructive border-white/20 hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
}
