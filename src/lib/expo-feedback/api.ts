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

export type ExpoIndustryOption = {
  value: string;
  label: string;
};

export type ExpoIndustriesData = {
  placeholder: string;
  industries: ExpoIndustryOption[];
};

export type ExpoClaimTrialRequest = {
  user_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  industry: string;
  address: string;
  session_id?: string | null;
};

export type ExpoClaimTrial = {
  id: string;
  session_id: string | null;
  user_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  industry: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type ExpoVoiceAgent = {
  id: string;
  name: string;
  app_id: string;
  description: string;
  language: string;
  accent: string;
  include_agent_variables: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ExpoVoiceAgentCreateRequest = {
  id: string;
  name: string;
  app_id: string;
  description?: string;
  language?: string;
  accent?: string;
  include_agent_variables?: boolean;
};

export type ExpoVoiceAgentListData = {
  count: number;
  results: ExpoVoiceAgent[];
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
  init: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    extraHeaders?: Record<string, string>;
  },
): Promise<T> {
  const url = `${getExpoFeedbackBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.extraHeaders ?? {}),
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

/** Part B (3). Get Industry Dropdown Options — GET /api/expo_feedback/claim_trial/industries/ */
export function getExpoIndustries(): Promise<ExpoIndustriesData> {
  return requestExpoApi<ExpoIndustriesData>("/claim_trial/industries/", {
    method: "GET",
  });
}

/** Part B (4). Submit Claim Trial Form — POST /api/expo_feedback/claim_trial/ */
export function submitExpoClaimTrial(
  payload: ExpoClaimTrialRequest,
): Promise<ExpoClaimTrial> {
  const sessionId = payload.session_id?.trim();
  const body: Record<string, unknown> = {
    user_name: payload.user_name.trim(),
    email: payload.email.trim(),
    phone_number: payload.phone_number.trim(),
    company_name: payload.company_name.trim(),
    industry: payload.industry.trim(),
    address: payload.address.trim(),
  };
  if (sessionId) {
    body.session_id = sessionId;
  }

  return requestExpoApi<ExpoClaimTrial>("/claim_trial/", {
    method: "POST",
    body,
  });
}

/** Voice Agents (Public) — GET /api/expo_feedback/agents/ */
export async function listExpoAgents(): Promise<ExpoVoiceAgent[]> {
  const data = await requestExpoApi<ExpoVoiceAgentListData | ExpoVoiceAgent[]>(
    "/agents/",
    { method: "GET" },
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

/** Voice Agents (Admin, X-Admin-Pin) — POST /api/expo_feedback/agents/ */
export function createExpoAgent(
  payload: ExpoVoiceAgentCreateRequest,
  adminPin: string,
): Promise<ExpoVoiceAgent> {
  return requestExpoApi<ExpoVoiceAgent>("/agents/", {
    method: "POST",
    extraHeaders: {
      "X-Admin-Pin": adminPin.trim(),
    },
    body: {
      id: payload.id.trim(),
      name: payload.name.trim(),
      app_id: payload.app_id.trim(),
      description: (payload.description ?? "Interactive AI voice agent.").trim(),
      language: (payload.language ?? "English").trim(),
      accent: (payload.accent ?? "blue").trim(),
      include_agent_variables: Boolean(payload.include_agent_variables),
    },
  });
}

/** Voice Agents (Admin, X-Admin-Pin) — DELETE /api/expo_feedback/agents/<id>/ */
export async function deleteExpoAgent(
  agentId: string,
  adminPin: string,
): Promise<void> {
  const trimmed = agentId.trim();
  if (!trimmed) return;

  const url = `${getExpoFeedbackBaseUrl()}/agents/${encodeURIComponent(trimmed)}/`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-Admin-Pin": adminPin.trim(),
      },
    });
  } catch {
    throw new Error(
      "Unable to reach the Expo Feedback server. Please check your connection and try again.",
    );
  }

  // Already deleted by another admin
  if (res.status === 404 || res.status === 204) {
    return;
  }

  const text = await res.text();
  let parsed: ApiEnvelope<unknown> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiEnvelope<unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!res.ok || parsed?.success === false) {
    throw new Error(extractApiError(parsed, res.status));
  }
}
