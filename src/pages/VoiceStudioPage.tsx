import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Globe,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RotateCcw,
} from "lucide-react";
import { AdminAgentsDialog } from "@/components/agents/admin-agents-dialog";
import { AgentDropdown } from "@/components/agents/agent-dropdown";
import { FeedbackDialog } from "@/components/agents/feedback-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { AudioOrb } from "@/components/room/audio-orb";
import { TranscriptRail } from "@/components/room/transcript-rail";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";
import { useWebAgentSession } from "@/hooks/use-web-agent-session";
import { useInterviewStore } from "@/lib/interviews/store";
import {
  getAllWebAgents,
  isWebAgentReady,
  normalizeWebAgent,
  type WebAgent,
} from "@/lib/sarvam/agents";
import { getExpoSession, listExpoAgents } from "@/lib/expo-feedback/api";
import { clearUserProfile, loadUserProfile } from "@/lib/session/user-profile";

function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type VoiceStudioPageProps = {
  lockedAgentId?: string;
  initialAgentId?: string;
  /** Registration form path — visitors without details are sent here, and return here after feedback */
  entryPath?: string;
};

export function VoiceStudioPage({
  lockedAgentId,
  initialAgentId,
  entryPath = "/voiceai",
}: VoiceStudioPageProps = {}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const userProfile = useMemo(() => loadUserProfile(), []);
  const hydrated = useHydrated();
  const sarvam = useInterviewStore((s) => s.sarvam);
  const customAgents = useInterviewStore((s) => s.customAgents);
  const setCustomAgents = useInterviewStore((s) => s.setCustomAgents);

  const [adminOpen, setAdminOpen] = useState(false);

  // Verify stored session on page refresh — if already COMPLETED, reset for the next visitor
  useEffect(() => {
    const sessionId = userProfile?.sessionId;
    if (!sessionId) return;
    let active = true;
    void getExpoSession(sessionId)
      .then((session) => {
        if (!active || !session) return;
        if (session.status === "COMPLETED") {
          clearUserProfile();
          navigate(entryPath, { replace: true });
        }
      })
      .catch(() => {
        /* non-blocking check: backend auto-creates session on feedback if needed */
      });
    return () => {
      active = false;
    };
  }, [entryPath, navigate, userProfile?.sessionId]);

  // Sync admin-managed agents globally from Django backend (mount, tab focus, & periodic refresh)
  const syncGlobalAgents = useCallback(async () => {
    try {
      const serverAgents = await listExpoAgents();
      const normalized = serverAgents
        .map((item) => normalizeWebAgent(item, "custom"))
        .filter((a): a is WebAgent => Boolean(a));
      setCustomAgents(normalized);
    } catch {
      /* keep last cached agents if backend is temporarily unreachable */
    }
  }, [setCustomAgents]);

  useEffect(() => {
    void syncGlobalAgents();

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void syncGlobalAgents();
      }
    };
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncGlobalAgents();
      }
    }, 30_000);

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [syncGlobalAgents]);

  const agents = useMemo(
    () => getAllWebAgents(hydrated ? customAgents : [], sarvam),
    [customAgents, hydrated, sarvam],
  );

  const {
    selectedAgent,
    setSelectedAgent,
    status,
    hint,
    error,
    level,
    inputLevel,
    muted,
    turns,
    elapsedSec,
    isConnected,
    feedbackOpen,
    activeLanguage,
    selectAndConnect,
    endCall,
    reconnect,
    toggleMute,
  } = useWebAgentSession(userProfile);

  const preselectedRef = useRef(false);

  // Pre-select an agent when routed via subdomain, /pondpro or /agent/:slug
  useEffect(() => {
    if (!hydrated || !userProfile || preselectedRef.current) return;
    const targetId = lockedAgentId ?? initialAgentId ?? slug;
    if (!targetId) return;
    const match = agents.find((a) => a.id.toLowerCase() === targetId.toLowerCase());
    if (match) {
      preselectedRef.current = true;
      setSelectedAgent(match);
    }
  }, [agents, hydrated, initialAgentId, lockedAgentId, setSelectedAgent, slug, userProfile]);

  // Reflect selected agent in browser title & favicon
  useEffect(() => {
    if (!selectedAgent) {
      document.title = "AI Voice Experience";
      return;
    }
    document.title = selectedAgent.name;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) {
      const href = selectedAgent.favicon || "/jms-favicon.png";
      icon.type = href.endsWith(".svg") ? "image/svg+xml" : "image/png";
      icon.href = href;
    }
  }, [selectedAgent]);

  if (!userProfile) {
    return <Navigate to={entryPath} replace />;
  }

  const handleSelectAgent = (agent: WebAgent) => {
    const sameAndActive =
      selectedAgent?.id === agent.id &&
      (status === "connecting" || status === "listening" || status === "speaking");
    if (sameAndActive) return;
    void selectAndConnect(agent);
  };

  const handleAdminRemovedAgent = (agent: WebAgent) => {
    if (selectedAgent?.id === agent.id) {
      void endCall({ openFeedback: false });
      setSelectedAgent(null);
    }
  };

  const activeCall =
    status === "connecting" ||
    status === "listening" ||
    status === "speaking" ||
    status === "ending";

  const selectedReady = selectedAgent ? isWebAgentReady(selectedAgent, sarvam) : false;
  const firstName = userProfile.name.split(" ")[0];

  return (
    <div className="expo-grid flex min-h-dvh flex-col text-foreground">
      <AppHeader
        title={lockedAgentId && selectedAgent ? selectedAgent.name : "AI Voice Experience"}
        agentCount={agents.length}
        userName={userProfile.name}
        liveAgentName={isConnected && selectedAgent ? selectedAgent.name : null}
        lockedMode={Boolean(lockedAgentId)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 md:px-8">
        {/* Intro + Agent dropdown */}
        <section className="relative z-20 flex flex-col gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
              Step 02 · Choose an agent
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Hi {firstName}, who would you like to talk to?
            </h1>
          </div>

          {!lockedAgentId ? (
            <AgentDropdown
              agents={agents}
              selectedAgent={selectedAgent}
              status={status}
              sharedCreds={sarvam}
              onSelectAgent={handleSelectAgent}
            />
          ) : null}
        </section>

        {/* Stage + Transcript */}
        <div className="relative z-10 grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Voice stage */}
          <Card className="relative flex min-h-[28rem] flex-col justify-between overflow-hidden p-5 sm:p-7">
            <div className="expo-stripe absolute inset-x-0 top-0 h-1" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAgent ? (
                  <>
                    <Badge tone="accent">{selectedAgent.name}</Badge>
                    <Badge tone="muted">
                      <Globe className="size-3" />
                      {activeLanguage === "Auto" ? "Auto-language" : activeLanguage}
                    </Badge>
                  </>
                ) : (
                  <Badge tone="muted">No agent selected</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1 font-mono text-xs font-semibold text-white tabular-nums">
                {isConnected ? (
                  <span className="size-2 animate-pulse rounded-full bg-red-500" />
                ) : null}
                {formatClock(elapsedSec)}
              </div>
            </div>

            <div className="my-4 flex flex-col items-center justify-center">
              <AudioOrb level={level} status={status} accent={selectedAgent?.accent ?? "blue"} />
              <p className="mt-4 max-w-md text-center text-base font-semibold text-slate-800">
                {hint}
              </p>

              {/* Live microphone input meter during active call */}
              {isConnected ? (
                <div className="mt-3 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  {muted ? (
                    <MicOff className="size-3.5 text-slate-400" />
                  ) : (
                    <Mic className="size-3.5 text-emerald-600" />
                  )}
                  <div className="flex h-3.5 items-center gap-1" aria-hidden="true">
                    {[0.45, 0.75, 1.0, 0.75, 0.45].map((w, idx) => {
                      const pct = muted
                        ? 20
                        : Math.max(22, Math.min(100, Math.round(20 + inputLevel * 85 * w)));
                      return (
                        <span
                          key={idx}
                          className={
                            muted
                              ? "w-1 rounded-full bg-slate-300 transition-[height] duration-75"
                              : "w-1 rounded-full bg-emerald-500 transition-[height] duration-75"
                          }
                          style={{ height: `${pct}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {muted ? "Mic muted" : "Mic live"}
                  </span>
                </div>
              ) : null}

              {/* Sample starter prompts before conversation picks up */}
              {selectedAgent && turns.length < 2 && !error ? (
                <div className="mt-4 flex max-w-lg flex-wrap items-center justify-center gap-1.5">
                  {(
                    selectedAgent.samplePrompts ?? [
                      "Say hello to start",
                      "Switch languages naturally anytime",
                    ]
                  ).map((prompt) => (
                    <span
                      key={prompt}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                    >
                      “{prompt}”
                    </span>
                  ))}
                </div>
              ) : null}

              {error ? (
                <div className="mt-3 flex max-w-md items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-left text-xs text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {activeCall ? (
                <>
                  <Button
                    type="button"
                    variant={muted ? "default" : "outline"}
                    size="lg"
                    className="h-12 min-w-40"
                    onClick={toggleMute}
                    disabled={!isConnected}
                  >
                    {muted ? <MicOff /> : <Mic />}
                    {muted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="lg"
                    className="h-12 min-w-40"
                    onClick={() => void endCall()}
                    disabled={status === "ending"}
                  >
                    <PhoneOff />
                    End Call
                  </Button>
                </>
              ) : selectedAgent ? (
                <Button
                  type="button"
                  size="lg"
                  className="h-12 min-w-52"
                  onClick={reconnect}
                  disabled={!selectedReady}
                >
                  {status === "error" || status === "ended" ? <RotateCcw /> : <Phone />}
                  {status === "error" ? "Try Again" : `Talk to ${selectedAgent.name}`}
                </Button>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  Select an agent from the dropdown above to begin.
                </p>
              )}
            </div>
          </Card>

          {/* Transcript */}
          <Card className="flex min-h-[22rem] flex-col p-5 lg:h-[calc(100dvh-16rem)] lg:min-h-[28rem]">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-slate-600 uppercase">
                Live Transcript
              </p>
              {turns.length > 0 ? (
                <Badge tone="muted" className="font-mono text-[10px]">
                  {turns.length} messages
                </Badge>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <TranscriptRail turns={turns} agentName={selectedAgent?.name || "Voice Agent"} />
            </div>
          </Card>
        </div>
      </main>

      <footer className="px-4 pb-5 text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        Powered by JMS · Need help? Ask our booth team
      </footer>

      <AdminAgentsDialog
        open={adminOpen}
        onOpenChange={setAdminOpen}
        agents={agents}
        activeAgentId={selectedAgent?.id ?? null}
        onAgentAdded={() => void syncGlobalAgents()}
        onAgentRemoved={(agent) => {
          handleAdminRemovedAgent(agent);
          void syncGlobalAgents();
        }}
      />

      <FeedbackDialog
        open={feedbackOpen}
        user={userProfile}
        agentId={selectedAgent?.id || "voice-agent"}
        agentName={selectedAgent?.name || "Voice Agent"}
        turnsCount={turns.length}
        durationSec={elapsedSec}
        redirectTo={entryPath}
      />
    </div>
  );
}
