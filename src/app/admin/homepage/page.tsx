"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaSpinner,
  FaTimes,
  FaChevronUp,
  FaChevronDown,
  FaToggleOn,
  FaToggleOff,
  FaCloudUploadAlt,
} from "react-icons/fa";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlideRow {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageMobile?: string;
  videoUrl?: string;
  ctaText: string;
  ctaLink: string;
  ctaStyle: "primary" | "secondary";
  template: "full-image" | "split" | "immersive";
  textStyle: "none" | "opaque" | "glass";
  overlayOpacity: number;
  order: number;
  active: boolean;
}

const EMPTY_FORM: Omit<SlideRow, "id"> = {
  title: "",
  subtitle: "",
  imageUrl: "",
  imageMobile: "",
  videoUrl: "",
  ctaText: "",
  ctaLink: "/",
  ctaStyle: "primary",
  template: "full-image",
  textStyle: "none",
  overlayOpacity: 0.5,
  order: 0,
  active: true,
};

const DEFAULT_SLIDE: Omit<SlideRow, "id"> = {
  title: "Transforma tu hogar, transforma tu salud",
  subtitle: "Productos premium libres de tóxicos para cada rincón de tu vida",
  imageUrl: "",
  imageMobile: "",
  videoUrl: "",
  ctaText: "Explorar Catálogo",
  ctaLink: "/tienda-infrarrojo",
  ctaStyle: "primary",
  template: "full-image",
  textStyle: "none",
  overlayOpacity: 0.5,
  order: 0,
  active: true,
};

// ── Image uploader (inline, single image) ─────────────────────────────────────

