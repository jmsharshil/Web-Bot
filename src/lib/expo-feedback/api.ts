export type ExpoSessionStatus = "STARTED" | "COMPLETED";

export type ExpoFeedbackItem = {
  id: string;
  rating: number;
  feedback_description: string;
  submitted_at: string;
};

export type ExpoSession = {
  session_id: string;
  user_name: string;
  email_id: string;
  phone_number: string;
  status: ExpoSessionStatus;
  rating: number | null;
  feedback_description: string;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  feedback_count: number;
  feedbacks: ExpoFeedbackItem[];
};

export type ExpoEntryRequest = {
  user_name: string;
  email_id: string;
  phone_number: string;
};

export type ExpoFeedbackRequest = {
  session_id?: string | null;
  rating: number;
  feedback_description?: string;
};

export type ExpoFeedbackSubmissionData = {
  session: ExpoSession;
  feedback: ExpoFeedbackItem;
  auto_created_session: boolean;
};

export type ExpoSessionListData = {
  count: number;
  results: ExpoSession[];
};

export type ExpoFeedbackSummary = {
  total_sessions: number;
  started_sessions: number;
  completed_sessions: number;
  total_feedbacks: number;
  average_rating: number;
  rating_breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  detail?: string;
  error?: string;
};

/**
 * Resolves the Expo Feedback API base URL (`<BASE_URL>/api/expo_feedback`).
 *
 * - When `VITE_EXPO_FEEDBACK_API_URL` is unset, uses relative `/api/expo_feedback`,
 *   which Vite proxies to `http://127.0.0.1:8000` in local dev and works on same-origin
 *   production deployments.
 * - Accepts a bare origin (`http://127.0.0.1:8000`, `https://api.example.com`) or a full
 *   path ending in `/api/expo_feedback`.
 */
export function getExpoFeedbackBaseUrl(): string {
  const raw = (
    import.meta.env.VITE_EXPO_FEEDBACK_API_URL as string | undefined
  )?.trim();

  if (!raw) {
    return "/api/expo_feedback";
  }

  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/expo_feedback")) {
    return trimmed;
  }
  if (trimmed.endsWith("/api")) {
    return `${trimmed}/expo_feedback`;
  }
  return `${trimmed}/api/expo_feedback`;
}

function extractApiError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["message", "detail", "error"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    // DRF field-level validation errors, e.g. { rating: ["Ensure this value is..."] }
    for (const [field, value] of Object.entries(obj)) {
      if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
        return `${field}: ${value[0].trim()}`;
      }
      if (typeof value === "string" && value.trim()) {
        return `${field}: ${value.trim()}`;
      }
    }
  }

  return `Request failed (${status}). Please try again.`;
}

async function requestExpoApi<T>(
  path: string,
  init: { method: "GET" | "POST" | "PATCH"; body?: unknown },
): Promise<T> {
  const url = `${getExpoFeedbackBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (init.method === "POST" || init.method === "PATCH") {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new Error(
      "Unable to reach the Expo Feedback server. Please check your connection and try again.",
    );
  }

  const text = await res.text();
  let parsed: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok || parsed?.success === false) {
    throw new Error(extractApiError(parsed, res.status));
  }

  if (!parsed || parsed.data === undefined) {
    throw new Error("Unexpected response from Expo Feedback server.");
  }

  return parsed.data;
}

/** 1. Start Session (Entry Form) — POST /api/expo_feedback/entry/ */
export function startExpoSession(payload: ExpoEntryRequest): Promise<ExpoSession> {
  return requestExpoApi<ExpoSession>("/entry/", {
    method: "POST",
    body: {
      user_name: payload.user_name.trim(),
      email_id: payload.email_id.trim(),
      phone_number: payload.phone_number.trim(),
    },
  });
}

/** 2. Submit Feedback & Complete Session — POST /api/expo_feedback/feedback/ */
export function submitExpoFeedback(
  payload: ExpoFeedbackRequest,
): Promise<ExpoFeedbackSubmissionData> {
  const sessionId = payload.session_id?.trim();
  const rating = Math.min(5, Math.max(1, Math.round(Number(payload.rating) || 0)));
  const body: Record<string, unknown> = {
    rating,
    feedback_description: (payload.feedback_description ?? "").trim(),
  };
  if (sessionId) {
    body.session_id = sessionId;
  }

  return requestExpoApi<ExpoFeedbackSubmissionData>("/feedback/", {
    method: "POST",
    body,
  });
}

/** 2 (alt). Submit Feedback via session-scoped URL — POST /api/expo_feedback/sessions/<session_id>/feedback/ */
export function submitExpoSessionFeedback(
  sessionId: string,
  payload: Omit<ExpoFeedbackRequest, "session_id">,
): Promise<ExpoFeedbackSubmissionData> {
  const rating = Math.min(5, Math.max(1, Math.round(Number(payload.rating) || 0)));
  return requestExpoApi<ExpoFeedbackSubmissionData>(
    `/sessions/${encodeURIComponent(sessionId.trim())}/feedback/`,
    {
      method: "POST",
      body: {
        rating,
        feedback_description: (payload.feedback_description ?? "").trim(),
      },
    },
  );
}

/** 3. Get / Check Single Session — GET /api/expo_feedback/sessions/<session_id>/ (returns null on 404) */
export async function getExpoSession(sessionId: string): Promise<ExpoSession | null> {
  const trimmed = sessionId.trim();
  if (!trimmed) return null;

  const url = `${getExpoFeedbackBaseUrl()}/sessions/${encodeURIComponent(trimmed)}/`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Unable to reach the Expo Feedback server. Please check your connection and try again.",
    );
  }

  if (res.status === 404) {
    return null;
  }

  const text = await res.text();
  let parsed: ApiEnvelope<ExpoSession> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiEnvelope<ExpoSession>;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok || parsed?.success === false || !parsed?.data) {
    throw new Error(extractApiError(parsed, res.status));
  }

  return parsed.data;
}

/** 4. Update Entry Details on Active Session — PATCH /api/expo_feedback/sessions/<session_id>/ */
export function updateExpoSession(
  sessionId: string,
  payload: Partial<ExpoEntryRequest>,
): Promise<ExpoSession> {
  const body: Partial<ExpoEntryRequest> = {};
  if (payload.user_name !== undefined) body.user_name = payload.user_name.trim();
  if (payload.email_id !== undefined) body.email_id = payload.email_id.trim();
  if (payload.phone_number !== undefined) body.phone_number = payload.phone_number.trim();

  return requestExpoApi<ExpoSession>(
    `/sessions/${encodeURIComponent(sessionId.trim())}/`,
    {
      method: "PATCH",
      body,
    },
  );
}

/** 5. List All Sessions — GET /api/expo_feedback/sessions/ */
export function listExpoSessions(params?: {
  status?: ExpoSessionStatus;
  rating?: number;
  search?: string;
}): Promise<ExpoSessionListData> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.rating !== undefined) qs.set("rating", String(params.rating));
  if (params?.search?.trim()) qs.set("search", params.search.trim());
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return requestExpoApi<ExpoSessionListData>(`/sessions/${suffix}`, {
    method: "GET",
  });
}

/** 6. Feedback Summary / Analytics — GET /api/expo_feedback/summary/ */
export function getExpoFeedbackSummary(): Promise<ExpoFeedbackSummary> {
  return requestExpoApi<ExpoFeedbackSummary>("/summary/", {
    method: "GET",
  });
}
