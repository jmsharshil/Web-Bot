import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateInterview } from "@/lib/interviews/api";
import { useInterviewStore } from "@/lib/interviews/store";
import {
  DEFAULT_CONFIG,
  type Evaluation,
  type RoomStatus,
  type Turn,
} from "@/lib/interviews/types";
import {
  connectWebAgent,
  friendlyAgentError,
  type WebAgent,
} from "@/lib/sarvam/agents";
import type { SarvamHandle } from "@/lib/sarvam/session";
import type { UserProfile } from "@/lib/session/user-profile";

export function useWebAgentSession(userProfile: UserProfile | null) {
  const [selectedAgent, setSelectedAgent] = useState<WebAgent | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [hint, setHint] = useState(
    "Choose a web agent from the dropdown to start talking.",
  );
  const [error, setError] = useState("");
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [callSummary, setCallSummary] = useState<string | null>(null);
  const [report, setReport] = useState<Evaluation | null>(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string>("Auto");

  const handleRef = useRef<SarvamHandle | null>(null);
  const connectSeqRef = useRef(0);
  const mountedRef = useRef(true);
  const startedAtRef = useRef<number | null>(null);
  const mutedRef = useRef(false);
  const userProfileRef = useRef<UserProfile | null>(userProfile);
  userProfileRef.current = userProfile;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectSeqRef.current += 1;
      const handle = handleRef.current;
      handleRef.current = null;
      if (handle) {
        void handle.stop().catch(() => {
          /* ignore unmount stop error */
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const interval = window.setInterval(() => {
      if (startedAtRef.current) {
        setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isConnected]);

  const stopActiveHandle = useCallback(async () => {
    const existing = handleRef.current;
    handleRef.current = null;
    setIsConnected(false);
    setLevel(0);
    startedAtRef.current = null;
    if (existing) {
      try {
        await existing.stop();
      } catch {
        /* already stopped */
      }
    }
  }, []);

  const selectAndConnect = useCallback(
    async (agent: WebAgent) => {
      const seq = ++connectSeqRef.current;

      setSelectedAgent(agent);
      setFeedbackOpen(false);
      setActiveLanguage("Auto");
      setError("");
      setTurns([]);
      setCallSummary(null);
      setReport(null);
      setDebriefLoading(false);
      setElapsedSec(0);
      setMuted(false);
      mutedRef.current = false;
      setStatus("connecting");
      setHint(`Connecting to ${agent.name}…`);

      await stopActiveHandle();
      if (seq !== connectSeqRef.current || !mountedRef.current) return;

      const sharedCreds = useInterviewStore.getState().sarvam;

      try {
        const handle = await connectWebAgent(
          agent,
          sharedCreds,
          {
            onTranscript: (turn) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              setTurns((prev) => [
                ...prev,
                { ...turn, id: crypto.randomUUID(), at: Date.now() },
              ]);
            },
            onState: (next) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              const nextStatus: RoomStatus =
                next === "speaking"
                  ? "speaking"
                  : next === "connected" || next === "listening"
                    ? "listening"
                    : next === "error"
                      ? "error"
                      : "connecting";
              setStatus(nextStatus);
              if (nextStatus === "speaking") {
                setHint(`${agent.name} is speaking…`);
              } else if (nextStatus === "listening") {
                setHint(`${agent.name} is listening — go ahead and speak.`);
              } else if (nextStatus === "error") {
                setHint(`${agent.name} encountered a connection issue.`);
              } else {
                setHint(`Connecting to ${agent.name}…`);
              }
            },
            onLevel: (nextLevel) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              setLevel(nextLevel);
            },
            onError: (message) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              setError(friendlyAgentError(agent, message));
              setStatus("error");
              setIsConnected(false);
              setHint(`Could not connect to ${agent.name}.`);
            },
            onExtracted: (vars) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              if (vars.call_summary) {
                setCallSummary(vars.call_summary);
              }
            },
            onLanguageChange: (language) => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              setActiveLanguage(language);
            },
            onEnd: () => {
              if (seq !== connectSeqRef.current || !mountedRef.current) return;
              handleRef.current = null;
              setIsConnected(false);
              setLevel(0);
              setStatus("ended");
              setHint(`${agent.name} ended the conversation.`);
              setFeedbackOpen(true);
            },
          },
          userProfileRef.current,
        );

        if (seq !== connectSeqRef.current || !mountedRef.current) {
          await handle.stop().catch(() => {});
          return;
        }

        handleRef.current = handle;
        startedAtRef.current = Date.now();
        setIsConnected(true);
        setStatus("listening");
        setHint(`Connected to ${agent.name}. Start speaking anytime.`);
      } catch (err) {
        if (seq !== connectSeqRef.current || !mountedRef.current) return;
        const message =
          err instanceof Error
            ? err.message
            : `Could not connect to ${agent.name}.`;
        setError(friendlyAgentError(agent, message));
        setStatus("error");
        setIsConnected(false);
        setHint(`Could not connect to ${agent.name}.`);
      }
    },
    [stopActiveHandle],
  );

  const endCall = useCallback(
    async (opts: { openFeedback?: boolean } = {}) => {
      const shouldOpenFeedback = opts.openFeedback !== false;
      connectSeqRef.current += 1;
      setStatus("ending");
      setHint("Ending conversation…");
      await stopActiveHandle();
      if (!mountedRef.current) return;
      setStatus(shouldOpenFeedback ? "ended" : "idle");
      setHint(
        shouldOpenFeedback
          ? selectedAgent
            ? `${selectedAgent.name} conversation ended.`
            : "Conversation ended."
          : "Choose a web agent from the dropdown to start talking.",
      );
      if (shouldOpenFeedback) {
        setFeedbackOpen(true);
      }
    },
    [selectedAgent, stopActiveHandle],
  );

  const reconnect = useCallback(() => {
    if (!selectedAgent) return;
    void selectAndConnect(selectedAgent);
  }, [selectedAgent, selectAndConnect]);

  const toggleMute = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) return;
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) handle.mute();
    else handle.unmute();
  }, []);

  const clearTranscript = useCallback(() => {
    setTurns([]);
    setCallSummary(null);
    setReport(null);
  }, []);

  const generateDebrief = useCallback(async () => {
    if (!selectedAgent || turns.length < 2 || debriefLoading) return;
    setDebriefLoading(true);
    try {
      const res = await evaluateInterview({
        config: {
          ...DEFAULT_CONFIG,
          candidateName: userProfileRef.current?.name || "User",
          companyName: selectedAgent.name,
          language: selectedAgent.language,
        },
        turns,
      });
      if (!mountedRef.current) return;
      if (res.ok) {
        setReport(res.report);
      } else {
        setError(res.error);
      }
    } finally {
      if (mountedRef.current) setDebriefLoading(false);
    }
  }, [debriefLoading, selectedAgent, turns]);

  return {
    selectedAgent,
    setSelectedAgent,
    status,
    hint,
    error,
    level,
    muted,
    turns,
    callSummary,
    report,
    debriefLoading,
    elapsedSec,
    isConnected,
    feedbackOpen,
    activeLanguage,
    selectAndConnect,
    endCall,
    reconnect,
    toggleMute,
    clearTranscript,
    generateDebrief,
  };
}