function SingleImageUploader({
  value,
  onChange,
  label,
  folder = "slides/temp",
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          onChange(data.url);
        }
      } catch {
        // silent
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [folder, onChange],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-text-main/60 uppercase tracking-wide">
        {label}
      </label>
      {value ? (
        <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-border-default">
          <Image src={value} alt={label} fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-error text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border-default hover:border-primary bg-surface-elevated"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
          {uploading ? (
            <FaSpinner className="w-6 h-6 text-primary mx-auto animate-spin" />
          ) : (
            <FaCloudUploadAlt className="w-6 h-6 text-text-main/30 mx-auto" />
          )}
          <p className="mt-2 text-xs text-text-main/50">
            {uploading ? "Subiendo..." : "Arrastra o haz clic para subir"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminHomepagePage() {
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SlideRow, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides");
      if (res.ok) setSlides(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: slides.length });
    setShowForm(true);
  };

  const openEdit = (slide: SlideRow) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      imageUrl: slide.imageUrl,
      imageMobile: slide.imageMobile ?? "",
      videoUrl: slide.videoUrl ?? "",
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      ctaStyle: slide.ctaStyle,
      template: slide.template,
      textStyle: slide.textStyle,
      overlayOpacity: slide.overlayOpacity,
      order: slide.order,
      active: slide.active,
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const set = <K extends keyof Omit<SlideRow, "id">>(key: K, value: Omit<SlideRow, "id">[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/slides/${editingId}` : "/api/admin/slides";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchSlides();
        closeForm();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/slides/${id}`, { method: "DELETE" });
      if (res.ok) setSlides((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (slide: SlideRow) => {
    const res = await fetch(`/api/admin/slides/${slide.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !slide.active }),
    });
    if (res.ok) setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, active: !s.active } : s))
    );
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const newSlides = [...slides];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];

    // update order field on both
    const updates = [
      { id: newSlides[index].id, order: index },
      { id: newSlides[target].id, order: target },
    ];
    newSlides[index] = { ...newSlides[index], order: index };
    newSlides[target] = { ...newSlides[target], order: target };
    setSlides(newSlides);

    await Promise.all(
      updates.map(({ id, order }) =>
        fetch(`/api/admin/slides/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        })
      )
    );
  };

  const handleSeedDefault = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...DEFAULT_SLIDE, order: slides.length }),
      });
      if (res.ok) await fetchSlides();
    } finally {
      setSeeding(false);
    }
  };

  const inputClass =
    "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 px-3 py-2.5 w-full";

  const selectClass = `${inputClass} cursor-pointer`;

  const labelClass = "block text-xs font-medium text-text-main/60 uppercase tracking-wide mb-1.5";

  const templateBadge = (t: SlideRow["template"]) => {
    const map: Record<SlideRow["template"], string> = {
      "full-image": "bg-primary/15 text-primary",
      split: "bg-info/15 text-info",
      immersive: "bg-warning/15 text-warning",
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[t]}`}>{t}</span>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6 flex items-center justify-between">
          <div>
            <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
              Contenido
            </span>
            <h1 className="text-2xl font-semibold text-text-main">Homepage</h1>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 text-sm hover:-translate-y-px hover:shadow-(--shadow-glow-primary) cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo Slide</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* Tab label */}
      <div className="px-5 lg:px-8 pt-5 pb-2">
        <div className="inline-flex items-center gap-2 border-b-2 border-primary pb-2">
          <span className="text-sm font-medium text-text-main">Hero Slides</span>
          {!loading && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {slides.filter((s) => s.active).length} activos
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-8 pb-8 pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="simple-spinner" />
          </div>
        ) : slides.length === 0 ? (
          <div className="bg-surface-card border border-border-subtle rounded-xl p-10 text-center">
            <FaImage className="w-10 h-10 text-text-main/20 mx-auto mb-4" />
            <p className="text-text-main/50 mb-1">No hay slides en el hero.</p>
            <p className="text-text-main/30 text-sm mb-6">
              Crea un slide o inicia con la configuración por defecto.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={openNew}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer"
              >
                <FaPlus className="w-3.5 h-3.5" /> Crear slide
              </button>
              <button
                onClick={handleSeedDefault}
                disabled={seeding}
                className="flex items-center gap-2 border border-border-default text-text-main/60 hover:text-text-main hover:border-primary font-medium px-4 py-2.5 rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {seeding ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : null}
                Slide por defecto
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="bg-surface-card border border-border-subtle rounded-xl p-4 flex items-center gap-4"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleReorder(i, "up")}
                    disabled={i === 0}
                    className="p-1 text-text-main/30 hover:text-text-main disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  >
                    <FaChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleReorder(i, "down")}
                    disabled={i === slides.length - 1}
                    className="p-1 text-text-main/30 hover:text-text-main disabled:opacity-20 cursor-pointer disabled:cursor-default"
                  >
                    <FaChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-surface-elevated shrink-0">
                  {slide.imageUrl ? (
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaImage className="w-4 h-4 text-text-main/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-text-main text-sm truncate">{slide.title}</p>
                    {templateBadge(slide.template)}
                  </div>
                  <p className="text-xs text-text-main/40 truncate">{slide.subtitle}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className="text-xl cursor-pointer transition-colors"
                    title={slide.active ? "Desactivar" : "Activar"}
                  >
                    {slide.active ? (
                      <FaToggleOn className="text-success" />
                    ) : (
                      <FaToggleOff className="text-text-main/30" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(slide)}
                    className="p-2 text-text-main/30 hover:text-primary transition-colors cursor-pointer"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id, slide.title)}
                    disabled={deleting === slide.id}
                    className="p-2 text-text-main/30 hover:text-error transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleting === slide.id ? (
                      <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FaTrash className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide form modal ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-text-main">
                {editingId ? "Editar Slide" : "Nuevo Slide"}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 text-text-main/40 hover:text-text-main transition-colors cursor-pointer"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-5">
              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SingleImageUploader
                  label="Imagen Principal"
                  value={form.imageUrl}
                  onChange={(url) => set("imageUrl", url)}
                  folder="slides/temp"
                />
                <SingleImageUploader
                  label="Imagen Mobile (opcional)"
                  value={form.imageMobile ?? ""}
                  onChange={(url) => set("imageMobile", url)}
                  folder="slides/temp"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className={labelClass}>URL de Video (opcional, MP4)</label>
                <input
                  type="url"
                  value={form.videoUrl ?? ""}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              {/* Title + Subtitle */}
              <div>
                <label className={labelClass}>Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Transforma tu hogar..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="Descripción corta del slide"
                  className={inputClass}
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Texto del CTA</label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => set("ctaText", e.target.value)}
                    placeholder="Explorar Catálogo"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Link del CTA</label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) => set("ctaLink", e.target.value)}
                    placeholder="/tienda"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Dropdowns row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Estilo CTA</label>
                  <select
                    value={form.ctaStyle}
                    onChange={(e) => set("ctaStyle", e.target.value as SlideRow["ctaStyle"])}
                    className={selectClass}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Template</label>
                  <select
                    value={form.template}
                    onChange={(e) => set("template", e.target.value as SlideRow["template"])}
                    className={selectClass}
                  >
                    <option value="full-image">Full Image</option>
                    <option value="split">Split</option>
                    <option value="immersive">Immersive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Estilo Texto</label>
                  <select
                    value={form.textStyle}
                    onChange={(e) => set("textStyle", e.target.value as SlideRow["textStyle"])}
                    className={selectClass}
                  >
                    <option value="none">Ninguno</option>
                    <option value="opaque">Opaco</option>
                    <option value="glass">Glass</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Orden</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={(e) => set("order", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Overlay opacity slider */}
              <div>
                <label className={labelClass}>
                  Opacidad Overlay — {Math.round(form.overlayOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={form.overlayOpacity}
                  onChange={(e) => set("overlayOpacity", parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-main/30 mt-1">
                  <span>10%</span>
                  <span>90%</span>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-surface-elevated rounded-xl px-4 py-3">
                <span className="text-sm text-text-main/70">Slide activo</span>
                <button
                  type="button"
                  onClick={() => set("active", !form.active)}
                  className="text-2xl cursor-pointer"
                >
                  {form.active ? (
                    <FaToggleOn className="text-success" />
                  ) : (
                    <FaToggleOff className="text-text-main/30" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={closeForm}
                className="px-5 py-2.5 text-sm font-medium text-text-main/60 hover:text-text-main border border-border-default rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl transition-all hover:shadow-(--shadow-glow-primary) cursor-pointer disabled:opacity-60"
              >
                {saving && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
                {editingId ? "Guardar cambios" : "Crear slide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
