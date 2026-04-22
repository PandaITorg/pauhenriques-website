"use client";

import { useState } from "react";
import { z } from "zod";
import { FaUser, FaIdCard, FaEnvelope, FaPhone, FaArrowRight } from "react-icons/fa";

export const guestInfoSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre")
    .max(50, "Demasiado largo"),
  lastName: z
    .string()
    .trim()
    .min(2, "Ingresa tu apellido")
    .max(50, "Demasiado largo"),
  idNumber: z
    .string()
    .trim()
    .min(5, "Cédula o pasaporte inválido")
    .max(20, "Cédula o pasaporte inválido"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s-]{6,16}$/, "Teléfono inválido"),
});

export type GuestInfoValues = z.infer<typeof guestInfoSchema>;

interface GuestInfoFormProps {
  initial?: Partial<GuestInfoValues>;
  onSubmit: (values: GuestInfoValues) => void;
  disabled?: boolean;
  submitLabel?: string;
}

type FieldErrors = Partial<Record<keyof GuestInfoValues, string>>;

export default function GuestInfoForm({
  initial,
  onSubmit,
  disabled,
  submitLabel = "Continuar al pago",
}: GuestInfoFormProps) {
  const [values, setValues] = useState<GuestInfoValues>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    idNumber: initial?.idNumber ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function update<K extends keyof GuestInfoValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = guestInfoSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof GuestInfoValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id="firstName"
          label="Nombre"
          icon={<FaUser className="w-3.5 h-3.5" />}
          value={values.firstName}
          onChange={(v) => update("firstName", v)}
          error={errors.firstName}
          autoComplete="given-name"
          disabled={disabled}
        />
        <Field
          id="lastName"
          label="Apellido"
          icon={<FaUser className="w-3.5 h-3.5" />}
          value={values.lastName}
          onChange={(v) => update("lastName", v)}
          error={errors.lastName}
          autoComplete="family-name"
          disabled={disabled}
        />
      </div>

      <Field
        id="idNumber"
        label="Cédula o pasaporte"
        icon={<FaIdCard className="w-3.5 h-3.5" />}
        value={values.idNumber}
        onChange={(v) => update("idNumber", v)}
        error={errors.idNumber}
        autoComplete="off"
        disabled={disabled}
      />

      <Field
        id="email"
        label="Correo electrónico"
        icon={<FaEnvelope className="w-3.5 h-3.5" />}
        value={values.email}
        onChange={(v) => update("email", v)}
        error={errors.email}
        type="email"
        autoComplete="email"
        hint="Aquí recibirás el comprobante y el acceso al curso."
        disabled={disabled}
      />

      <Field
        id="phone"
        label="Teléfono"
        icon={<FaPhone className="w-3.5 h-3.5" />}
        value={values.phone}
        onChange={(v) => update("phone", v)}
        error={errors.phone}
        type="tel"
        autoComplete="tel"
        placeholder="+593 99 123 4567"
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.97] disabled:bg-surface-elevated disabled:text-text-main/30 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitLabel}
        <FaArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}

function Field({
  id,
  label,
  icon,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  placeholder,
  hint,
  disabled,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-main/60 mb-1.5">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 bg-background border rounded-lg px-3 transition-colors ${
          error
            ? "border-error"
            : "border-border-default focus-within:border-primary"
        }`}
      >
        <span className="text-text-main/40">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent py-2.5 text-sm text-text-main placeholder:text-text-main/30 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-text-main/40">{hint}</p>
      ) : null}
    </div>
  );
}
