export type AskAiSession = {
  email: string;
  name: string;
  credits: number;
  claimedAt: number;
};

const ASK_AI_SESSION_KEY = "onesuit-ask-ai-session";

export function loadAskAiSession(): AskAiSession | null {
  try {
    const raw = localStorage.getItem(ASK_AI_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AskAiSession>;
    if (!parsed || typeof parsed.email !== "string" || !parsed.email) return null;
    return {
      email: parsed.email,
      name: typeof parsed.name === "string" ? parsed.name : "",
      credits: Number(parsed.credits) || 0,
      claimedAt: Number(parsed.claimedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveAskAiSession(session: AskAiSession): void {
  try {
    localStorage.setItem(ASK_AI_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore storage errors */
  }
}

export function updateAskAiCredits(credits: number): void {
  const current = loadAskAiSession();
  if (current) saveAskAiSession({ ...current, credits });
}

export function clearAskAiSession(): void {
  try {
    localStorage.removeItem(ASK_AI_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
