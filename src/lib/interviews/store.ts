import { create } from "zustand";
import { persist } from "zustand/middleware";
import { envSarvamCredentials, mergeCredentials } from "@/lib/sarvam/env";
import { normalizeWebAgent, type WebAgent } from "@/lib/sarvam/agents";
import {
  DEFAULT_CONFIG,
  normalizeConfig,
  normalizeCredentials,
  type InterviewConfig,
  type SarvamCredentials,
} from "./types";

type Store = {
  sarvam: SarvamCredentials;
  draft: InterviewConfig;
  customAgents: WebAgent[];
  setDraft: (patch: Partial<InterviewConfig>) => void;
  setSarvam: (creds: SarvamCredentials) => void;
  clearSarvam: () => void;
  setCustomAgents: (agents: WebAgent[]) => void;
  addCustomAgent: (agent: Omit<WebAgent, "source">) => WebAgent;
  removeCustomAgent: (id: string) => void;
};

const EMPTY: SarvamCredentials = {
  apiKey: "",
  orgId: "",
  workspaceId: "",
  appId: "",
};

function normalizeCustomAgents(raw: unknown): WebAgent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeWebAgent(item, "custom"))
    .filter((a): a is WebAgent => Boolean(a));
}

export const useInterviewStore = create<Store>()(
  persist(
    (set) => ({
      sarvam: envSarvamCredentials(),
      draft: { ...DEFAULT_CONFIG },
      customAgents: [],
      setDraft: (patch) =>
        set((s) => ({ draft: normalizeConfig({ ...s.draft, ...patch }) })),
      setSarvam: (creds) => set({ sarvam: normalizeCredentials(creds) }),
      clearSarvam: () => set({ sarvam: EMPTY }),
      setCustomAgents: (agents) =>
        set({ customAgents: normalizeCustomAgents(agents) }),
      addCustomAgent: (input) => {
        const created: WebAgent = {
          ...input,
          source: "custom",
        };
        set((s) => ({
          customAgents: [
            ...s.customAgents.filter((a) => a.id !== created.id),
            created,
          ],
        }));
        return created;
      },
      removeCustomAgent: (id) =>
        set((s) => ({
          customAgents: s.customAgents.filter((a) => a.id !== id),
        })),
    }),
    {
      name: "voice-agent-studio",
      version: 3,
      migrate: (persisted) => {
        const p = (persisted || {}) as Record<string, unknown>;
        return {
          sarvam: normalizeCredentials(p.sarvam),
          draft: normalizeConfig(p.draft),
          customAgents: normalizeCustomAgents(p.customAgents),
        };
      },
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<Store>;
        return {
          ...current,
          ...p,
          sarvam: mergeCredentials(
            envSarvamCredentials(),
            normalizeCredentials(p.sarvam ?? current.sarvam),
          ),
          draft: normalizeConfig(p.draft ?? current.draft),
          customAgents: normalizeCustomAgents(p.customAgents ?? current.customAgents),
        };
      },
      partialize: (s) => ({
        sarvam: s.sarvam,
        draft: s.draft,
        customAgents: s.customAgents,
      }),
    },
  ),
);
