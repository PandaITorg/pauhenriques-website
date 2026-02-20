"use server";

import { z } from "zod";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth } from "@/lib/firebase/server-config";

// Zod schema for cart operations
const CartActionSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1).optional(),
  action: z.enum(["add", "remove", "update"]),
});

export async function manageCart(formData: FormData) {
  try {
    // Validate user authentication
    const user = await auth.currentUser;
    if (!user) {
      return { error: "Unauthorized", status: 401 };
    }

    // Parse and validate input
    const result = CartActionSchema.safeParse({
      productId: formData.get("productId"),
      quantity: formData.get("quantity")
        ? Number(formData.get("quantity"))
        : undefined,
      action: formData.get("action"),
    });

    if (!result.success) {
      return { error: "Invalid input", details: result.error, status: 400 };
    }

    const { productId, quantity, action } = result.data;
    const db = getFirestore();
    const userCartRef = doc(db, "user_carts", user.uid);

    switch (action) {
      case "add":
        await updateDoc(userCartRef, {
          items: arrayUnion({
            productId,
            quantity: quantity || 1,
            addedAt: new Date(),
          }),
        });
        break;

      case "remove":
        await updateDoc(userCartRef, {
          items: arrayRemove({ productId }),
        });
        break;

      case "update":
        // More complex update logic would go here
        break;
    }

    return {
      message: `Product ${action}ed successfully`,
      status: 200,
    };
  } catch (error) {
    console.error("Cart management error:", error);
    return {
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      status: 500,
    };
  }
}
