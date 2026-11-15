"use client";

import ClothingRailHero from "@/components/ui/product-rail-gallery";
import { OrderPanel } from "@/components/order-panel";
import { PLACEHOLDER_ITEMS } from "@/data/placeholder-items";

/** The clothing rail with the Shop / order panel inside each product's detail view. */
export function StoreRail() {
  return (
    <ClothingRailHero
      items={PLACEHOLDER_ITEMS}
      hanger="none"
      showCaption={false}
      autoplay
      className="bg-transparent! [&>[data-backdrop]]:hidden"
      renderDetail={(item) => <OrderPanel key={item.id} item={item} />}
    />
  );
}
