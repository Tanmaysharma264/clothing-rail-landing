import Image from "next/image";
import { FlipCountdown } from "@/components/flip-countdown";
import { StoreRail } from "@/components/store-rail";
import { DEADLINE } from "@/config/store";

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

      <h2 className="relative mt-3 flex flex-col items-center text-center sm:-mt-2">
        <span className="font-[family-name:var(--font-serif)] text-[clamp(0.95rem,1.5vw,1.3rem)] font-semibold tracking-[0.02em] text-foreground/80">
          Your time to become the
        </span>
        <span className="relative mt-1 inline-block">
          <span className="font-[family-name:var(--font-display)] text-[clamp(2.2rem,4.4vw,3.6rem)] uppercase leading-[0.9] tracking-[0.01em]">
            Chillest
          </span>
          <span className="pointer-events-none absolute -bottom-[0.35em] right-[-0.3em] -rotate-6 whitespace-nowrap font-[family-name:var(--font-script)] text-[clamp(1.5rem,3.2vw,2.6rem)] leading-none text-[#ff0a8f] [text-shadow:0_0_0.5em_rgb(255_255_255/0.9)]">
            in the room
          </span>
        </span>
      </h2>

      {/* rail first, countdown underneath; centred in the free space on tall phones */}
      <div className="flex w-full flex-1 flex-col items-center justify-center sm:justify-start">
        <div className="mt-6 w-full sm:-mt-1">
          <StoreRail />
        </div>

        <FlipCountdown to={DEADLINE} label="COP BEFORE" className="mt-2 pb-8 sm:-mt-2" />
      </div>
    </main>
  );
}
