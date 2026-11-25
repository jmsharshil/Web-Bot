import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AudioLines,
  Check,
  ChevronDown,
  Globe,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/card";
import type { RoomStatus, SarvamCredentials } from "@/lib/interviews/types";
import {
  isWebAgentReady,
  type AgentAccent,
  type WebAgent,
} from "@/lib/sarvam/agents";
import { cn } from "@/lib/utils";

const ACCENT_STYLES: Record<
  AgentAccent,
  { bg: string; text: string; ring: string }
> = {
  cyan: {
    bg: "bg-sky-50",
    text: "text-sky-600",
    ring: "ring-sky-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-200",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    ring: "ring-violet-200",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    ring: "ring-amber-200",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    ring: "ring-rose-200",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-200",
  },
};

type AgentDropdownProps = {
  agents: WebAgent[];
  selectedAgent: WebAgent | null;
  status: RoomStatus;
  sharedCreds: SarvamCredentials;
  disabled?: boolean;
  onSelectAgent: (agent: WebAgent) => void;
};

type MenuRect = { top: number; left: number; width: number };

export function AgentDropdown({
  agents,
  selectedAgent,
  status,
  sharedCreds,
  disabled = false,
  onSelectAgent,
}: AgentDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const isLive =
    status === "connecting" || status === "listening" || status === "speaking";
  const selectedStyle = selectedAgent
    ? ACCENT_STYLES[selectedAgent.accent]
    : null;

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-150",
          open
            ? "border-sky-500 ring-3 ring-sky-500/15"
            : "border-slate-200 hover:border-sky-300 hover:shadow-md",
          "focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/15",
          disabled && "cursor-not-allowed opacity-70",
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl ring-1 transition-colors",
              selectedStyle
                ? `${selectedStyle.bg} ${selectedStyle.text} ${selectedStyle.ring}`
                : "bg-slate-100 text-slate-600 ring-slate-200",
            )}
          >
            <AudioLines className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                {selectedAgent
                  ? selectedAgent.name
                  : "Select a web agent to start talking"}
              </span>
              {selectedAgent && isLive ? (
                <Badge tone="live" className="shrink-0">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {status === "speaking"
                    ? "Speaking"
                    : status === "connecting"
                      ? "Connecting"
                      : "Live"}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {selectedAgent
                ? `Auto-language · ${selectedAgent.description}`
                : `${agents.length} web ${agents.length === 1 ? "agent" : "agents"} available — click to choose an agent`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-600 sm:inline-block">
            {agents.length} {agents.length === 1 ? "agent" : "agents"}
          </span>
          <ChevronDown
            className={cn(
              "size-5 text-slate-500 transition-transform duration-200",
              open && "rotate-180 text-sky-600",
            )}
          />
        </div>
      </button>

      {open && menuRect
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label="Available web agents"
              style={{
                position: "fixed",
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width,
              }}
              className="z-[9999] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-popover)]"
            >
              <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-2.5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  Select a web agent — connects &amp; speaks immediately
                </p>
              </div>

              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto p-1.5">
                {agents.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-slate-500">
                    No web agents configured yet. Set{" "}
                    <code className="font-mono text-xs text-slate-800">
                      VITE_SARVAM_*_AGENT_ID
                    </code>{" "}
                    in{" "}
                    <code className="font-mono text-xs text-slate-800">.env</code>.
                  </li>
                ) : (
                  agents.map((agent) => {
                    const style = ACCENT_STYLES[agent.accent];
                    const isSelected = selectedAgent?.id === agent.id;
                    const ready = isWebAgentReady(agent, sharedCreds);
                    const activeNow = isSelected && isLive;

                    return (
                      <li key={agent.id} className="py-0.5 first:pt-0 last:pb-0">
                        <div
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={0}
                          onClick={() => {
                            setOpen(false);
                            onSelectAgent(agent);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setOpen(false);
                              onSelectAgent(agent);
                            }
                          }}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors",
                            isSelected
                              ? "bg-sky-50/90 ring-1 ring-sky-200"
                              : "hover:bg-slate-50",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-xl ring-1",
                                style.bg,
                                style.text,
                                style.ring,
                              )}
                            >
                              {activeNow ? (
                                <Radio className="size-4 animate-pulse" />
                              ) : (
                                <AudioLines className="size-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-slate-900">
                                  {agent.name}
                                </span>
                                <Badge tone="muted" className="gap-1 py-0 text-[10px]">
                                  <Globe className="size-2.5" />
                                  Auto-language
                                </Badge>
                                {agent.source === "custom" ? (
                                  <Badge tone="accent" className="py-0 text-[10px]">
                                    Custom
                                  </Badge>
                                ) : null}
                                {!ready ? (
                                  <Badge tone="error" className="py-0 text-[10px]">
                                    Needs credentials
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 truncate text-xs text-slate-600">
                                {agent.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            {activeNow ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : isSelected ? (
                              <Check className="size-4 text-sky-600" />
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
