import type { RoomStatus } from "@/lib/interviews/types";
import type { AgentAccent } from "@/lib/sarvam/agents";
import { cn } from "@/lib/utils";

const SPEAKING_GRADIENTS: Record<AgentAccent, string> = {
  cyan: "radial-gradient(circle at 35% 30%, #38bdf8, #0284c7 55%, #0369a1 100%)",
  emerald: "radial-gradient(circle at 35% 30%, #34d399, #059669 55%, #047857 100%)",
  violet: "radial-gradient(circle at 35% 30%, #a78bfa, #7c3aed 55%, #5b21b6 100%)",
  amber: "radial-gradient(circle at 35% 30%, #fbbf24, #d97706 55%, #b45309 100%)",
  rose: "radial-gradient(circle at 35% 30%, #fb7185, #e11d48 55%, #be123c 100%)",
  blue: "radial-gradient(circle at 35% 30%, #60a5fa, #2563eb 55%, #1d4ed8 100%)",
};

const HALO_COLORS: Record<AgentAccent, string> = {
  cyan: "rgba(14, 165, 233, 0.28)",
  emerald: "rgba(16, 185, 129, 0.28)",
  violet: "rgba(139, 92, 246, 0.28)",
  amber: "rgba(245, 158, 11, 0.28)",
  rose: "rgba(244, 63, 94, 0.28)",
  blue: "rgba(59, 130, 246, 0.28)",
};

const BAR_WEIGHTS = [0.52, 0.85, 1.0, 0.82, 0.56];

export function AudioOrb({
  level,
  status,
  accent = "cyan",
}: {
  level: number;
  status: RoomStatus;
  accent?: AgentAccent;
}) {
  const clamped = Math.max(0, Math.min(1, level));
  const isActive = status === "listening" || status === "speaking";
  const scale = isActive ? 1 + Math.min(0.18, clamped * 0.24) : 1;

  const coreBackground =
    status === "listening"
      ? "radial-gradient(circle at 35% 30%, #34d399, #059669 56%, #047857 100%)"
      : status === "speaking"
        ? SPEAKING_GRADIENTS[accent]
        : status === "connecting"
          ? "radial-gradient(circle at 35% 30%, #fcd34d, #d97706 56%, #b45309 100%)"
          : status === "error"
            ? "radial-gradient(circle at 35% 30%, #fb7185, #e11d48 56%, #be123c 100%)"
            : "radial-gradient(circle at 35% 30%, #cbd5e1, #94a3b8 58%, #64748b 100%)";

  const haloColor =
    status === "listening"
      ? "rgba(16, 185, 129, 0.28)"
      : status === "speaking"
        ? HALO_COLORS[accent]
        : status === "connecting"
          ? "rgba(245, 158, 11, 0.24)"
          : status === "error"
            ? "rgba(244, 63, 94, 0.22)"
            : "rgba(148, 163, 184, 0.16)";

  const statusLabel =
    status === "speaking"
      ? "Agent Speaking"
      : status === "listening"
        ? "Listening"
        : status === "connecting"
          ? "Connecting"
          : status === "ending"
            ? "Ending"
            : status === "ended"
              ? "Call Ended"
              : status === "error"
                ? "Error"
                : "Ready";

  return (
    <div
      className="relative mx-auto grid size-[min(64vw,18rem)] place-items-center select-none"
      aria-hidden
    >
      {/* Dynamic soft light halo */}
      <div
        className="pointer-events-none absolute inset-[10%] rounded-full blur-3xl transition-all duration-300"
        style={{
          background: haloColor,
          transform: `scale(${1 + clamped * 0.24})`,
        }}
      />

      {/* Acoustic outer rings */}
      <div
        className={cn(
          "pointer-events-none absolute inset-[4%] rounded-full border border-slate-200/90",
          isActive && "orb-ring",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-[14%] rounded-full border border-slate-300/80",
          (isActive || status === "connecting") && "orb-ring orb-ring-delay",
        )}
      />

      {/* Subtle orbiting dot */}
      {isActive || status === "connecting" ? (
        <div className="orb-orbit pointer-events-none absolute inset-[14%] rounded-full">
          <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(2,132,199,0.75)]" />
        </div>
      ) : null}

      {/* Core reactive sphere */}
      <div
        className="relative grid size-[46%] place-items-center rounded-full shadow-[0_14px_34px_rgba(15,23,42,0.18),inset_0_1px_2px_rgba(255,255,255,0.45)] transition-[transform,background] duration-150"
        style={{
          transform: `scale(${scale})`,
          background: coreBackground,
        }}
      >
        <div className="flex h-10 items-center justify-center gap-1.5">
          {BAR_WEIGHTS.map((weight, idx) => {
            const baseHeight =
              status === "speaking"
                ? 28 + clamped * 72 * weight
                : status === "listening"
                  ? 22 + clamped * 60 * weight
                  : status === "connecting"
                    ? 24 + (idx % 2 === 0 ? 18 : 8)
                    : 18;
            return (
              <span
                key={idx}
                className="w-1.5 rounded-full bg-white transition-[height,opacity] duration-100"
                style={{
                  height: `${Math.min(100, Math.round(baseHeight))}%`,
                  opacity: isActive || status === "connecting" ? 0.96 : 0.7,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Status pill */}
      <span className="pointer-events-none absolute bottom-[5%] rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-slate-600 uppercase shadow-xs">
        {statusLabel}
      </span>
    </div>
  );
}
