import type { Evaluation, InterviewConfig, Turn } from "./types";

async function post<T>(
  path: string,
  body: unknown,
): Promise<T | { ok: false; error: string }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text) as T;
      return data;
    } catch {
      return {
        ok: false,
        error: res.ok
          ? "Invalid response from server."
          : `Server unavailable (${res.status}).`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network request failed.",
    };
  }
}

export function evaluateInterview(input: {
  config: InterviewConfig;
  turns: Turn[];
}) {
  return post<{ ok: true; report: Evaluation } | { ok: false; error: string }>(
    "/api/evaluate",
    input,
  );
}
