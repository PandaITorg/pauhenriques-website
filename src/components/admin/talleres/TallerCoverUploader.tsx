"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { FaCloudUploadAlt, FaSpinner, FaTrash } from "react-icons/fa";
import { DEFAULT_TALLER_COVER_IMAGE } from "@/lib/talleres/types";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
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

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function TallerCoverUploader({ value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tratamos tanto el default actual como el legacy .webp como "imagen por
  // defecto" — el doc puede tener el path viejo guardado en Firestore.
  const LEGACY_DEFAULTS = new Set([
    DEFAULT_TALLER_COVER_IMAGE,
    "/assets/de-toxica-a-sin-toxicos.webp",
  ]);
  const trimmed = value?.trim() ?? "";
  const isDefault = !trimmed || LEGACY_DEFAULTS.has(trimmed);
  const previewUrl = isDefault ? DEFAULT_TALLER_COVER_IMAGE : trimmed;

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        let processed: File;
        try {
          processed = await compressImage(file);
        } catch {
          processed = file;
        }
        const formData = new FormData();
        formData.append("file", processed);
        formData.append("folder", "talleres");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error || "Error al subir la imagen");
          return;
        }
        onChange(data.url);
      } catch {
        setError("Error de conexión al subir");
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
    onChange("");
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
              Subiendo…
            </>
          ) : (
            <>
              <FaCloudUploadAlt className="w-4 h-4 text-text-main/40" />
              {isDefault
                ? "Subí una imagen (opcional, se redimensiona a 1600px)"
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
