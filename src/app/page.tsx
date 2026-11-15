import Image from "next/image";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import { FlipCountdown } from "@/components/flip-countdown";
import { PLACEHOLDER_ITEMS } from "@/data/placeholder-items";

// Orders close at the end of 20 November 2026 (India time, IST).
const DEADLINE = "2026-11-20T23:59:59+05:30";

export default function Home() {
  return (
    <main className="relative isolate flex min-h-svh w-full flex-col items-center overflow-hidden bg-background text-foreground">
      {/* soft pink blob behind everything */}
      <Image
        src="/brand/pink-blob.webp"
        alt=""
        width={900}
        height={917}
        priority
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[8%] -z-10 h-[88%] w-auto max-w-none -translate-x-[48%] select-none opacity-45"
      />

      <header className="relative grid w-full grid-cols-[1fr_auto_1fr] items-start gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <Image
          src="/brand/chillcom-logo.webp"
          alt="Chill Com"
          width={900}
          height={557}
          priority
          className="w-[clamp(64px,9vw,150px)] justify-self-start"
        />
        <h1 className="self-center pt-1 text-center font-[family-name:var(--font-display)] text-[clamp(0.7rem,1.6vw,1.4rem)] uppercase tracking-[0.04em] sm:pt-2">
          STORE_CHILLCOM
        </h1>
        <Image
          src="/brand/chillest-logo.webp"
          alt="Chillest in the Room, est. 2025"
          width={900}
          height={685}
          priority
          className="w-[clamp(56px,8vw,130px)] justify-self-end"
        />
      </header>

      <FlipCountdown to={DEADLINE} label="COPE BEFORE" className="mt-2 sm:mt-0" />

      <div className="mt-2 flex w-full flex-1 items-center sm:-mt-4 sm:items-start">
        <ClothingRailHero
          items={PLACEHOLDER_ITEMS}
          hanger="none"
          showCaption={false}
          autoplay
          className="bg-transparent! [&>[data-backdrop]]:hidden"
        />
      </div>
    </main>
  );
}
