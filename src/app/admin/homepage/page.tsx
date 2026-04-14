"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaChevronUp,
  FaChevronDown,
  FaSpinner,
  FaTimes,
  FaMagic,
  FaDesktop,
  FaMobileAlt,
} from "react-icons/fa";
import SlidePreview from "@/components/homepage/SlidePreview";

interface SlideRow {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageMobile: string;
  videoUrl: string;
  ctaText: string;
  ctaLink: string;
  ctaStyle: "primary" | "secondary" | "ghost" | "gold" | "whatsapp";
  template: "full-image" | "split" | "immersive";
  textStyle: "none" | "opaque" | "glass";
  overlayOpacity: number;
  // Granular customization
  kicker: string;
  titleFont: "cormorant" | "cormorant-italic" | "dancing-script" | "inter";
  titleSize: "md" | "lg" | "xl" | "xxl";
  titleColor: string;
  accentWord: string;
  textPosition:
    | "top-left" | "top-center" | "top-right"
    | "center-left" | "center" | "center-right"
    | "bottom-left" | "bottom-center" | "bottom-right";
  textBackground: "none" | "glass" | "opaque" | "gradient-left" | "gradient-bottom" | "spotlight";
  overlayDirection: "none" | "left" | "right" | "top" | "bottom" | "radial" | "vignette";
  imageEffect: "none" | "ken-burns" | "parallax";
  order: number;
  active: boolean;
}

const EMPTY_SLIDE: Omit<SlideRow, "id"> = {
  title: "",
  subtitle: "",
  imageUrl: "",
  imageMobile: "",
  videoUrl: "",
  ctaText: "",
  ctaLink: "",
  ctaStyle: "primary",
  template: "full-image",
  textStyle: "none",
  overlayOpacity: 0.5,
  kicker: "",
  titleFont: "cormorant",
  titleSize: "lg",
  titleColor: "#ffffff",
  accentWord: "",
  textPosition: "bottom-left",
  textBackground: "gradient-left",
  overlayDirection: "left",
  imageEffect: "ken-burns",
  order: 0,
  active: true,
};

const SEED_SLIDE: Omit<SlideRow, "id"> = {
  title: "Transforma tu hogar, transforma tu salud",
  subtitle: "Productos premium libres de tóxicos para cada rincón de tu vida",
  imageUrl: "/assets/pau-no-bg.webp",
  imageMobile: "",
  videoUrl: "",
  ctaText: "Explorar Catálogo",
  ctaLink: "/tienda-infrarrojo",
  ctaStyle: "primary",
  template: "full-image",
  textStyle: "none",
  overlayOpacity: 0.5,
  kicker: "",
  titleFont: "cormorant",
  titleSize: "xl",
  titleColor: "#ffffff",
  accentWord: "transforma tu salud",
  textPosition: "center-left",
  textBackground: "gradient-left",
  overlayDirection: "left",
  imageEffect: "ken-burns",
  order: 0,
  active: true,
};

const inputClass =
  "bg-input-bg border border-border-default rounded-xl text-sm text-text-main placeholder:text-text-main/35 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 px-3 py-2.5 w-full";

const labelClass = "block text-xs font-medium text-text-main/60 mb-1.5";

function FormSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-elevated hover:bg-surface-elevated/70 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-text-main">{title}</span>
        {open ? (
          <FaChevronUp className="w-3 h-3 text-text-main/40" />
        ) : (
          <FaChevronDown className="w-3 h-3 text-text-main/40" />
        )}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

