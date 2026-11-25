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

export function loadFeedbackHistory(): SessionFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionFeedback[]) : [];
  } catch {
    return [];
  }
}

function csvCell(value: unknown): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export function downloadFeedbackCsv(entries: SessionFeedback[]) {
  const header = [
    "Submitted At",
    "Name",
    "Phone",
    "Email",
    "Agent",
    "Rating (out of 5)",
    "Comment",
    "Messages",
    "Duration (sec)",
  ];
  const rows = entries.map((item) => [
    new Date(item.submittedAt).toLocaleString(),
    item.user?.name ?? "",
    item.user?.phone ?? "",
    item.user?.email ?? "",
    item.agentName ?? "",
    item.rating,
    item.comment ?? "",
    item.turnsCount ?? 0,
    item.durationSec ?? 0,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `jms-expo-feedback-${dateTag}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
