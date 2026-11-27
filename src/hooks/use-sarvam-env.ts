import { useEffect } from "react";
import { useInterviewStore } from "@/lib/interviews/store";
import { envSarvamCredentials, mergeCredentials } from "@/lib/sarvam/env";

/**
 * On boot: fill store from VITE_ env without overwriting non-empty credentials
 * already saved in the browser store.
 */
export function useSarvamEnvBootstrap() {
  useEffect(() => {
    const fromEnv = envSarvamCredentials();
    const current = useInterviewStore.getState().sarvam;
    const merged = mergeCredentials(current, fromEnv);
    if (
      merged.apiKey !== current.apiKey ||
      merged.orgId !== current.orgId ||
      merged.workspaceId !== current.workspaceId ||
      merged.appId !== current.appId
    ) {
      useInterviewStore.getState().setSarvam(merged);
    }
  }, []);
}
