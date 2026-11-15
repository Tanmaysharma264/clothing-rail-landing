"use client";

import * as React from "react";

type Props = {
  /** Deadline as an ISO date with a time zone, e.g. "2026-11-20T23:59:59+05:30". */
  to: string;
  label?: string;
  /** Shown instead of `label` once the deadline has passed. */
  endedLabel?: string;
  className?: string;
};

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

/** One half of a flip tile: shows the top or bottom half of a single digit. */
function Half({ digit, pos, className = "" }: { digit: string; pos: "top" | "bottom"; className?: string }) {
  return (
    <span
      className={`absolute inset-x-0 h-1/2 overflow-hidden ${pos === "top" ? "top-0 rounded-t-[0.14em] bg-[#2d2d30]" : "bottom-0 rounded-b-[0.14em] bg-[#1d1d20]"} ${className}`}
    >
      <span className={`absolute inset-x-0 flex h-[200%] items-center justify-center ${pos === "top" ? "top-0" : "bottom-0"}`}>{digit}</span>
    </span>
  );
}

function FlipDigit({ value }: { value: string }) {
  // Remember the previous digit so the old one can fold away while the new one folds in.
  const [state, setState] = React.useState({ prev: value, cur: value, n: 0 });
  if (state.cur !== value) setState({ prev: state.cur, cur: value, n: state.n + 1 });
  const { prev, cur, n } = state;

  return (
    <span aria-hidden="true" className="relative inline-block h-[1.3em] w-[0.7em] text-center font-[family-name:var(--font-flip)] font-semibold leading-none text-white [perspective:20em]">
      <Half digit={cur} pos="top" />
      <Half digit={prev} pos="bottom" />
      {n > 0 && (
        <>
          <Half key={`t${n}`} digit={prev} pos="top" className="flip-top z-[2] [backface-visibility:hidden] [transform-origin:bottom]" />
          <Half key={`b${n}`} digit={cur} pos="bottom" className="flip-bottom z-[2] [backface-visibility:hidden] [transform-origin:top]" />
        </>
      )}
      {/* centre seam */}
      <span className="absolute inset-x-0 top-1/2 z-[3] h-px -translate-y-1/2 bg-black/60" />
      <span className="absolute -left-px top-1/2 z-[3] h-[0.16em] w-[0.05em] -translate-y-1/2 rounded-full bg-black/70" />
      <span className="absolute -right-px top-1/2 z-[3] h-[0.16em] w-[0.05em] -translate-y-1/2 rounded-full bg-black/70" />
    </span>
  );
}

function Group({ value, size, label }: { value: number; size: number; label: string }) {
  const text = String(value).padStart(size, "0");
  return (
    <div className="flex flex-col items-center gap-[0.55em]">
      <div className="flex gap-[0.12em]">
        {text.split("").map((digit, i) => (
          <FlipDigit key={`${size - text.length + i}`} value={digit} />
        ))}
      </div>
      <span className="text-[clamp(8px,0.7vw+4px,11px)] font-medium uppercase leading-none tracking-[0.12em] text-foreground/70">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <span aria-hidden="true" className="flex h-[1.3em] flex-col items-center justify-center gap-[0.22em]">
      <span className="size-[0.1em] rounded-full bg-foreground/70" />
      <span className="size-[0.1em] rounded-full bg-foreground/70" />
    </span>
  );
}

export function FlipCountdown({ to, label = "COPE BEFORE", endedLabel = "ORDERS CLOSED", className = "" }: Props) {
  const target = React.useMemo(() => new Date(to).getTime(), [to]);
  const [now, setNow] = React.useState(null as number | null);

  React.useEffect(() => {
    setNow(Date.now());
    let timer = 0;
    const tick = () => {
      setNow(Date.now());
      // wake just after the next whole second so the clock never drifts
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => window.clearTimeout(timer);
  }, []);

  const t = now === null ? null : parts(target - now);
  const spoken = t ? `${t.days} days, ${t.hours} hours, ${t.minutes} minutes and ${t.seconds} seconds left` : "Loading countdown";

  return (
    <div className={`flex flex-col items-center gap-[0.9em] ${className}`}>
      <p className="font-[family-name:var(--font-display)] text-[clamp(0.7rem,1.1vw,0.95rem)] uppercase tracking-[0.06em]">
        {t?.done ? endedLabel : label}
      </p>
      {/* the clock scales with this font size */}
      <div role="timer" aria-label={spoken} className="flex min-h-[1.9em] items-start gap-[0.5em] text-[clamp(1.35rem,3.2vw,2.5rem)]">
        {t && (
          <>
            <Group value={t.days} size={3} label="Days" />
            <Colon />
            <Group value={t.hours} size={2} label="Hrs" />
            <Colon />
            <Group value={t.minutes} size={2} label="Mins" />
            <Colon />
            <Group value={t.seconds} size={2} label="Secs" />
          </>
        )}
      </div>
    </div>
  );
}
