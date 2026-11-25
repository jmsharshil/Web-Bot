import type { InterviewConfig, SarvamCredentials, Turn } from "@/lib/interviews/types";
import { toAgentVariables } from "@/lib/interviews/types";

export type SarvamHandle = {
  stop: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
  isMuted: () => boolean;
};

export type SarvamCallbacks = {
  onTranscript: (turn: Omit<Turn, "id" | "at">) => void;
  onState: (state: string) => void;
  onLevel: (level: number) => void;
  onError: (message: string) => void;
  onEnd: () => void;
  onExtracted?: (vars: Record<string, string>) => void;
  onLanguageChange?: (language: string) => void;
};

export type ConnectSarvamOptions = {
  includeAgentVariables?: boolean;
  agentVariables?: Record<string, string>;
  /** When false (default), omits initial_language_name so Sarvam uses the agent's own multilingual / auto-switch settings. */
  sendInitialLanguage?: boolean;
};

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "English",
  "en-in": "English",
  "en-us": "English",
  hi: "Hindi",
  "hi-in": "Hindi",
  gu: "Gujarati",
  "gu-in": "Gujarati",
  mr: "Marathi",
  "mr-in": "Marathi",
  ta: "Tamil",
  "ta-in": "Tamil",
  te: "Telugu",
  "te-in": "Telugu",
  kn: "Kannada",
  "kn-in": "Kannada",
  ml: "Malayalam",
  "ml-in": "Malayalam",
  bn: "Bengali",
  "bn-in": "Bengali",
  pa: "Punjabi",
  "pa-in": "Punjabi",
  or: "Odia",
  od: "Odia",
  "or-in": "Odia",
  "od-in": "Odia",
};

function normalizeLanguageLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const mapped = LANGUAGE_CODE_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function detectLanguageFromScript(text: string): string | null {
  if (/[\u0A80-\u0AFF]/.test(text)) return "Gujarati";
  if (/[\u0900-\u097F]/.test(text)) return "Hindi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "Tamil";
  if (/[\u0C00-\u0C7F]/.test(text)) return "Telugu";
  if (/[\u0C80-\u0CFF]/.test(text)) return "Kannada";
  if (/[\u0D00-\u0D7F]/.test(text)) return "Malayalam";
  if (/[\u0980-\u09FF]/.test(text)) return "Bengali";
  if (/[\u0A00-\u0A7F]/.test(text)) return "Punjabi";
  if (/[\u0B00-\u0B7F]/.test(text)) return "Odia";
  if (/[A-Za-z]{3,}/.test(text)) return "English";
  return null;
}

function extractLanguageFromEvent(raw: Record<string, unknown>): string | null {
  const data =
    raw["data"] && typeof raw["data"] === "object"
      ? (raw["data"] as Record<string, unknown>)
      : null;

  const candidates = [
    raw["language_name"],
    raw["new_language"],
    raw["target_language"],
    raw["language"],
    raw["language_code"],
    raw["initial_language_name"],
    data?.["language_name"],
    data?.["new_language"],
    data?.["target_language"],
    data?.["language"],
    data?.["language_code"],
  ];

  for (const candidate of candidates) {
    const label = normalizeLanguageLabel(candidate);
    if (label) return label;
  }
  return null;
}

export async function connectSarvamAgent(
  creds: SarvamCredentials,
  config: InterviewConfig,
  callbacks: SarvamCallbacks,
  options: ConnectSarvamOptions = {},
): Promise<SarvamHandle> {
  const {
    ConversationAgent,
    BrowserAudioInterface,
    InteractionType,
  } = await import("sarvam-conv-ai-sdk/browser");

  const audioInterface = new BrowserAudioInterface(16000, {
    outputGain: 1.25,
    outputLevelCallback: (level) => {
      callbacks.onLevel(Math.min(1, Math.max(0, level.rms * 2.4)));
    },
  });

  const agentVariables =
    options.includeAgentVariables === false
      ? undefined
      : options.agentVariables ?? toAgentVariables(config);

  let serverLanguageSeen = false;

  const agent = new ConversationAgent({
    apiKey: creds.apiKey.trim(),
    platform: "browser",
    config: {
      user_identifier_type: "custom",
      user_identifier:
        (config.candidateName || "user")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase() || "user",
      org_id: creds.orgId.trim(),
      workspace_id: creds.workspaceId.trim(),
      app_id: creds.appId.trim(),
      interaction_type: InteractionType.CALL,
      input_sample_rate: 16000,
      output_sample_rate: 16000,
      ...(options.sendInitialLanguage
        ? { initial_language_name: config.language as never }
        : {}),
      ...(agentVariables ? { agent_variables: agentVariables } : {}),
    },
    audioInterface,
    transcriptCallback: async (msg) => {
      const content = (msg.content || "").trim();
      if (!content) return;
      // The raw server message includes is_final; only commit complete utterances
      const raw = msg as unknown as Record<string, unknown>;
      if (raw["is_final"] === false) return;

      // Fallback live language badge detection when server doesn't emit language_change
      if (!serverLanguageSeen && callbacks.onLanguageChange) {
        const scriptLang = detectLanguageFromScript(content);
        if (scriptLang) callbacks.onLanguageChange(scriptLang);
      }

      callbacks.onTranscript({
        role: msg.role === "user" ? "candidate" : "interviewer",
        content,
      });
    },
    eventCallback: async (event) => {
      const raw = event as unknown as Record<string, unknown>;
      const type = raw["type"];

      if (type === "server.event.language_change" && callbacks.onLanguageChange) {
        const lang = extractLanguageFromEvent(raw);
        if (lang) {
          serverLanguageSeen = true;
          callbacks.onLanguageChange(lang);
        }
      }
      if (type === "server.action.interaction_connected" && callbacks.onLanguageChange) {
        const lang = extractLanguageFromEvent(raw);
        if (lang) callbacks.onLanguageChange(lang);
      }
      if (type === "server.event.variable_update" && callbacks.onExtracted) {
        const vars = (raw["variables"] ?? raw["data"] ?? {}) as Record<string, string>;
        callbacks.onExtracted(vars);
      }
      if (type === "server.action.interaction_end") {
        callbacks.onEnd();
      }
    },
    stateCallback: (state) => callbacks.onState(String(state)),
    endCallback: async () => callbacks.onEnd(),
  });

  try {
    await agent.start();
    const ok = await agent.waitForConnect(12);
    if (!ok) {
      await agent.stop();
      throw new Error(
        "Voice agent did not connect. Check the Agent ID, ensure it is a Voice agent, and verify a version is committed.",
      );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not start the voice agent";
    callbacks.onError(message);
    throw err;
  }

  return {
    stop: () => agent.stop(),
    mute: () => agent.mute(),
    unmute: () => agent.unmute(),
    isMuted: () => agent.isMuted(),
  };
}
