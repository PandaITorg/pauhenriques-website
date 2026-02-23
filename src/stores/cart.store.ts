import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, InfrrarrojoProduct } from "@/types/product";

// Definimos el tipo para un item en el carrito, que extiende el producto y añade la cantidad
export interface CartItem extends InfrrarrojoProduct {
  quantity: number;
}

// Definimos la interfaz del estado de nuestro store
interface CartState {
  items: CartItem[];
  addItem: (product: InfrrarrojoProduct) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  // El middleware `persist` guarda el estado en localStorage
  persist(
    (set, get) => ({
      items: [],

      // Acción para añadir un item al carrito
      addItem: (product) => {
        // REGLA DE NEGOCIO: Solo se pueden añadir al carrito productos de la marca 'wellme'
        if (product.brand !== "wellme") {
          // En una app real, podrías mostrar una notificación al usuario.
          // Por ahora, solo lo prevenimos y lo mostramos en consola.
          console.warn(
            "Intento de agregar un producto no vendible (Carico) al carrito. Operación ignorada.",
          );
          return;
        }

        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.id === product.id,
        );

        if (existingItem) {
          // Si el item ya existe, incrementamos su cantidad
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          // Si es un item nuevo, lo añadimos al array con cantidad 1
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },

      // Acción para remover un item del carrito por su ID
      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      // Acción para vaciar el carrito completamente
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "pau-henriques-cart-storage", // Nombre único para el item en localStorage
    },
  ),
);
