"use client";

import { useEffect, useState } from "react";
import GalleryLightbox from "@/components/gallery-lightbox";
import { createClient } from "@/lib/client";

interface UserImage {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  is_public: boolean | null;
  created_at: string;
}

export default function GalleryGrid({
  images,
  isOwnProfile,
  studentId,
}: {
  images: UserImage[];
  isOwnProfile: boolean;
  studentId: string;
}) {
  const supabase = createClient();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const img of images) {
        const { data } = supabase.storage
          .from("sha-gallery")
          .getPublicUrl(img.storage_path);
        urls[img.id] = data.publicUrl;
      }
      setImageUrls(urls);
    };
    loadUrls();
  }, [images, supabase.storage]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {images.map((img, index) => (
          <button
            type="button"
            key={img.id}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square overflow-hidden rounded-md bg-muted group cursor-pointer"
          >
            {imageUrls[img.id] ? (
              <img
                src={imageUrls[img.id]}
                alt={img.caption || img.file_name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-muted" />
            )}
            {img.caption && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                  {img.caption}
                </p>
              </div>
            )}
            {!img.is_public && isOwnProfile && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                <span className="text-white text-[10px]">🔒</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <GalleryLightbox
          images={images}
          imageUrls={imageUrls}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onIndexChange={setSelectedIndex}
          isOwnProfile={isOwnProfile}
        />
      )}
    </>
  );
}
