import {
  submitExpoFeedback,
  type ExpoFeedbackSubmissionData,
} from "@/lib/expo-feedback/api";

export type UserProfile = {
  sessionId?: string;
  name: string;
  phone: string;
  email: string;
  startedAt: number;
};

export type SessionFeedback = {
  id: string;
  sessionId?: string;
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
    const sessionId =
      typeof parsed.sessionId === "string" && parsed.sessionId.trim()
        ? parsed.sessionId.trim()
        : undefined;
    return {
      ...(sessionId ? { sessionId } : {}),
      name: parsed.name.trim(),
      phone: parsed.phone.trim(),
      email: parsed.email.trim(),
      startedAt: Number(parsed.startedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveUserProfile(
  profile: Omit<UserProfile, "startedAt"> & { startedAt?: number },
): UserProfile {
  const sessionId = profile.sessionId?.trim() || undefined;
  const clean: UserProfile = {
    ...(sessionId ? { sessionId } : {}),
    name: profile.name.trim(),
    phone: profile.phone.trim(),
    email: profile.email.trim(),
    startedAt: profile.startedAt ?? Date.now(),
  };
  sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(clean));
  return clean;
}

export function clearUserProfile() {
  sessionStorage.removeItem(USER_SESSION_KEY);
}

export async function submitSessionFeedback(
  input: Omit<SessionFeedback, "id" | "submittedAt" | "sessionId">,
): Promise<{ entry: SessionFeedback; response: ExpoFeedbackSubmissionData }> {
  const response = await submitExpoFeedback({
    session_id: input.user.sessionId,
    rating: input.rating,
    feedback_description: input.comment,
  });

  const submittedAt = Date.parse(response.feedback.submitted_at);
  const entry: SessionFeedback = {
    ...input,
    id: response.feedback.id || crypto.randomUUID(),
    sessionId: response.session.session_id || input.user.sessionId,
    submittedAt: Number.isFinite(submittedAt) ? submittedAt : Date.now(),
  };

  try {
    const prevRaw = localStorage.getItem(FEEDBACK_HISTORY_KEY);
    const prev = prevRaw ? (JSON.parse(prevRaw) as SessionFeedback[]) : [];
    const next = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 100);
    localStorage.setItem(FEEDBACK_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage quota errors */
  }

  return { entry, response };
}
