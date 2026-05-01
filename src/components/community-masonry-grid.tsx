"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Masonry from "react-masonry-css";
import { createClient } from "@/lib/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

const DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";

interface CommunityImage {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  created_at: string;
  student: {
    id: string;
    full_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
  };
}

function getAvatarUrl(student: CommunityImage["student"]) {
  if (student.avatar_url) return student.avatar_url;
  return `${DICEBEAR}${student.id}`;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PAGE_SIZE = 20;

export default function CommunityMasonryGrid() {
  const [images, setImages] = useState<CommunityImage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadImages = useCallback(async (pageNum: number) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("user_images")
        .select(
          `
          id, storage_path, file_name, caption, created_at,
          student:students!inner(
            id, full_name, nickname, avatar_url, privacy_setting
          )
        `,
          { count: "exact" }
        )
        .eq("is_public", true)
        .not("student.privacy_setting", "eq", "private")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error loading community images:", error);
        return;
      }

      if (data) {
        const typedData = data as unknown as (CommunityImage & {
          student: CommunityImage["student"] & { privacy_setting: string };
        })[];

        const validImages = typedData.map(({ student, ...img }) => ({
          ...img,
          student: {
            id: student.id,
            full_name: student.full_name,
            nickname: student.nickname,
            avatar_url: student.avatar_url,
          },
        }));

        setImages((prev) => [...prev, ...validImages]);

        // Load image URLs
        const urls: Record<string, string> = {};
        for (const img of validImages) {
          const { data: urlData } = supabase.storage
            .from("sha-gallery")
            .getPublicUrl(img.storage_path);
          urls[img.id] = urlData.publicUrl;
        }
        setImageUrls((prev) => ({ ...prev, ...urls }));

        // Check if more pages exist
        if (count !== null) {
          setHasMore(from + validImages.length < count);
        } else {
          setHasMore(validImages.length === PAGE_SIZE);
        }
      }
    } catch (err) {
      console.error("Failed to load images:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore]);

  // Initial load
  useEffect(() => {
    loadImages(0);
  }, []);

  // Intersection Observer for infinite loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadImages(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, page, loadImages]);

  const masonryBreakpoints = {
    default: 4,
    1024: 3,
    768: 2,
    640: 2,
  };

  return (
    <div>
      <Masonry
        breakpointCols={masonryBreakpoints}
        className="flex gap-4"
        columnClassName="flex flex-col gap-4"
      >
        {images.map((img) => {
          const displayName = img.student.full_name || img.student.nickname || "User";
          const url = imageUrls[img.id];

          return (
            <div
              key={img.id}
              className="group relative rounded-lg overflow-hidden bg-muted"
            >
              {url ? (
                <img
                  src={url}
                  alt={img.caption || img.file_name}
                  className="w-full h-auto"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-square animate-pulse bg-muted-foreground/20" />
              )}

              {/* Student info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage
                      src={getAvatarUrl(img.student)}
                      alt={displayName}
                    />
                    <AvatarFallback className="text-xs bg-white/20 text-white">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-medium truncate">
                    {displayName}
                  </span>
                </div>
              </div>

              {/* Caption on hover */}
              {img.caption && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3">
                  <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </Masonry>

      {/* Loader */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {isLoading && (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        )}
        {!hasMore && images.length > 0 && (
          <p className="text-sm text-muted-foreground">
            No more images to load
          </p>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No public images yet</p>
        </div>
      )}
    </div>
  );
}
