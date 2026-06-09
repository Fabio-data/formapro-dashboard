import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: { kind: "up" | "down" | "flat"; text: ReactNode };
  emphasis?: "default" | "primary" | "warn" | "danger";
};

const DELTA_ICON: Record<"up" | "down" | "flat", string> = {
  up: "▲",
  down: "▼",
  flat: "·",
};

const DELTA_CLASS: Record<"up" | "down" | "flat", string> = {
  up: "text-[color:var(--color-accent-strong)]",
  down: "text-[color:var(--color-danger)]",
  flat: "text-[color:var(--color-muted)]",
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  emphasis = "default",
}: Props) {
  return (
    <div
      className={clsx(
        "card p-5 flex flex-col gap-2",
        emphasis === "primary" && "border-[color:var(--color-accent)]/30",
        emphasis === "warn" && "border-[color:var(--color-warn)]/35",
        emphasis === "danger" && "border-[color:var(--color-danger)]/35",
      )}
    >
      <div className="label-eyebrow">{label}</div>
      <div
        className={clsx(
          "font-medium tracking-tight tabular-nums mono leading-tight",
          "text-[22px] sm:text-[24px] md:text-[28px]",
          "break-words min-w-0",
          emphasis === "primary" && "text-[color:var(--color-accent-strong)]",
          emphasis === "warn" && "text-[color:var(--color-warn-ink)]",
          emphasis === "danger" && "text-[color:var(--color-danger-ink)]",
        )}
      >
        {value}
      </div>
      {delta && (
        <div
          className={clsx(
            "text-xs font-medium flex items-center gap-1 mt-0.5",
            DELTA_CLASS[delta.kind],
          )}
        >
          <span>{DELTA_ICON[delta.kind]}</span>
          <span>{delta.text}</span>
        </div>
      )}
      {hint && !delta && (
        <div className="text-xs text-[color:var(--color-muted)] mt-0.5">
          {hint}
        </div>
      )}
    </div>
  );
}
