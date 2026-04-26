"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { FaCloudUploadAlt, FaSpinner, FaTrash } from "react-icons/fa";
import {
  DEFAULT_TALLER_COVER_IMAGE,
  DEFAULT_TALLER_COVER_IMAGE_THUMB,
} from "@/lib/talleres/types";

const COVER_MAX_DIMENSION = 1600;
const COVER_QUALITY = 0.85;
const THUMB_MAX_DIMENSION = 320;
const THUMB_QUALITY = 0.8;

// Algunos defaults legacy guardados en docs viejos. El uploader debe
// tratarlos como "por defecto" para mostrar el badge correcto y no
// intentar borrarlos al cambiar.
const LEGACY_DEFAULT_COVERS = new Set<string>([
  DEFAULT_TALLER_COVER_IMAGE,
  "/assets/de-toxica-a-sin-toxicos.webp",
]);
const LEGACY_DEFAULT_THUMBS = new Set<string>([
  DEFAULT_TALLER_COVER_IMAGE_THUMB,
  "/assets/de-toxica-a-sin-toxicos.webp",
  DEFAULT_TALLER_COVER_IMAGE,
]);

function resizeAndCompress(
  file: File,
  maxDim: number,
  quality: number,
  squareCrop = false,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;

      if (squareCrop) {
        const side = Math.min(width, height);
        const sx = Math.floor((width - side) / 2);
        const sy = Math.floor((height - side) / 2);
        const target = Math.min(side, maxDim);
        const canvas = document.createElement("canvas");
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to encode"));
            const baseName = file.name.replace(/\.[^.]+$/, "");
            resolve(
              new File([blob], `${baseName}.webp`, { type: "image/webp" }),
            );
          },
          "image/webp",
          quality,
        );
        return;
      }

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to encode"));
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

async function uploadOne(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "talleres");
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Error al subir");
  }
  return data.url as string;
}

export interface CoverImagePair {
  cover: string;
  thumb: string;
}

interface Props {
  value: CoverImagePair;
  onChange: (next: CoverImagePair) => void;
  disabled?: boolean;
}

export default function TallerCoverUploader({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedCover = value.cover?.trim() ?? "";
  const isDefault = !trimmedCover || LEGACY_DEFAULT_COVERS.has(trimmedCover);
  const previewUrl = isDefault ? DEFAULT_TALLER_COVER_IMAGE : trimmedCover;

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const [coverFile, thumbFile] = await Promise.all([
          resizeAndCompress(file, COVER_MAX_DIMENSION, COVER_QUALITY).catch(
            () => file,
          ),
          resizeAndCompress(
            file,
            THUMB_MAX_DIMENSION,
            THUMB_QUALITY,
            true,
          ).catch(() => null),
        ]);

        const coverUrl = await uploadOne(coverFile);
        const thumbUrl = thumbFile ? await uploadOne(thumbFile) : coverUrl;

        onChange({ cover: coverUrl, thumb: thumbUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexión");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload],
  );

  const reset = () => {
    if (disabled) return;
    onChange({ cover: "", thumb: "" });
  };

  return (
    <div className="space-y-2">
      <div className="relative aspect-16/10 rounded-xl overflow-hidden border border-border-default bg-surface-elevated">
        <Image
          key={previewUrl}
          src={previewUrl}
          alt="Imagen de portada"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 480px"
        />
        {isDefault && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
            Imagen por defecto
          </span>
        )}
        {!isDefault && !disabled && (
          <button
            type="button"
            onClick={reset}
            disabled={uploading}
            title="Restaurar imagen por defecto"
            className="absolute top-2 right-2 bg-black/60 hover:bg-error text-white p-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <FaTrash className="w-3 h-3" />
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          if (disabled || uploading) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled || uploading) return;
          handleDrop(e);
        }}
        onClick={() => {
          if (disabled || uploading) return;
          inputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-lg px-3 py-3 text-center transition-colors ${
          disabled || uploading
            ? "opacity-60 cursor-not-allowed border-border-default"
            : dragOver
              ? "border-primary bg-primary/5 cursor-pointer"
              : "border-border-default hover:border-primary cursor-pointer"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <div className="flex items-center justify-center gap-2 text-xs text-text-main/60">
          {uploading ? (
            <>
              <FaSpinner className="w-3.5 h-3.5 animate-spin" />
              Subiendo cover + thumbnail…
            </>
          ) : (
            <>
              <FaCloudUploadAlt className="w-4 h-4 text-text-main/40" />
              {isDefault
                ? "Subí una imagen (opcional, generamos cover + thumbnail)"
                : "Cambiar imagen"}
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-error">{error}</p>
      )}
    </div>
  );
}

// Helper opcional para que páginas que rendericen thumbs sepan resolver
// el fallback a default.
export function resolveThumbUrl(thumb: string, cover: string): string {
  const t = thumb?.trim();
  if (t && !LEGACY_DEFAULT_THUMBS.has(t)) return t;
  const c = cover?.trim();
  if (c && !LEGACY_DEFAULT_COVERS.has(c)) return c;
  return DEFAULT_TALLER_COVER_IMAGE_THUMB;
}
