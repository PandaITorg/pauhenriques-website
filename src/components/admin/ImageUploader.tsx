"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { FaCloudUploadAlt, FaTimes, FaSpinner } from "react-icons/fa";

const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.82;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;

      // Only resize if larger than MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to compress image"));
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  productId?: string;
}

export default function ImageUploader({
  images,
  onChange,
  productId,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      const newUrls: string[] = [];
      const total = fileArray.length;

      for (let i = 0; i < fileArray.length; i++) {
        setUploadProgress(`${i + 1} de ${total}`);

        let processed: File;
        try {
          processed = await compressImage(fileArray[i]);
        } catch {
          processed = fileArray[i]; // Fallback to original if compression fails
        }

        const formData = new FormData();
        formData.append("file", processed);
        if (productId) formData.append("productId", productId);

        try {
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            newUrls.push(data.url);
          }
        } catch (err) {
          console.error("Upload error:", err);
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }
      setUploading(false);
      setUploadProgress("");
      // Reset input so the same files can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    [images, onChange, productId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleRemove = async (index: number) => {
    const url = images[index];
    // Delete from storage
    try {
      await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Continue even if delete fails
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <FaSpinner className="w-8 h-8 text-primary mx-auto animate-spin" />
        ) : (
          <FaCloudUploadAlt className="w-8 h-8 text-gray-400 mx-auto" />
        )}
        <p className="mt-2 text-sm text-gray-500">
          {uploading
            ? `Subiendo ${uploadProgress}...`
            : "Arrastra imagenes aqui o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WebP o AVIF. Se comprimen a WebP 1200px automaticamente.
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative group aspect-square">
              <Image
                src={url}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                sizes="120px"
              />
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaTimes className="w-3 h-3" />
              </button>
              {/* Reorder buttons */}
              <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index - 1)}
                    className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                  >
                    ←
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleReorder(index, index + 1)}
                    className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                  >
                    →
                  </button>
                )}
              </div>
              {/* Index badge */}
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
