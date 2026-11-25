import { Link } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";

type AppHeaderProps = {
  title?: string;
  agentCount?: number;
  userName?: string | null;
  liveAgentName?: string | null;
  lockedMode?: boolean;
  onOpenAdmin?: () => void;
};

export function AppHeader({
  title = "AI Voice Experience",
  agentCount,
  userName,
  liveAgentName,
  lockedMode = false,
  onOpenAdmin,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(11,21,48,0.06)]">
      <div className="expo-stripe h-1 w-full" />
      <div className="border-b border-slate-200 px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {lockedMode ? (
              <img
                src="/jms-logo.png"
                alt="JMS"
                className="h-10 w-auto shrink-0 object-contain"
              />
            ) : (
              <Link to="/" title="Back to Onesuit">
                <img
                  src="/jms-logo.png"
                  alt="JMS"
                  className="h-10 w-auto shrink-0 object-contain"
                />
              </Link>
            )}
            <div className="min-w-0 border-l border-slate-200 pl-3">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                {title}
              </p>
              <p className="hidden font-mono text-[10px] font-medium tracking-[0.18em] text-blue-600 uppercase sm:block">
                Tech Expo · Live Demo
                {typeof agentCount === "number" && !lockedMode
                  ? ` · ${agentCount} ${agentCount === 1 ? "agent" : "agents"}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userName ? (
              <Badge tone="muted" className="hidden md:inline-flex">
                <UserRound className="size-3" />
                {userName}
              </Badge>
            ) : null}

            {liveAgentName ? (
              <Badge tone="live" className="hidden sm:inline-flex">
                <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
                {liveAgentName}
              </Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-red-600 uppercase ring-1 ring-red-200">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                Live
              </span>
            )}

            {!lockedMode && onOpenAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenAdmin}
                title="Authorized staff: manage voice agents"
              >
                <Lock className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
