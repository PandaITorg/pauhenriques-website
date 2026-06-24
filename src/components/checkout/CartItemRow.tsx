import Image from "next/image";
import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";
import { CartItem } from "@/stores/cart.store";
import ProductPlaceholder from "@/components/ui/ProductPlaceholder";

export function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}) {
  const hasImage = item.images && item.images.length > 0;
  const firstImage = hasImage ? item.images[0].replace(/"/g, "").trim() : "";

  return (
    <div className="flex items-center gap-4 border-b border-border-subtle py-4 last:border-b-0">
      <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0 bg-surface-elevated">
        {hasImage ? (
          <Image
            src={firstImage}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}
      </div>
      <div className="grow min-w-0">
        <h3 className="font-semibold text-text-main text-sm truncate">
          {item.name}
        </h3>
        <p className="text-xs text-text-main/45">${item.price.toFixed(2)} c/u</p>
      </div>
      <div className="flex items-center border border-border-default rounded-lg">
        <button
          onClick={() => onUpdateQty(item.id, item.quantity - 1)}
          className="p-2 text-text-main/40 hover:text-text-main transition-colors"
        >
          <FaMinus className="w-2.5 h-2.5" />
        </button>
        <span className="px-2 text-sm font-medium text-text-main min-w-6 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.id, item.quantity + 1)}
          className="p-2 text-text-main/40 hover:text-text-main transition-colors"
        >
          <FaPlus className="w-2.5 h-2.5" />
        </button>
      </div>
      <p className="font-semibold text-text-main text-sm w-20 text-right">
        ${(item.price * item.quantity).toFixed(2)}
      </p>
      <button
        onClick={() => onRemove(item.id)}
        className="text-error/50 hover:text-error p-1 transition-colors"
      >
        <FaTrash className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
