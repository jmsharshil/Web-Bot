import { useEffect, useRef } from "react";
import type { Turn } from "@/lib/interviews/types";
import { cn } from "@/lib/utils";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TranscriptRail({
  turns,
  agentName = "Voice Agent",
}: {
  turns: Turn[];
  agentName?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  return (
    <div className="h-full overflow-y-auto pr-1.5">
      <ol className="flex flex-col gap-3 p-1">
        {turns.length === 0 ? (
          <li className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Live transcript will appear here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Select a voice agent from the dropdown and start speaking.
            </p>
          </li>
        ) : (
          turns.map((turn) => {
            const isAgent = turn.role === "interviewer";
            return (
              <li
                key={turn.id}
                className={cn(
                  "flex flex-col gap-1",
                  isAgent ? "items-start" : "items-end",
                )}
              >
                <div className="flex items-center gap-2 px-1 text-[10px] font-medium tracking-[0.12em] text-slate-500 uppercase">
                  <span>{isAgent ? agentName : "You"}</span>
                  <span aria-hidden>·</span>
                  <span className="font-mono">{formatTime(turn.at)}</span>
                </div>
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    isAgent
                      ? "rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-800"
                      : "rounded-tr-sm bg-sky-600 text-white shadow-xs",
                  )}
                >
                  {turn.content}
                </div>
              </li>
            );
          })
        )}
        <div ref={bottomRef} />
      </ol>
    </div>
  );
}
