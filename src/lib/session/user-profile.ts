export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  startedAt: number;
};

export type SessionFeedback = {
  id: string;
  user: UserProfile;
  agentId: string;
  agentName: string;
  rating: number;
  comment: string;
  turnsCount: number;
  durationSec: number;
  submittedAt: number;
};

const USER_SESSION_KEY = "voice-studio-active-user";
const FEEDBACK_HISTORY_KEY = "voice-studio-feedback-history";

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (!parsed.name?.trim() || !parsed.phone?.trim() || !parsed.email?.trim()) {
      return null;
    }
    return {
      name: parsed.name.trim(),
      phone: parsed.phone.trim(),
      email: parsed.email.trim(),
      startedAt: Number(parsed.startedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveUserProfile(profile: Omit<UserProfile, "startedAt">): UserProfile {
  const clean: UserProfile = {
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    email: profile.email.trim(),
    startedAt: Date.now(),
  };
  sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(clean));
  return clean;
}

export function clearUserProfile() {
  sessionStorage.removeItem(USER_SESSION_KEY);
}

export async function submitSessionFeedback(
  input: Omit<SessionFeedback, "id" | "submittedAt">,
): Promise<SessionFeedback> {
  const entry: SessionFeedback = {
    ...input,
    id: crypto.randomUUID(),
    submittedAt: Date.now(),
  };

  try {
    const prevRaw = localStorage.getItem(FEEDBACK_HISTORY_KEY);
    const prev = prevRaw ? (JSON.parse(prevRaw) as SessionFeedback[]) : [];
    const next = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 100);
    localStorage.setItem(FEEDBACK_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage quota errors */
  }

  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch {
    /* best-effort backend delivery */
  }

  return entry;
}
