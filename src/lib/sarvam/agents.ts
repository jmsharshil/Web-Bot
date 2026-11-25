import {
  DEFAULT_CONFIG,
  isLanguageId,
  type InterviewConfig,
  type LanguageId,
  type SarvamCredentials,
} from "@/lib/interviews/types";
import type { UserProfile } from "@/lib/session/user-profile";
import { effectiveSarvamCredentials } from "@/lib/sarvam/env";
import {
  connectSarvamAgent,
  type SarvamCallbacks,
  type SarvamHandle,
} from "@/lib/sarvam/session";

export type AgentAccent = "cyan" | "emerald" | "violet" | "amber" | "rose" | "blue";

export const AGENT_ACCENTS: { id: AgentAccent; label: string; dot: string }[] = [
  { id: "cyan", label: "Cyan", dot: "bg-cyan-400" },
  { id: "emerald", label: "Emerald", dot: "bg-emerald-400" },
  { id: "violet", label: "Violet", dot: "bg-violet-400" },
  { id: "amber", label: "Amber", dot: "bg-amber-400" },
  { id: "rose", label: "Rose", dot: "bg-rose-400" },
  { id: "blue", label: "Blue", dot: "bg-blue-400" },
];

export type WebAgent = {
  id: string;
  name: string;
  description: string;
  appId: string;
  language: LanguageId;
  accent: AgentAccent;
  includeAgentVariables: boolean;
  agentVariables?: Record<string, string>;
  hostname?: string;
  favicon?: string;
  source: "env" | "custom";
  /** Optional per-agent credential overrides if hosted in a different Sarvam workspace */
  apiKey?: string;
  orgId?: string;
  workspaceId?: string;
};

const VALID_ACCENTS = new Set<string>(AGENT_ACCENTS.map((a) => a.id));

function parseAccent(value: unknown, fallback: AgentAccent): AgentAccent {
  return typeof value === "string" && VALID_ACCENTS.has(value)
    ? (value as AgentAccent)
    : fallback;
}

export function normalizeWebAgent(
  raw: unknown,
  fallbackSource: "env" | "custom" = "custom",
): WebAgent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = String(r.name ?? "").trim();
  const appId = String(r.appId ?? "").trim();
  if (!name || !appId) return null;

  const rawId = String(r.id ?? name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const languageRaw = String(r.language ?? "English");
  const language: LanguageId = isLanguageId(languageRaw) ? languageRaw : "English";

  let agentVariables: Record<string, string> | undefined;
  if (r.agentVariables && typeof r.agentVariables === "object") {
    const entries = Object.entries(r.agentVariables as Record<string, unknown>)
      .map(([k, v]) => [k.trim(), String(v ?? "").trim()] as const)
      .filter(([k]) => Boolean(k));
    if (entries.length > 0) {
      agentVariables = Object.fromEntries(entries);
    }
  }

  return {
    id: rawId || `agent-${appId.slice(0, 8).toLowerCase()}`,
    name,
    description: String(r.description ?? "Interactive AI voice agent.").trim(),
    appId,
    language,
    accent: parseAccent(r.accent, fallbackSource === "env" ? "cyan" : "violet"),
    includeAgentVariables: Boolean(r.includeAgentVariables),
    agentVariables,
    hostname: typeof r.hostname === "string" && r.hostname.trim() ? r.hostname.trim().toLowerCase() : undefined,
    favicon: typeof r.favicon === "string" && r.favicon.trim() ? r.favicon.trim() : undefined,
    source: r.source === "env" ? "env" : fallbackSource,
    apiKey: typeof r.apiKey === "string" && r.apiKey.trim() ? r.apiKey.trim() : undefined,
    orgId: typeof r.orgId === "string" && r.orgId.trim() ? r.orgId.trim() : undefined,
    workspaceId:
      typeof r.workspaceId === "string" && r.workspaceId.trim()
        ? r.workspaceId.trim()
        : undefined,
  };
}

/**
 * Returns all built-in web agents configured via Vite environment variables.
 * - VITE_SARVAM_PARAM_SOCIAL_AGENT_ID -> Param Social Agent
 * - VITE_SARVAM_AUTODEALER_AGENT_ID -> Auto Dealer Agent
 * - VITE_SARVAM_PONDPRO_AGENT_ID -> PondPro Voice Agent
 * - VITE_SARVAM_AGENTS -> Optional JSON array of additional web agents
 */
