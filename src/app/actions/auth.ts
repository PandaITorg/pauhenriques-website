"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

// ===== SCHEMA DE VALIDACIÓN =====
const CreateUserProfileSchema = z.object({
  uid: z.string().min(1),
  nombre: z.string().min(2).max(50),
  apellido: z.string().min(2).max(50),
  email: z.string().email(),
  telefono: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  provider: z.enum(["email", "google"]),
});

type CreateUserProfileInput = z.infer<typeof CreateUserProfileSchema>;

// ===== SERVER ACTION =====
export async function createUserProfile(input: CreateUserProfileInput) {
  // Validar input con Zod (Confianza Cero)
  const parsed = CreateUserProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Datos de usuario inválidos",
      details: parsed.error.flatten(),
    };
  }

  const { uid, nombre, apellido, email, telefono, photoURL, provider } =
    parsed.data;

  try {
    const userRef = dbAdmin.collection("users").doc(uid);

    // Verificar si el perfil ya existe (para no sobreescribir datos)
    const existingDoc = await userRef.get();

    if (existingDoc.exists) {
      // Si ya existe (ej: login con Google por segunda vez), solo actualizar updatedAt
      await userRef.update({
        updatedAt: FieldValue.serverTimestamp(),
        // Actualizar photoURL si cambió
        ...(photoURL && { photoURL }),
      });

      return { success: true, isNew: false };
    }

    // Crear nuevo perfil de usuario
    await userRef.set({
      uid,
      nombre,
      apellido,
      email,
      telefono: telefono ?? null,
      photoURL: photoURL ?? null,
      provider,
      role: "customer",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, isNew: true };
  } catch (error: unknown) {
    console.error("Error al crear perfil de usuario:", error);
    return {
      success: false,
      error: "Error al guardar el perfil. Intenta de nuevo.",
    };
  }
}
