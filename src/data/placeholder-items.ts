import type { RailGarment } from "@/components/ui/product-rail-gallery";

// Chillcom products shown on the rail. Names, prices and descriptions are
// PLACEHOLDERS: edit them here. Photos live in /public/products and must be
// transparent WebP cut-outs on the same 1096 x 1436 canvas (front, back and
// side of one piece share the same framing so it does not resize when it turns).
const P = "/products";

const TEE_DETAILS = ["Oversized fit", "Dropped shoulder", "Front print"];
// Hoodie `image` is the BACK (the main print); `backImage` is the chest/front.
const HOODIE_LABELS = { front: "Back", back: "Front" };
const HOODIE_DETAILS = ["Oversized fit", "Kangaroo pocket", "Back print", "Sleeve print"];

const PIECES: RailGarment[] = [
  {
    id: "tee-shattered-disc",
    name: "Shattered Disc Tee · Black",
    kind: "tee",
    color: "#101214",
    tag: "$48",
    description: "Oversized black tee with a shattered pink disc and the Chillcom wordmark on the front. Thorn print on the sleeve.",
    details: [...TEE_DETAILS, "Sleeve print"],
    image: `${P}/tee-1-front.webp`,
    backImage: `${P}/tee-black-back.webp`,
    sideImage: `${P}/tee-black-side.webp`,
  },
  {
    id: "tee-falling-figure",
    name: "Falling Figure Tee · Black",
    kind: "tee",
    color: "#101214",
    tag: "$48",
    description: "Oversized black tee with a falling figure in white and a pink Chillcom logotype on the front. Thorn print on the sleeve.",
    details: [...TEE_DETAILS, "Sleeve print"],
    image: `${P}/tee-2-front.webp`,
    backImage: `${P}/tee-black-back.webp`,
    sideImage: `${P}/tee-black-side.webp`,
  },
  {
    id: "tee-popsicle-black",
    name: "Popsicle Tee · Black",
    kind: "tee",
    color: "#101214",
    tag: "$52",
    description: "Oversized black tee with a melting pink popsicle and bold pink lettering on the front. Thorn print on the sleeve.",
    details: [...TEE_DETAILS, "Sleeve print"],
    image: `${P}/tee-3-front.webp`,
    backImage: `${P}/tee-black-back.webp`,
    sideImage: `${P}/tee-black-side.webp`,
  },
  {
    id: "tee-skeleton",
    name: "Skeleton Tee · Black",
    kind: "tee",
    color: "#101214",
    tag: "$52",
    description: "Oversized black tee with a white skeleton and pink Chillcom lettering on the front. Thorn print on the sleeve.",
    details: [...TEE_DETAILS, "Sleeve print"],
    image: `${P}/tee-4-front.webp`,
    backImage: `${P}/tee-black-back.webp`,
    sideImage: `${P}/tee-black-side.webp`,
  },
  {
    id: "tee-popsicle-white",
    name: "Popsicle Tee · White",
    kind: "tee",
    color: "#E9EAEC",
    tag: "$52",
    description: "Oversized white tee with a melting pink popsicle and bold pink lettering on the front.",
    details: TEE_DETAILS,
    image: `${P}/tee-5-front.webp`,
    backImage: `${P}/tee-white-back.webp`,
    sideImage: `${P}/tee-white-side.webp`,
  },
  {
    id: "tee-chill-culture",
    name: "Chill Culture Tee · White",
    kind: "tee",
    color: "#E9EAEC",
    tag: "$56",
    description: "Oversized white tee with a big pink Chill Com wordmark and a black-and-white group illustration on the front.",
    details: TEE_DETAILS,
    image: `${P}/tee-6-front.webp`,
    backImage: `${P}/tee-white-back.webp`,
    sideImage: `${P}/tee-white-side.webp`,
  },
  {
    id: "hoodie-falling-figure",
    name: "Falling Figure Hoodie · Black",
    kind: "hoodie",
    color: "#101214",
    tag: "$88",
    description: "Oversized black hoodie with a large falling-figure graphic on the back and a small pink logo on the chest. Thorn print on the sleeve.",
    details: HOODIE_DETAILS,
    labels: HOODIE_LABELS,
    image: `${P}/hoodie-1-back.webp`,
    backImage: `${P}/hoodie-front-logo.webp`,
    sideImage: `${P}/hoodie-side.webp`,
  },
  {
    id: "hoodie-skeleton",
    name: "Skeleton Hoodie · Black",
    kind: "hoodie",
    color: "#101214",
    tag: "$92",
    description: "Oversized black hoodie with a large skeleton graphic on the back and a Chillest in the Room mark on the chest. Thorn print on the sleeve.",
    details: HOODIE_DETAILS,
    labels: HOODIE_LABELS,
    image: `${P}/hoodie-2-back.webp`,
    backImage: `${P}/hoodie-front-chillest.webp`,
    sideImage: `${P}/hoodie-side.webp`,
  },
  {
    id: "hoodie-shattered-disc",
    name: "Shattered Disc Hoodie · Black",
    kind: "hoodie",
    color: "#101214",
    tag: "$92",
    description: "Oversized black hoodie with a shattered pink disc and white wordmark on the back and a small pink logo on the chest. Thorn print on the sleeve.",
    details: HOODIE_DETAILS,
    labels: HOODIE_LABELS,
    image: `${P}/hoodie-3-back.webp`,
    backImage: `${P}/hoodie-front-logo.webp`,
    sideImage: `${P}/hoodie-side.webp`,
  },
  {
    id: "hoodie-popsicle",
    name: "Popsicle Hoodie · Black",
    kind: "hoodie",
    color: "#101214",
    tag: "$88",
    description: "Oversized black hoodie with a melting pink popsicle on the back and a Chillest in the Room mark on the chest. Thorn print on the sleeve.",
    details: HOODIE_DETAILS,
    labels: HOODIE_LABELS,
    image: `${P}/hoodie-4-back.webp`,
    backImage: `${P}/hoodie-front-chillest.webp`,
    sideImage: `${P}/hoodie-side.webp`,
  },
];

// Fixed mixed order on the rail (tees and hoodies interleaved, no two similar
// designs side by side). Change this list to re-order the rail.
const ORDER = [
  "hoodie-skeleton",
  "tee-popsicle-white",
  "tee-shattered-disc",
  "hoodie-popsicle",
  "tee-skeleton",
  "tee-chill-culture",
  "hoodie-falling-figure",
  "tee-popsicle-black",
  "hoodie-shattered-disc",
  "tee-falling-figure",
];

export const PLACEHOLDER_ITEMS: RailGarment[] = ORDER.map((id) => {
  const piece = PIECES.find((item) => item.id === id);
  if (!piece) throw new Error(`Unknown product id in ORDER: ${id}`);
  return piece;
});
