import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InfrrarrojoProduct } from "@/types/product";
import { useToastStore } from "./toast.store";

export interface CartItem extends InfrrarrojoProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: InfrrarrojoProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (product.brand !== "Well Me") {
          console.warn("Solo productos Well Me pueden agregarse al carrito.");
          return;
        }

        const currentItems = get().items;
        const existingItem = currentItems.find(
          (item) => item.id === product.id,
        );

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }

        useToastStore.getState().addToast({
          message: `${product.name} agregado al carrito`,
          type: "success",
        });
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
        });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "pau-henriques-cart-storage",
    },
  ),
);
