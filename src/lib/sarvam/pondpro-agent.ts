import type { InterviewConfig, SarvamCredentials } from "@/lib/interviews/types";
import { connectSarvamAgent } from "@/lib/sarvam/session";
import type { SarvamCallbacks, SarvamHandle } from "@/lib/sarvam/session";

export type { SarvamCallbacks, SarvamHandle } from "@/lib/sarvam/session";

function hasPondProCredentials(credentials: SarvamCredentials): boolean {
  return Boolean(
    credentials.apiKey &&
      credentials.orgId &&
      credentials.workspaceId &&
      credentials.appId,
  );
}

export function pondProCredentials(): SarvamCredentials {
  return {
    apiKey: import.meta.env.VITE_SARVAM_API_KEY?.trim() || "",
    orgId: import.meta.env.VITE_SARVAM_ORG_ID?.trim() || "",
    workspaceId: import.meta.env.VITE_SARVAM_WORKSPACE_ID?.trim() || "",
    appId: import.meta.env.VITE_SARVAM_PONDPRO_AGENT_ID?.trim() || "",
  };
}

export function isPondProConfigured(): boolean {
  return hasPondProCredentials(pondProCredentials());
}

export function connectPondProAgent(
  config: InterviewConfig,
  callbacks: SarvamCallbacks,
): Promise<SarvamHandle> {
  const credentials = pondProCredentials();
  if (!hasPondProCredentials(credentials)) {
    const error = new Error(
      "PondPro is not configured. Set VITE_SARVAM_API_KEY, VITE_SARVAM_ORG_ID, VITE_SARVAM_WORKSPACE_ID, and VITE_SARVAM_PONDPRO_AGENT_ID.",
    );
    callbacks.onError(error.message);
    return Promise.reject(error);
  }
  return connectSarvamAgent(credentials, config, callbacks, {
    includeAgentVariables: false,
  });
}
