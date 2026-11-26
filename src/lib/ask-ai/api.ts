export type AskAiModelId = "openai" | "gemini" | "claude";

export type AskAiModelInfo = {
  id: AskAiModelId;
  label: string;
  model: string;
  available: boolean;
  default: boolean;
};

export const FALLBACK_MODELS: AskAiModelInfo[] = [
  { id: "openai", label: "ChatGPT (OpenAI)", model: "gpt-4.1-mini", available: true, default: true },
  { id: "gemini", label: "Gemini (Google)", model: "gemini", available: true, default: false },
  { id: "claude", label: "Claude (Anthropic)", model: "claude", available: true, default: false },
];

export type AskAiStreamEvent = {
  event: string;
  data: Record<string, unknown>;
};

/** `<BASE>/api/ask_ai_demo` — proxied by Vite locally, or built from VITE_EXPO_FEEDBACK_API_URL's origin. */
export function getAskAiBaseUrl(): string {
  const explicit = (import.meta.env.VITE_ASK_AI_API_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // When running locally under Vite dev server, prefer relative proxied path
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "/api/ask_ai_demo";
  }

  const expo = (import.meta.env.VITE_EXPO_FEEDBACK_API_URL as string | undefined)?.trim();
  if (!expo) return "/api/ask_ai_demo";
  const origin = expo
    .replace(/\/+$/, "")
    .replace(/\/api\/expo_feedback$/, "")
    .replace(/\/api\/ask_ai_demo$/, "")
    .replace(/\/api$/, "");
  return `${origin}/api/ask_ai_demo`;
}

/** Turns a backend media path (/media/...) into a URL the browser can open. */
export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = getAskAiBaseUrl();
  const origin = base.startsWith("http") ? base.replace(/\/api\/ask_ai_demo$/, "") : "";
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function userHeaders(email: string): Record<string, string> {
  return { "X-User-Email": email, Accept: "application/json" };
}

function errorFrom(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    for (const k of ["detail", "error", "message"]) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return `Request failed (${status}).`;
}

async function json<T>(res: Response): Promise<T> {
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) throw new Error(errorFrom(parsed, res.status));
  return parsed as T;
}

export async function fetchModels(): Promise<AskAiModelInfo[]> {
  try {
    const res = await fetch(`${getAskAiBaseUrl()}/chats/models/`, { headers: { Accept: "application/json" } });
    const data = await json<{ models?: AskAiModelInfo[] }>(res);
    return Array.isArray(data.models) && data.models.length ? data.models : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

export async function fetchCredits(email: string): Promise<number | null> {
  try {
    const res = await fetch(`${getAskAiBaseUrl()}/credits/?email=${encodeURIComponent(email)}`, {
      headers: { Accept: "application/json" },
    });
    const body = await json<{ data?: { credits?: number }; credits?: number }>(res);
    const value = body.data?.credits ?? body.credits;
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}

export type AskAiChatSummary = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AskAiRawMessage = {
  id: number;
  chat: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: {
    model_provider?: AskAiModelId;
    model_name?: string;
    multi_group?: string;
    credits_deducted?: number;
    credits_remaining?: number;
    credit_reason?: string;
    generated_file_path?: string;
    generated_file_name?: string;
  } | null;
  attachment?: string | null;
  attachment_name?: string | null;
  attachment_url?: string | null;
};

export async function fetchChats(email: string): Promise<AskAiChatSummary[]> {
  try {
    const res = await fetch(`${getAskAiBaseUrl()}/chats/`, {
      headers: userHeaders(email),
    });
    const parsed = await json<any>(res);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data?.results)
        ? parsed.data.results
        : Array.isArray(parsed?.results)
          ? parsed.results
          : Array.isArray(parsed?.data)
            ? parsed.data
            : [];
    return list;
  } catch {
    return [];
  }
}

export async function fetchChatMessages(chatId: number, email: string): Promise<AskAiRawMessage[]> {
  const res = await fetch(`${getAskAiBaseUrl()}/chats/${chatId}/messages/`, {
    headers: userHeaders(email),
  });
  const parsed = await json<any>(res);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.data?.results)
      ? parsed.data.results
      : Array.isArray(parsed?.results)
        ? parsed.results
        : Array.isArray(parsed?.data)
          ? parsed.data
          : [];
  return list;
}

export async function deleteChat(chatId: number, email: string): Promise<void> {
  const res = await fetch(`${getAskAiBaseUrl()}/chats/${chatId}/delete/`, {
    method: "DELETE",
    headers: userHeaders(email),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete chat (${res.status})`);
  }
}

export async function createChat(email: string, title = "Ask AI"): Promise<number> {
  const res = await fetch(`${getAskAiBaseUrl()}/chats/`, {
    method: "POST",
    headers: { ...userHeaders(email), "Content-Type": "application/json" },
    body: JSON.stringify({ title, email }),
  });
  const chat = await json<{ id: number }>(res);
  return chat.id;
}

/** POST a message and read the Server-Sent-Events reply, calling onEvent for each event. */
export async function streamMessage(opts: {
  chatId: number;
  email: string;
  content: string;
  models: AskAiModelId[];
  signal?: AbortSignal;
  onEvent: (ev: AskAiStreamEvent) => void;
}): Promise<void> {
  const res = await fetch(`${getAskAiBaseUrl()}/chats/${opts.chatId}/messages/stream/`, {
    method: "POST",
    headers: {
      ...userHeaders(opts.email),
      "Content-Type": "application/json",
      Accept: "text/event-stream, */*",
    },
    body: JSON.stringify({ content: opts.content, models: opts.models, email: opts.email }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    throw new Error(errorFrom(parsed, res.status));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (block: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
    }
    if (!dataLines.length) return;
    try {
      opts.onEvent({ event, data: JSON.parse(dataLines.join("\n")) as Record<string, unknown> });
    } catch {
      /* ignore malformed event */
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx).replace(/^\r?\n\r?\n/, "");
      flush(block);
    }
  }
  if (buffer.trim()) flush(buffer);
}
