"use client";

import { Eye, EyeOff, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/client";

interface UserImage {
  id: string;
  storage_path: string;
  file_name: string;
  caption: string | null;
  is_public: boolean | null;
  created_at: string;
}

export default function GalleryManager({ studentId }: { studentId: string }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UserImage[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadPublic, setUploadPublic] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const loadImages = async () => {
      const { data } = await supabase
        .from("user_images")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (data) {
        setImages(data);
        const urls: Record<string, string> = {};
        for (const img of data) {
          const { data: urlData } = supabase.storage
            .from("sha-gallery")
            .getPublicUrl(img.storage_path);
          urls[img.id] = urlData.publicUrl;
        }
        setImageUrls(urls);
      }
      setLoading(false);
    };
    loadImages();
  }, [studentId, supabase.storage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!uploadFile || !studentId) return;
    setUploading(true);

    try {
      const ext = uploadFile.name.split(".").pop();
      const imageId = crypto.randomUUID();
      const storagePath = `user-images/${studentId}/${imageId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("sha-gallery")
        .upload(storagePath, uploadFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("user_images").insert({
        student_id: studentId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        storage_path: storagePath,
        file_name: uploadFile.name,
        file_size: uploadFile.size,
        mime_type: uploadFile.type,
        caption: uploadCaption || null,
        is_public: uploadPublic,
      });

      if (dbError) throw dbError;

      // Refresh
      const { data } = await supabase
        .from("user_images")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (data) {
        setImages(data);
        const urls: Record<string, string> = {};
        for (const img of data) {
          const { data: urlData } = supabase.storage
            .from("sha-gallery")
            .getPublicUrl(img.storage_path);
          urls[img.id] = urlData.publicUrl;
        }
        setImageUrls(urls);
      }

      // Reset
      setUploadFile(null);
      setUploadPreview("");
      setUploadCaption("");
      setUploadPublic(true);
      setUploadOpen(false);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (img: UserImage) => {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from("sha-gallery").remove([img.storage_path]);
    await supabase.from("user_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    setImageUrls((prev) => {
      const next = { ...prev };
      delete next[img.id];
      return next;
    });
  };

  const toggleVisibility = async (img: UserImage) => {
    const newVisibility = !img.is_public;
    await supabase
      .from("user_images")
      .update({ is_public: newVisibility })
      .eq("id", img.id);
    setImages((prev) =>
      prev.map((i) =>
        i.id === img.id ? { ...i, is_public: newVisibility } : i,
      ),
    );
  };

  const _updateCaption = async (img: UserImage, caption: string) => {
    await supabase
      .from("user_images")
      .update({ caption: caption || null })
      .eq("id", img.id);
    setImages((prev) =>
      prev.map((i) => (i.id === img.id ? { ...i, caption } : i)),
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Gallery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gallery</h2>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Upload Photo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* File picker */}
              {!uploadPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to select an image</span>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={uploadPreview}
                    alt="Preview"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFile(null);
                      setUploadPreview("");
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="space-y-2">
                <Label htmlFor="upload-caption">Caption (optional)</Label>
                <Textarea
                  id="upload-caption"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="upload-public">Public</Label>
                <Switch
                  id="upload-public"
                  checked={uploadPublic}
                  onCheckedChange={setUploadPublic}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No photos yet. Upload your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-md overflow-hidden bg-muted"
            >
              {imageUrls[img.id] && (
                <img
                  src={imageUrls[img.id]}
                  alt={img.caption || img.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => toggleVisibility(img)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                  title={img.is_public ? "Make private" : "Make public"}
                >
                  {img.is_public ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-red-500/50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Badges */}
              {!img.is_public && (
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
                  Private
                </div>
              )}
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {images.length} photo{images.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