export function getEnvWebAgents(): WebAgent[] {
  const agents: WebAgent[] = [];

  const paramSocialId = (
    import.meta.env.VITE_SARVAM_PARAM_SOCIAL_AGENT_ID as string | undefined
  )?.trim();
  if (paramSocialId) {
    agents.push({
      id: "param-social",
      name: "Param Social Agent",
      description: "Friendly voice assistant for Param Social conversations.",
      appId: paramSocialId,
      language: "English",
      accent: "violet",
      includeAgentVariables: false,
      source: "env",
    });
  }

  const autoDealerId = (
    import.meta.env.VITE_SARVAM_AUTODEALER_AGENT_ID as string | undefined
  )?.trim();
  if (autoDealerId) {
    agents.push({
      id: "auto-dealer",
      name: "Auto Dealer Agent",
      description: "Voice assistant for car models, pricing and test drives.",
      appId: autoDealerId,
      language: "English",
      accent: "amber",
      includeAgentVariables: false,
      source: "env",
    });
  }

  const pondProId = (
    import.meta.env.VITE_SARVAM_PONDPRO_AGENT_ID as string | undefined
  )?.trim();
  if (pondProId) {
    agents.push({
      id: "pondpro",
      name: "PondPro Voice Agent",
      description: "Dedicated voice assistant for PondPro conversations.",
      appId: pondProId,
      language: "English",
      accent: "emerald",
      includeAgentVariables: false,
      hostname: "pondpro.naavya.ai",
      favicon: "/pondpro-favicon.svg",
      source: "env",
    });
  }

  const extraJson = (
    import.meta.env.VITE_SARVAM_AGENTS as string | undefined
  )?.trim();
  if (extraJson) {
    try {
      const parsed = JSON.parse(extraJson) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const normalized = normalizeWebAgent(item, "env");
          if (
            normalized &&
            !agents.some((a) => a.id === normalized.id || a.appId === normalized.appId)
          ) {
            agents.push(normalized);
          }
        }
      }
    } catch {
      console.warn("[voice-agents] Failed to parse VITE_SARVAM_AGENTS JSON.");
    }
  }

  return agents;
}

export function getAllWebAgents(
  customAgents: WebAgent[],
  _sharedCreds?: SarvamCredentials,
): WebAgent[] {
  const envAgents = getEnvWebAgents();
  const seen = new Set(envAgents.map((a) => a.id));
  const merged = [...envAgents];
  for (const agent of customAgents) {
    if (!seen.has(agent.id)) {
      seen.add(agent.id);
      merged.push(agent);
    }
  }
  return merged;
}

export function getAgentByHostname(
  agents: WebAgent[],
  hostname: string,
): WebAgent | undefined {
  const host = hostname.trim().toLowerCase();
  return agents.find((a) => a.hostname && a.hostname === host);
}

export function resolveAgentCredentials(
  agent: WebAgent,
  storedShared: SarvamCredentials,
): SarvamCredentials {
  const base = effectiveSarvamCredentials(storedShared);
  return {
    apiKey: agent.apiKey?.trim() || base.apiKey,
    orgId: agent.orgId?.trim() || base.orgId,
    workspaceId: agent.workspaceId?.trim() || base.workspaceId,
    appId: agent.appId.trim(),
  };
}

export function isWebAgentReady(
  agent: WebAgent,
  storedShared: SarvamCredentials,
): boolean {
  const c = resolveAgentCredentials(agent, storedShared);
  return Boolean(c.apiKey && c.orgId && c.workspaceId && c.appId);
}

/** Turn raw Sarvam errors into a clear, actionable message. */
export function friendlyAgentError(agent: WebAgent, message: string): string {
  if (/app not found|interaction type|\b404\b/i.test(message)) {
    return `Sarvam could not find a committed Voice agent for "${agent.name}" (Agent ID: ${agent.appId}). Check that this Agent ID, Org ID and Workspace ID come from the same agent's "Deploy with Code" page, that it is a Voice agent, and that a version is committed.`;
  }
  if (/401|403|unauthori[sz]ed|forbidden|api key/i.test(message)) {
    return `Sarvam rejected the API key for "${agent.name}". Check VITE_SARVAM_API_KEY in .env.`;
  }
  return message;
}

export function connectWebAgent(
  agent: WebAgent,
  storedShared: SarvamCredentials,
  callbacks: SarvamCallbacks,
  userProfile?: UserProfile | null,
): Promise<SarvamHandle> {
  const creds = resolveAgentCredentials(agent, storedShared);
  if (!creds.apiKey || !creds.orgId || !creds.workspaceId || !creds.appId) {
    const error = new Error(
      `Missing Sarvam credentials for "${agent.name}". Configure API key, Org ID, Workspace ID, and Agent ID in Credentials or .env.`,
    );
    callbacks.onError(error.message);
    return Promise.reject(error);
  }

  const userName = userProfile?.name?.trim() || "user";
  const config: InterviewConfig = {
    ...DEFAULT_CONFIG,
    candidateName: userName,
    language: agent.language,
  };

  const agentVariables = agent.includeAgentVariables
    ? {
        ...(agent.agentVariables ?? {}),
        CANDIDATE_NAME: userName,
      }
    : undefined;

  return connectSarvamAgent(creds, config, callbacks, {
    includeAgentVariables: agent.includeAgentVariables,
    agentVariables,
    sendInitialLanguage: false,
  });
}
