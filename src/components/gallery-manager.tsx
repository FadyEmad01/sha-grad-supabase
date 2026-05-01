"use client";

import { useCallback } from "react";
import { Eye, EyeOff, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
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

  // Upload state - now supports multiple files
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
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

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, []);

  // Dropzone for drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setUploadFiles(prev => [...prev, ...acceptedFiles]);
    setUploadPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setUploadFiles(prev => [...prev, ...files]);
    setUploadPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !studentId) return;
    setUploading(true);

    try {
      const supabase = createClient();
      const results = await Promise.allSettled(
        uploadFiles.map(async (file) => {
          const ext = file.name.split(".").pop();
          const imageId = crypto.randomUUID();
          const storagePath = `user-images/${studentId}/${imageId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("sha-gallery")
            .upload(storagePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from("user_images").insert({
            student_id: studentId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            storage_path: storagePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            is_public: uploadPublic,
            // caption removed per request
          });

          if (dbError) throw dbError;
          return storagePath;
        })
      );

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error("Some uploads failed:", failures);
        alert(`${failures.length} upload(s) failed`);
      }

      // Refresh gallery
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
      setUploadFiles([]);
      setUploadPreviews([]);
      setUploadPublic(true);
      setUploadOpen(false);
      alert(`Successfully uploaded ${uploadFiles.length - failures.length} image(s)!`);
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
          <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Upload Photos ({uploadFiles.length})</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
              >
                <input {...getInputProps()} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {isDragActive ? (
                  <p className="text-primary">Drop images here...</p>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Drag & drop images here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, GIF, WebP
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Section */}
              {uploadPreviews.length > 0 && (
                <div className="space-y-4">
                  {/* Show file count */}
                  <p className="text-sm text-muted-foreground">
                    {uploadPreviews.length} image(s) selected
                  </p>

                  {/* Conditional rendering: file list for >20, grid for ≤20 */}
                  {uploadPreviews.length > 20 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                          <span className="truncate flex-1 mr-2">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFiles(prev => prev.filter((_, i) => i !== index));
                              setUploadPreviews(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                            aria-label="Remove file"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-64 overflow-y-auto">
                      {uploadPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full aspect-square object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFiles(prev => prev.filter((_, i) => i !== index));
                              setUploadPreviews(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white 
                                     flex items-center justify-center text-xs font-bold shadow-lg"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Privacy toggle - always visible, no hover needed */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="upload-public">Make images public</Label>
                    <Switch
                      id="upload-public"
                      checked={uploadPublic}
                      onCheckedChange={setUploadPublic}
                    />
                  </div>

                  {/* Action buttons - always visible */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        `Upload ${uploadFiles.length} Image(s)`
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadFiles([]);
                        setUploadPreviews([]);
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
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
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Action buttons - always visible on mobile, overlay on desktop */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleVisibility(img)}
                  className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                  title={img.is_public ? "Make private" : "Make public"}
                >
                  {img.is_public ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-red-500/50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Badges */}
              {!img.is_public && (
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
                  Private
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
