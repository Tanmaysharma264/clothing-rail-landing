import { PLACEHOLDER_ITEMS } from "@/data/placeholder-items";
import { PRICES } from "@/config/store";

export type ProductKind = keyof typeof PRICES;

export type Product = { id: string; name: string; kind: ProductKind; price: number };

/** Looks a product up by id. The price always comes from here, never from the browser. */
export function getProduct(id: string): Product | null {
  const item = PLACEHOLDER_ITEMS.find((p) => p.id === id);
  if (!item) return null;
  const kind: ProductKind = item.kind === "hoodie" ? "hoodie" : "tee";
  return { id: item.id, name: item.name, kind, price: PRICES[kind] };
}