export default function AdminHomepagePage() {
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideRow | null>(null);
  const [form, setForm] = useState<Omit<SlideRow, "id">>(EMPTY_SLIDE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const fetchSlides = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/slides");
      if (res.ok) {
        setSlides(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(`Error ${res.status}: ${body.error ?? res.statusText}`);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const openCreate = () => {
    const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0;
    setEditingSlide(null);
    setForm({ ...EMPTY_SLIDE, order: nextOrder });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (slide: SlideRow) => {
    setEditingSlide(slide);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = slide;
    setForm(rest);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSlide(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editingSlide
        ? `/api/admin/slides/${editingSlide.id}`
        : "/api/admin/slides";
      const method = editingSlide ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchSlides();
        setModalOpen(false);
      } else {
        const body = await res.json().catch(() => ({}));
        setFormError(body.error ?? "Error al guardar.");
      }
    } catch {
      setFormError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title || "este slide"}"? No se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/slides/${id}`, { method: "DELETE" });
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (slide: SlideRow) => {
    setToggling(slide.id);
    try {
      await fetch(`/api/admin/slides/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !slide.active }),
      });
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, active: !s.active } : s))
      );
    } catch {
      // silent
    } finally {
      setToggling(null);
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const updated = [...slides];
    const aOrder = updated[index].order;
    const bOrder = updated[targetIndex].order;

    // Swap orders
    updated[index] = { ...updated[index], order: bOrder };
    updated[targetIndex] = { ...updated[targetIndex], order: aOrder };

    setSlides(updated.sort((a, b) => a.order - b.order));

    // Persist both
    await Promise.all([
      fetch(`/api/admin/slides/${updated[index].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: bOrder }),
      }),
      fetch(`/api/admin/slides/${updated[targetIndex].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: aOrder }),
      }),
    ]);
  };

  const handleCreateSeed = async () => {
    if (!confirm("¿Crear el slide de ejemplo por defecto?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(SEED_SLIDE),
      });
      if (res.ok) await fetchSlides();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────────

  const uploadImage = useCallback(
    async (file: File, field: "imageUrl" | "imageMobile") => {
      const setUploading = field === "imageUrl" ? setUploadingImage : setUploadingMobile;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({ ...prev, [field]: data.url }));
        }
      } catch {
        // silent
      } finally {
        setUploading(false);
      }
    },
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-warm-950/40 to-background" />
        <div className="relative px-5 lg:px-8 pt-6 pb-4 md:pt-8 md:pb-6 flex items-center justify-between gap-3">
          <div>
            <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-primary/70 mb-1">
              Gestión
            </span>
            <h1 className="text-2xl font-semibold text-text-main">Homepage</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSeed}
              disabled={saving}
              className="flex items-center gap-1.5 border border-border-default hover:border-primary text-text-main/60 hover:text-primary font-medium px-3 py-2 rounded-xl transition-all duration-200 text-xs disabled:opacity-50 cursor-pointer"
              title="Insertar slide de ejemplo"
            >
              <FaMagic className="w-3 h-3" />
              <span className="hidden sm:inline">Slide defecto</span>
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 text-sm hover:-translate-y-px hover:shadow-(--shadow-glow-primary) cursor-pointer"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Slide</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-linear-to-r from-transparent via-border-default to-transparent" />

      {/* Content */}
      <div className="px-5 lg:px-8 py-6">
        <h2 className="text-sm font-medium text-text-main/60 mb-4">Hero Slides</h2>

        {loading ? (
          <div className="py-16 text-center">
            <div className="simple-spinner mx-auto" />
          </div>
        ) : error ? (
          <div className="py-12 text-center bg-surface-card border border-border-subtle rounded-xl">
            <p className="text-error text-sm font-medium mb-1">Error al cargar slides</p>
            <p className="text-text-main/40 text-xs mb-4">{error}</p>
            <button onClick={fetchSlides} className="text-xs text-primary hover:underline cursor-pointer">
              Reintentar
            </button>
          </div>
        ) : slides.length === 0 ? (
          <div className="py-16 text-center bg-surface-card border border-dashed border-border-default rounded-xl">
            <FaImage className="w-10 h-10 text-text-main/15 mx-auto mb-3" />
            <p className="text-text-main/50 text-sm mb-1">Sin slides configurados</p>
            <p className="text-text-main/30 text-xs mb-4">
              El Hero original se mostrará como fallback.
            </p>
            <button
              onClick={handleCreateSeed}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Crear slide de ejemplo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                total={slides.length}
                deleting={deleting === slide.id}
                toggling={toggling === slide.id}
                onEdit={() => openEdit(slide)}
                onDelete={() => handleDelete(slide.id, slide.title)}
                onToggle={() => handleToggleActive(slide)}
                onReorder={(dir) => handleReorder(i, dir)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <SlideModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          formError={formError}
          isEdit={!!editingSlide}
          uploadingImage={uploadingImage}
          uploadingMobile={uploadingMobile}
          imageInputRef={imageInputRef}
          mobileInputRef={mobileInputRef}
          onImageFile={(file) => uploadImage(file, "imageUrl")}
          onMobileFile={(file) => uploadImage(file, "imageMobile")}
        />
      )}
    </div>
  );
}

// ── Slide card ────────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  index,
  total,
  deleting,
  toggling,
  onEdit,
  onDelete,
  onToggle,
  onReorder,
}: {
  slide: SlideRow;
  index: number;
  total: number;
  deleting: boolean;
  toggling: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onReorder: (dir: "up" | "down") => void;
}) {
  const templateColors: Record<SlideRow["template"], string> = {
    "full-image": "bg-primary/15 text-primary",
    split: "bg-info/15 text-info",
    immersive: "bg-tertiary/20 text-tertiary",
  };
  const templateLabels: Record<SlideRow["template"], string> = {
    "full-image": "Full Image",
    split: "Split",
    immersive: "Immersive",
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
      {/* Thumbnail */}
      <div className="w-16 h-12 md:w-20 md:h-14 relative rounded-lg overflow-hidden bg-surface-elevated shrink-0">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={slide.title || "Slide"}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaImage className="w-4 h-4 text-text-main/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-main truncate">
            {slide.title || <span className="italic text-text-main/40">Sin título</span>}
          </p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${templateColors[slide.template]}`}>
            {templateLabels[slide.template]}
          </span>
        </div>
        <p className="text-xs text-text-main/40 mt-0.5 truncate">
          {slide.subtitle || "—"}
        </p>
        <p className="text-[10px] text-text-main/30 mt-0.5">
          Orden {slide.order}
          {slide.ctaText ? ` · CTA: ${slide.ctaText}` : ""}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Reorder */}
        <div className="hidden sm:flex flex-col gap-0.5">
          <button
            onClick={() => onReorder("up")}
            disabled={index === 0}
            className="p-1.5 text-text-main/30 hover:text-text-main disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <FaChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onReorder("down")}
            disabled={index === total - 1}
            className="p-1.5 text-text-main/30 hover:text-text-main disabled:opacity-20 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <FaChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Active toggle */}
        <button
          onClick={onToggle}
          disabled={toggling}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
          title={slide.active ? "Desactivar" : "Activar"}
        >
          {toggling ? (
            <FaSpinner className="w-3 h-3 animate-spin text-text-main/40" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${slide.active ? "bg-success" : "bg-text-main/25"}`} />
          )}
          <span className={`hidden sm:inline ${slide.active ? "text-success" : "text-text-main/40"}`}>
            {slide.active ? "Activo" : "Inactivo"}
          </span>
        </button>

        {/* Edit */}
        <button
          onClick={onEdit}
          className="p-2 text-text-main/30 hover:text-primary transition-colors cursor-pointer"
        >
          <FaEdit className="w-4 h-4" />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-2 text-text-main/30 hover:text-error transition-colors disabled:opacity-50 cursor-pointer"
        >
          {deleting ? (
            <FaSpinner className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FaTrash className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Slide modal ───────────────────────────────────────────────────────────────

function SlideModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
  formError,
  isEdit,
  uploadingImage,
  uploadingMobile,
  imageInputRef,
  mobileInputRef,
  onImageFile,
  onMobileFile,
}: {
  form: Omit<SlideRow, "id">;
  setForm: React.Dispatch<React.SetStateAction<Omit<SlideRow, "id">>>;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  formError: string | null;
  isEdit: boolean;
  uploadingImage: boolean;
  uploadingMobile: boolean;
  imageInputRef: React.RefObject<HTMLInputElement>;
  mobileInputRef: React.RefObject<HTMLInputElement>;
  onImageFile: (file: File) => void;
  onMobileFile: (file: File) => void;
}) {
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const TITLE_COLOR_PRESETS = [
    { value: "#ffffff", label: "Blanco" },
    { value: "#a68a63", label: "Primary" },
    { value: "#D4AF37", label: "Dorado" },
    { value: "#f5ede3", label: "Crema" },
    { value: "#343d2a", label: "Bosque" },
  ];

  const POSITION_ZONES: Array<{ value: SlideRow["textPosition"]; label: string }> = [
    { value: "top-left", label: "↖" },
    { value: "top-center", label: "↑" },
    { value: "top-right", label: "↗" },
    { value: "center-left", label: "←" },
    { value: "center", label: "•" },
    { value: "center-right", label: "→" },
    { value: "bottom-left", label: "↙" },
    { value: "bottom-center", label: "↓" },
    { value: "bottom-right", label: "↘" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-6xl my-4">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-main">
            {isEdit ? "Editar Slide" : "Nuevo Slide"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-main/40 hover:text-text-main transition-colors cursor-pointer"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Body: form + preview */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_560px]">
          {/* ── Form column ── */}
          <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[75vh]">
            {/* ── SECTION: Contenido ── */}
            <FormSection title="Contenido" defaultOpen>
              <div>
                <label className={labelClass}>Kicker / eyebrow (opcional)</label>
                <input
                  type="text"
                  value={form.kicker}
                  onChange={(e) => set("kicker", e.target.value)}
                  placeholder="AHORA DISPONIBLE · PRIMICIA · TIENDA WELL ME"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Transforma tu hogar..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Palabra acento (opcional) — se renderiza en Dancing Script + caramelo
                </label>
                <input
                  type="text"
                  value={form.accentWord}
                  onChange={(e) => set("accentWord", e.target.value)}
                  placeholder="Ej: tienda en línea"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                  placeholder="Descripción breve..."
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <label className={labelClass}>Estilo del botón CTA</label>
                <select
                  value={form.ctaStyle}
                  onChange={(e) => set("ctaStyle", e.target.value as SlideRow["ctaStyle"])}
                  className={inputClass}
                >
                  <option value="primary">Primario (caramelo)</option>
                  <option value="secondary">Secundario (glass)</option>
                  <option value="ghost">Ghost (outline)</option>
                  <option value="gold">Dorado</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </FormSection>

            {/* ── SECTION: Tipografía ── */}
            <FormSection title="Tipografía" defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fuente del título</label>
                  <select
                    value={form.titleFont}
                    onChange={(e) => set("titleFont", e.target.value as SlideRow["titleFont"])}
                    className={inputClass}
                  >
                    <option value="cormorant">Cormorant (elegante)</option>
                    <option value="cormorant-italic">Cormorant Italic</option>
                    <option value="dancing-script">Dancing Script</option>
                    <option value="inter">Inter (bold retail)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tamaño del título</label>
                  <select
                    value={form.titleSize}
                    onChange={(e) => set("titleSize", e.target.value as SlideRow["titleSize"])}
                    className={inputClass}
                  >
                    <option value="md">Mediano</option>
                    <option value="lg">Grande</option>
                    <option value="xl">XL</option>
                    <option value="xxl">XXL (headline)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Color del título</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {TITLE_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => set("titleColor", preset.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        form.titleColor === preset.value ? "border-primary scale-110" : "border-border-default"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.titleColor}
                    onChange={(e) => set("titleColor", e.target.value)}
                    className="w-8 h-8 rounded-full border-2 border-border-default cursor-pointer"
                    title="Color personalizado"
                  />
                  <input
                    type="text"
                    value={form.titleColor}
                    onChange={(e) => set("titleColor", e.target.value)}
                    className={`${inputClass} flex-1 min-w-25 font-mono text-xs`}
                  />
                </div>
              </div>
            </FormSection>

            {/* ── SECTION: Layout ── */}
            <FormSection title="Layout & Fondo de texto" defaultOpen>
              <div>
                <label className={labelClass}>Posición del bloque de texto</label>
                <div className="grid grid-cols-3 gap-1 max-w-45">
                  {POSITION_ZONES.map((zone) => (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => set("textPosition", zone.value)}
                      className={`aspect-square flex items-center justify-center text-lg rounded-lg border transition-all cursor-pointer ${
                        form.textPosition === zone.value
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-elevated border-border-default text-text-main/60 hover:border-primary/50"
                      }`}
                      title={zone.value}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fondo del texto</label>
                  <select
                    value={form.textBackground}
                    onChange={(e) => set("textBackground", e.target.value as SlideRow["textBackground"])}
                    className={inputClass}
                  >
                    <option value="none">Sin fondo</option>
                    <option value="gradient-left">Gradiente lateral</option>
                    <option value="gradient-bottom">Gradiente inferior</option>
                    <option value="spotlight">Spotlight radial</option>
                    <option value="glass">Glass (blur)</option>
                    <option value="opaque">Opaco</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Template</label>
                  <select
                    value={form.template}
                    onChange={(e) => set("template", e.target.value as SlideRow["template"])}
                    className={inputClass}
                  >
                    <option value="full-image">Full Image</option>
                    <option value="split">Split (2 columnas)</option>
                    <option value="immersive">Immersive (video bg)</option>
                  </select>
                </div>
              </div>
            </FormSection>

            {/* ── SECTION: Imagen & Overlay ── */}
            <FormSection title="Imagen & Overlay" defaultOpen={false}>
              <div>
                <label className={labelClass}>Imagen desktop</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => set("imageUrl", e.target.value)}
                    placeholder="https://... o /assets/..."
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onImageFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3 py-2.5 bg-surface-elevated hover:bg-surface-card border border-border-default rounded-xl text-sm text-text-main/60 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {uploadingImage ? <FaSpinner className="w-4 h-4 animate-spin" /> : "Subir"}
                  </button>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 relative w-24 h-16 rounded-lg overflow-hidden bg-surface-elevated">
                    <Image src={form.imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Imagen mobile (opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageMobile}
                    onChange={(e) => set("imageMobile", e.target.value)}
                    placeholder="Dejar vacío para usar la desktop"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    ref={mobileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onMobileFile(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => mobileInputRef.current?.click()}
                    disabled={uploadingMobile}
                    className="px-3 py-2.5 bg-surface-elevated hover:bg-surface-card border border-border-default rounded-xl text-sm text-text-main/60 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {uploadingMobile ? <FaSpinner className="w-4 h-4 animate-spin" /> : "Subir"}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>URL de video (solo template &quot;Immersive&quot;)</label>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Dirección del overlay</label>
                  <select
                    value={form.overlayDirection}
                    onChange={(e) => set("overlayDirection", e.target.value as SlideRow["overlayDirection"])}
                    className={inputClass}
                  >
                    <option value="none">Plano (sin dirección)</option>
                    <option value="left">Desde izquierda</option>
                    <option value="right">Desde derecha</option>
                    <option value="top">Desde arriba</option>
                    <option value="bottom">Desde abajo</option>
                    <option value="radial">Radial (oscuro en bordes)</option>
                    <option value="vignette">Vignette fuerte</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Efecto de imagen</label>
                  <select
                    value={form.imageEffect}
                    onChange={(e) => set("imageEffect", e.target.value as SlideRow["imageEffect"])}
                    className={inputClass}
                  >
                    <option value="none">Ninguno</option>
                    <option value="ken-burns">Ken Burns (zoom sutil)</option>
                    <option value="parallax">Parallax scroll</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  Intensidad del overlay: <span className="text-primary">{Math.round(form.overlayOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.overlayOpacity}
                  onChange={(e) => set("overlayOpacity", parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </FormSection>

            {/* ── SECTION: Visibilidad ── */}
            <FormSection title="Visibilidad & Orden" defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className={labelClass}>Orden</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => set("order", parseInt(e.target.value) || 0)}
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-3 pb-0.5">
                  <label className={`${labelClass} mb-0`}>Activo</label>
                  <button
                    type="button"
                    onClick={() => set("active", !form.active)}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                      form.active ? "bg-success" : "bg-text-main/20"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        form.active ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </FormSection>

            {formError && <p className="text-error text-xs font-medium">{formError}</p>}
          </div>

          {/* ── Preview column ── */}
          <div className="hidden lg:flex flex-col border-l border-border-subtle bg-black/40">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
              <span className="text-xs font-medium text-text-main/60 uppercase tracking-wider">Preview</span>
              <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPreviewViewport("desktop")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    previewViewport === "desktop"
                      ? "bg-primary text-white"
                      : "text-text-main/60 hover:text-text-main"
                  }`}
                >
                  <FaDesktop className="w-3 h-3" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport("mobile")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    previewViewport === "mobile"
                      ? "bg-primary text-white"
                      : "text-text-main/60 hover:text-text-main"
                  }`}
                >
                  <FaMobileAlt className="w-3 h-3" /> Mobile
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <div
                className="origin-center"
                style={{
                  transform: previewViewport === "desktop" ? "scale(0.42)" : "scale(0.72)",
                }}
              >
                <SlidePreview slide={form} viewport={previewViewport} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-text-main/60 hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 text-sm disabled:opacity-60 cursor-pointer hover:shadow-(--shadow-glow-primary)"
          >
            {saving && <FaSpinner className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear slide"}
          </button>
        </div>
      </div>
    </div>
  );
}
