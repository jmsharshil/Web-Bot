import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  Coins,
  Copy,
  Cpu,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  Loader2,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FALLBACK_MODELS,
  createChat,
  deleteChat,
  fetchChatMessages,
  fetchChats,
  fetchCredits,
  fetchModels,
  resolveMediaUrl,
  streamMessage,
  type AskAiChatSummary,
  type AskAiModelId,
  type AskAiModelInfo,
  type AskAiRawMessage,
} from "@/lib/ask-ai/api";
import { loadAskAiSession, updateAskAiCredits } from "@/lib/ask-ai/session";
import { cn } from "@/lib/utils";

type Answer = {
  text: string;
  status: string;
  done: boolean;
  error?: string;
  deducted?: number;
  reason?: string;
};

type Turn = {
  id: number;
  prompt: string;
  models: AskAiModelId[];
  answers: Partial<Record<AskAiModelId, Answer>>;
};

interface ModelMeta {
  id: AskAiModelId;
  name: string;
  providerTitle: string;
  badge: string;
  tagline: string;
  accentBorder: string;
  badgeBg: string;
  cardTopBorder: string;
  glowClass: string;
  avatarBg: string;
  renderIcon: (className?: string) => React.ReactNode;
}

const MODEL_CONFIGS: Record<AskAiModelId, ModelMeta> = {
  openai: {
    id: "openai",
    name: "ChatGPT",
    providerTitle: "Azure OpenAI · gpt-4.1-mini",
    badge: "Document & Sandbox Master",
    tagline: "High-speed reasoning, Excel, Word & PowerPoint generation in private sandbox.",
    accentBorder: "border-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200",
    cardTopBorder: "border-t-4 border-emerald-500",
    glowClass: "ring-2 ring-emerald-500/30 bg-emerald-50/40",
    avatarBg: "bg-[#10a37f] text-white",
    renderIcon: (className = "size-4") => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3428 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3427 7.8956zm16.0993 3.8558L12.5993 8.3829l2.02-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.402-.6863zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6602zm-12.641 4.135L12 9.7027l4.1882 2.4106v4.8163L12 19.3402l-4.1882-2.4106z" />
      </svg>
    ),
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    providerTitle: "Google AI · gemini-3.8-flash",
    badge: "Web Grounding & Live Facts",
    tagline: "Real-time Google Search grounding with up-to-date sources and factual accuracy.",
    accentBorder: "border-indigo-500",
    badgeBg: "bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200",
    cardTopBorder: "border-t-4 border-indigo-500",
    glowClass: "ring-2 ring-indigo-500/30 bg-indigo-50/40",
    avatarBg: "bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 text-white",
    renderIcon: (className = "size-4") => (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <path
          d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
          fill="url(#gemini-sparkle-gradient)"
        />
        <defs>
          <linearGradient id="gemini-sparkle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="0.5" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  claude: {
    id: "claude",
    name: "Claude",
    providerTitle: "Anthropic · claude-3.5-sonnet",
    badge: "Nuanced Reasoning & Writing",
    tagline: "Superior literary synthesis, long context depth, and precise code architecture.",
    accentBorder: "border-amber-500",
    badgeBg: "bg-amber-50 text-amber-800 ring-amber-200 border-amber-200",
    cardTopBorder: "border-t-4 border-amber-500",
    glowClass: "ring-2 ring-amber-500/30 bg-amber-50/40",
    avatarBg: "bg-[#cc785c] text-white",
    renderIcon: (className = "size-4") => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M5.636 18.364L18.364 5.636" />
      </svg>
    ),
  },
};

const MIN_CREDITS_PER_MODEL = 10;

function parseMeta(m: unknown): Record<string, any> {
  if (!m) return {};
  if (typeof m === "object") return m as Record<string, any>;
  if (typeof m === "string") {
    try {
      return JSON.parse(m);
    } catch {
      return {};
    }
  }
  return {};
}

function messagesToTurns(messages: AskAiRawMessage[]): Turn[] {
  const turns: Turn[] = [];
  let currentTurn: Turn | null = null;

  for (const msg of messages) {
    if (msg.role === "user") {
      currentTurn = {
        id: msg.id,
        prompt: msg.content,
        models: [],
        answers: {},
      };
      turns.push(currentTurn);
    } else if (msg.role === "assistant") {
      const meta = parseMeta(msg.metadata);
      const provider = (meta.model_provider || "openai") as AskAiModelId;
      if (!currentTurn) {
        currentTurn = {
          id: msg.id,
          prompt: "",
          models: [],
          answers: {},
        };
        turns.push(currentTurn);
      }
      if (!currentTurn.models.includes(provider)) {
        currentTurn.models.push(provider);
      }
      currentTurn.answers[provider] = {
        text: msg.content,
        status: "",
        done: true,
        deducted: meta.credits_deducted,
        reason: meta.credit_reason,
      };
    }
  }

  return turns;
}

function formatChatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24 && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHours < 48) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function renderInline(text: string): React.ReactNode {
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((token, i) => {
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const isDownload = /download|file|\.pdf|\.docx|\.xlsx|\.pptx/i.test(linkMatch[1]);
      return (
        <a
          key={i}
          href={resolveMediaUrl(linkMatch[2])}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition",
            isDownload
              ? "bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 no-underline hover:bg-blue-100 shadow-2xs text-xs"
              : "text-blue-600 hover:text-blue-800",
          )}
        >
          {isDownload ? <FileText className="size-3.5" /> : null}
          {linkMatch[1]}
        </a>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2 && !token.startsWith("**")) {
      return (
        <em key={i} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-slate-800 border border-slate-200/60">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

/** Rich Markdown renderer: headings, lists, code fences, inline bold/code/links. */
function RichText({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const rawBlocks: { type: "code" | "text"; content: string; lang?: string }[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        rawBlocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      rawBlocks.push({
        type: "code",
        lang: match[1] || "code",
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      rawBlocks.push({ type: "text", content: text.slice(lastIndex) });
    }
    return rawBlocks;
  }, [text]);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-slate-800">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <div key={idx} className="my-2.5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs font-mono shadow-sm">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span>{block.lang || "code"}</span>
              </div>
              <pre className="p-3.5 overflow-x-auto leading-normal">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        const lines = block.content.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let listItems: React.ReactNode[] = [];
        let isNumberedList = false;

        const flushList = (key: string) => {
          if (listItems.length > 0) {
            if (isNumberedList) {
              renderedElements.push(
                <ol key={key} className="list-decimal pl-5 space-y-1 my-1.5">
                  {listItems}
                </ol>,
              );
            } else {
              renderedElements.push(
                <ul key={key} className="list-disc pl-5 space-y-1 my-1.5">
                  {listItems}
                </ul>,
              );
            }
            listItems = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            flushList(`flush-${lineIdx}`);
            return;
          }

          if (trimmed.startsWith("# ")) {
            flushList(`before-h1-${lineIdx}`);
            renderedElements.push(
              <h2 key={`h1-${lineIdx}`} className="text-lg font-bold text-slate-900 pt-2 pb-0.5">
                {renderInline(trimmed.slice(2))}
              </h2>,
            );
            return;
          }
          if (trimmed.startsWith("## ")) {
            flushList(`before-h2-${lineIdx}`);
            renderedElements.push(
              <h3 key={`h2-${lineIdx}`} className="text-base font-bold text-slate-900 pt-1.5 pb-0.5">
                {renderInline(trimmed.slice(3))}
              </h3>,
            );
            return;
          }
          if (trimmed.startsWith("### ")) {
            flushList(`before-h3-${lineIdx}`);
            renderedElements.push(
              <h4 key={`h3-${lineIdx}`} className="text-sm font-bold text-slate-900 pt-1 pb-0.5">
                {renderInline(trimmed.slice(4))}
              </h4>,
            );
            return;
          }

          const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
          if (bulletMatch) {
            if (isNumberedList) flushList(`flush-num-${lineIdx}`);
            isNumberedList = false;
            listItems.push(
              <li key={`li-${lineIdx}`}>
                {renderInline(bulletMatch[1])}
              </li>,
            );
            return;
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (numMatch) {
            if (!isNumberedList) flushList(`flush-bullet-${lineIdx}`);
            isNumberedList = true;
            listItems.push(
              <li key={`li-${lineIdx}`}>
                {renderInline(numMatch[2])}
              </li>,
            );
            return;
          }

          flushList(`before-p-${lineIdx}`);
          renderedElements.push(
            <p key={`p-${lineIdx}`} className="leading-relaxed whitespace-pre-wrap">
              {renderInline(line)}
            </p>,
          );
        });

        flushList(`final-${idx}`);

        return <div key={idx} className="space-y-1.5">{renderedElements}</div>;
      })}
    </div>
  );
}

export function AskAIPage() {
  const navigate = useNavigate();
  const session = useMemo(() => loadAskAiSession(), []);

  const [models, setModels] = useState<AskAiModelInfo[]>(FALLBACK_MODELS);
  const [selected, setSelected] = useState<AskAiModelId[]>(["openai"]);
  const [credits, setCredits] = useState<number>(session?.credits ?? 0);
  const [chatId, setChatId] = useState<number | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Side panel state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<AskAiChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "Ask AI · Multi-Model Playground";
  }, []);

  useEffect(() => {
    void fetchModels().then(setModels);
  }, []);

  const loadCredits = useCallback(() => {
    if (!session) return;
    void fetchCredits(session.email).then((value) => {
      if (value !== null) {
        setCredits(value);
        updateAskAiCredits(value);
      }
    });
  }, [session]);

  const loadChatList = useCallback(async () => {
    if (!session) return;
    setLoadingChats(true);
    try {
      const list = await fetchChats(session.email);
      setChats(list);
    } catch {
      // ignore
    } finally {
      setLoadingChats(false);
    }
  }, [session]);

  useEffect(() => {
    loadCredits();
    void loadChatList();
  }, [loadCredits, loadChatList]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleModel = (id: AskAiModelId) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.length === 1 ? prev : prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const selectSoloModel = (id: AskAiModelId) => {
    setSelected([id]);
  };

  const selectAllModels = () => {
    setSelected(["openai", "gemini", "claude"]);
  };

  const patchAnswer = useCallback(
    (turnId: number, model: AskAiModelId, patch: (a: Answer) => Answer) => {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? {
                ...t,
                answers: {
                  ...t.answers,
                  [model]: patch(t.answers[model] ?? { text: "", status: "", done: false }),
                },
              }
            : t,
        ),
      );
    },
    [],
  );

  const openChat = async (id: number) => {
    if (chatId === id && turns.length > 0) return;
    abortRef.current?.abort();
    setChatId(id);
    setLoadingHistory(true);
    try {
      const raw = await fetchChatMessages(id, session?.email || "");
      const loadedTurns = messagesToTurns(raw);
      setTurns(loadedTurns);
    } catch {
      toast.error("Failed to load chat history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const newChat = () => {
    abortRef.current?.abort();
    setChatId(null);
    setTurns([]);
    setInput("");
    setSending(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteChat(id, session?.email || "");
      setChats((prev) => prev.filter((c) => c.id !== id));
      toast.success("Chat deleted.");
      if (chatId === id) {
        newChat();
      }
    } catch {
      toast.error("Failed to delete chat.");
    }
  };

  const copyResponse = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy.");
    }
  };

  if (!session) {
    return <Navigate to="/claim-credits" replace />;
  }

  const needed = selected.length * MIN_CREDITS_PER_MODEL;
  const lowCredits = credits < needed;
  const isArenaMode = selected.length > 1;

  const filteredChats = chats.filter((c) =>
    (c.title || `Chat #${c.id}`).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeChat = chats.find((c) => c.id === chatId);

  const send = async (customPrompt?: string) => {
    const content = (customPrompt ?? input).trim();
    if (!content || sending) return;
    if (lowCredits) {
      toast.error(`You need at least ${needed} credits for ${selected.length} model(s).`);
      return;
    }

    const turnModels = [...selected];
    const turnId = Date.now();
    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        prompt: content,
        models: turnModels,
        answers: Object.fromEntries(
          turnModels.map((m) => [m, { text: "", status: "Thinking…", done: false } satisfies Answer]),
        ),
      },
    ]);
    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let id = chatId;
      if (id === null) {
        id = await createChat(session.email);
        setChatId(id);
      }

      await streamMessage({
        chatId: id,
        email: session.email,
        content,
        models: turnModels,
        signal: controller.signal,
        onEvent: ({ event, data }) => {
          const model = (typeof data.model === "string" ? data.model : turnModels[0]) as AskAiModelId;
          switch (event) {
            case "token":
              patchAnswer(turnId, model, (a) => ({
                ...a,
                text: a.text + String(data.text ?? ""),
                status: "",
              }));
              break;
            case "status":
            case "tool_call":
            case "sandbox_start":
            case "sandbox_progress":
            case "retry":
            case "document_start":
              if (typeof data.message === "string") {
                patchAnswer(turnId, model, (a) => ({ ...a, status: String(data.message) }));
              }
              break;
            case "document_complete":
              if (data.file_url) {
                const url = String(data.file_url);
                const name = String(data.filename || "document");
                const downloadMarkdown = `\n\n📄 **Your document is ready!** [⬇ Download ${name}](${url})`;
                patchAnswer(turnId, model, (a) => ({
                  ...a,
                  text: a.text.includes(url) ? a.text : a.text + downloadMarkdown,
                  status: "Document ready!",
                }));
              }
              break;
            case "credits": {
              const remaining = Number(data.credits_remaining);
              if (Number.isFinite(remaining)) {
                setCredits(remaining);
                updateAskAiCredits(remaining);
              }
              patchAnswer(turnId, model, (a) => ({
                ...a,
                deducted: Number(data.credits_deducted) || 0,
                reason: String(data.reason ?? ""),
              }));
              break;
            }
            case "final":
              if (typeof data.content === "string") {
                patchAnswer(turnId, model, (a) => ({ ...a, text: String(data.content), status: "", done: true }));
              }
              break;
            case "error": {
              const targets = data.model ? [model] : turnModels;
              for (const target of targets) {
                patchAnswer(turnId, target, (a) => ({
                  ...a,
                  error: String(data.message ?? "Something went wrong."),
                  status: "",
                  done: true,
                }));
              }
              if (typeof data.credits_remaining === "number") setCredits(data.credits_remaining);
              break;
            }
            default:
              break;
          }
        },
      });

      void loadChatList();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const message = err instanceof Error ? err.message : "Could not reach Ask AI.";
        toast.error(message);
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  answers: Object.fromEntries(
                    t.models.map((m) => [m, { text: "", status: "", done: true, error: message } satisfies Answer]),
                  ),
                }
              : t,
          ),
        );
      }
    } finally {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === turnId
            ? {
                ...t,
                answers: Object.fromEntries(
                  t.models.map((m) => [m, { ...(t.answers[m] as Answer), done: true, status: "" }]),
                ),
              }
            : t,
        ),
      );
      setSending(false);
      void loadChatList();
    }
  };

  return (
    <div className="expo-grid flex h-dvh flex-col overflow-hidden text-foreground">
      {/* Top Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(11,21,48,0.06)] z-20">
        <div className="expo-stripe h-1 w-full" />
        <div className="border-b border-slate-200 px-4 py-2.5 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
              </button>

              <Link to="/" className="flex items-center gap-3 min-w-0">
                <img src="/jms-logo.png" alt="JMS" className="h-8 w-auto object-contain shrink-0" />
                <div className="border-l border-slate-200 pl-3 min-w-0">
                  <p className="text-sm font-bold tracking-tight text-slate-900 truncate max-w-[200px] sm:max-w-md">
                    {activeChat?.title ? activeChat.title : "Ask AI Playground"}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={newChat} className="rounded-xl gap-1.5 text-xs font-medium">
                <Plus className="size-3.5" /> <span className="hidden sm:inline">New chat</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-xl text-xs text-slate-600">
                <ArrowLeft className="size-3.5" /> <span className="hidden sm:inline">Onesuite</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side Panel */}
        <aside
          className={cn(
            "border-r border-slate-200 bg-white/95 backdrop-blur flex flex-col shrink-0 transition-all duration-300 ease-in-out z-10",
            sidebarOpen ? "w-72 sm:w-80" : "w-0 -translate-x-full border-r-0 overflow-hidden",
          )}
        >
          {/* Sidebar Top: New Chat + Search */}
          <div className="p-3 border-b border-slate-100 flex flex-col gap-2">
            <Button
              onClick={newChat}
              className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm rounded-xl text-xs h-9.5 font-medium"
            >
              <Plus className="size-4" />
              <span>New Conversation</span>
            </Button>
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter chats…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* Sidebar Chat List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Saved Chats</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                {chats.length}
              </span>
            </div>

            {loadingChats && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Loading conversations…</span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                {searchQuery ? "No matching chats." : "No saved chats yet."}
              </div>
            ) : (
              filteredChats.map((c) => {
                const isActive = c.id === chatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => void openChat(c.id)}
                    className={cn(
                      "group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition select-none",
                      isActive
                        ? "bg-blue-50 text-blue-900 font-medium border border-blue-200 shadow-xs"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={cn("size-3.5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{c.title || `Chat #${c.id}`}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatChatTime(c.updated_at || c.created_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => void handleDeleteChat(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Delete chat"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer: User email & Credits */}
          <div className="p-3 border-t border-slate-200/80 bg-slate-50/80 flex flex-col gap-2.5 shrink-0">
            {/* Credits Balance Widget */}
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-amber-100 text-amber-800">
                  <Coins className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-amber-800/80 font-bold leading-none">
                    Trial Credits
                  </p>
                  <p className="text-xs font-extrabold text-amber-950 font-mono mt-0.5">
                    {credits.toLocaleString()} <span className="font-normal text-[10px] text-amber-800">remaining</span>
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                  lowCredits ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200",
                )}
              >
                {lowCredits ? "Low" : "Active"}
              </span>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 px-1 py-0.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                {session.name ? session.name.charAt(0).toUpperCase() : session.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                  {session.name || "Trial Account"}
                </p>
                <p className="truncate text-[11px] text-slate-500 font-mono" title={session.email}>
                  {session.email}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Conversation Area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          {/* History Loading Overlay */}
          {loadingHistory ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500 gap-2">
              <Loader2 className="size-5 animate-spin text-blue-600" />
              <span>Loading conversation history…</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
              {turns.length === 0 ? (
                <div className="mx-auto mt-8 max-w-2xl text-center space-y-6">
                  <div className="space-y-2">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Sparkles className="size-7" />
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                      Multi-Model AI Arena
                    </h1>
                    <p className="mx-auto max-w-lg text-sm text-slate-500">
                      Select one model for fast everyday answers, or choose multiple models to pit them head-to-head in real time.
                    </p>
                  </div>

                  {/* 3 Model Feature Cards */}
                  <div className="grid gap-3 sm:grid-cols-3 text-left">
                    {(["openai", "gemini", "claude"] as AskAiModelId[]).map((mid) => {
                      const cfg = MODEL_CONFIGS[mid];
                      const isSel = selected.includes(mid);
                      return (
                        <div
                          key={mid}
                          onClick={() => toggleModel(mid)}
                          className={cn(
                            "cursor-pointer rounded-2xl p-4 transition-all duration-200 border bg-white shadow-xs relative flex flex-col justify-between",
                            isSel
                              ? `${cfg.accentBorder} ring-2 ring-blue-500/20 shadow-sm bg-gradient-to-b from-white to-slate-50/60`
                              : "border-slate-200 hover:border-slate-300 hover:shadow-xs",
                          )}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
                                {cfg.renderIcon("size-4")}
                              </span>
                              <span
                                className={cn(
                                  "grid size-5 place-items-center rounded-full border text-[10px] transition",
                                  isSel
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-slate-300 bg-white text-transparent",
                                )}
                              >
                                <Check className="size-3" />
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{cfg.name}</p>
                              <p className="text-[11px] font-mono text-slate-400">{cfg.providerTitle}</p>
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">{cfg.tagline}</p>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.badgeBg)}>
                              {cfg.badge}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Starter Prompts */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-slate-400">Try one of these prompts:</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {[
                        "Create a sales revenue comparison table with percentages",
                        "What are the top 3 AI trends right now?",
                        "Draft a professional apology email for a shipping delay",
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => void send(prompt)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-xs transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-900"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Chat Conversation Turns */}
              <div className="mx-auto max-w-3xl lg:max-w-4xl space-y-8 w-full py-2">
                {turns.map((turn) => (
                  <div key={turn.id} className="space-y-5">
                    {/* User Prompt Bubble */}
                    {turn.prompt ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-3xl bg-blue-600 px-5 py-3 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap text-white shadow-xs font-normal">
                          {turn.prompt}
                        </div>
                      </div>
                    ) : null}

                    {/* Model Answers - Solo (ChatGPT / Claude style) vs Multi-Model Arena */}
                    {turn.models.length === 1 ? (
                      turn.models.map((m) => {
                        const a = turn.answers[m];
                        const cfg = MODEL_CONFIGS[m];
                        const answerKey = `${turn.id}-${m}`;
                        const isCopied = copiedKey === answerKey;

                        return (
                          <div key={m} className="flex items-start gap-3.5 sm:gap-4 group">
                            {/* AI Avatar */}
                            <div className={cn("grid size-8 shrink-0 place-items-center rounded-full shadow-xs mt-0.5", cfg.avatarBg)}>
                              {cfg.renderIcon("size-4")}
                            </div>

                            {/* Clean Text Answer Area - NO boxes, NO borders, NO badges, NO credits */}
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Error State */}
                              {a?.error ? (
                                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                                  <div className="leading-relaxed">{a.error}</div>
                                </div>
                              ) : null}

                              {/* Live Streaming status */}
                              {a && !a.done && (a.status || !a.text) ? (
                                <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
                                  <Loader2 className="size-3.5 animate-spin text-blue-600" />
                                  <span className="font-medium animate-pulse">{a.status || "Thinking…"}</span>
                                </div>
                              ) : null}

                              {/* Markdown text answer */}
                              {a?.text ? <RichText text={a.text} /> : null}

                              {/* Minimalist Action Bar (ChatGPT / Claude style) */}
                              {a?.text && a.done ? (
                                <div className="flex items-center gap-2 pt-1 text-slate-400">
                                  <button
                                    type="button"
                                    onClick={() => void copyResponse(answerKey, a.text)}
                                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title="Copy answer"
                                  >
                                    {isCopied ? (
                                      <>
                                        <CheckCheck className="size-3.5 text-emerald-600" />
                                        <span className="text-emerald-600 font-medium text-[11px]">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="size-3.5" />
                                        <span className="text-[11px]">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        className={cn(
                          "grid gap-4",
                          turn.models.length === 2 ? "md:grid-cols-2" : "lg:grid-cols-3",
                        )}
                      >
                        {turn.models.map((m) => {
                          const a = turn.answers[m];
                          const cfg = MODEL_CONFIGS[m];
                          const answerKey = `${turn.id}-${m}`;
                          const isCopied = copiedKey === answerKey;

                          return (
                            <div
                              key={m}
                              className="flex flex-col rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs space-y-3"
                            >
                              {/* Clean minimal header: just the avatar and model name */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className={cn("grid size-6 place-items-center rounded-full shadow-2xs", cfg.avatarBg)}>
                                    {cfg.renderIcon("size-3.5")}
                                  </span>
                                  <span className="font-semibold text-xs text-slate-800">{cfg.name}</span>
                                </div>
                                {a?.text ? (
                                  <button
                                    type="button"
                                    onClick={() => void copyResponse(answerKey, a.text)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                    title="Copy"
                                  >
                                    {isCopied ? <CheckCheck className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                  </button>
                                ) : null}
                              </div>

                              {/* Answer body */}
                              <div className="flex-1 min-w-0 space-y-2">
                                {a?.error ? (
                                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                                    {a.error}
                                  </div>
                                ) : null}

                                {a && !a.done && (a.status || !a.text) ? (
                                  <div className="flex items-center gap-2 py-1 text-xs text-slate-500">
                                    <Loader2 className="size-3.5 animate-spin text-blue-600" />
                                    <span className="font-medium animate-pulse">{a.status || "Thinking…"}</span>
                                  </div>
                                ) : null}

                                {a?.text ? <RichText text={a.text} /> : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </div>
          )}

          {/* Interactive Model Selector & Input Dock */}
          <div className="shrink-0 p-4 md:px-8 border-t border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-4xl space-y-3">
              {/* Distinct Model Selector Cards */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                    {isArenaMode ? "⚡ Compare Mode" : "Solo Model"}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-500">
                    {selected.length === 1
                      ? `Using ${MODEL_CONFIGS[selected[0]].name}`
                      : `${selected.length} models answering side-by-side`}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={selectAllModels}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 px-1"
                  >
                    Compare All 3
                  </button>
                </div>
              </div>

              {/* 3 Model Selector Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["openai", "gemini", "claude"] as AskAiModelId[]).map((mid) => {
                  const cfg = MODEL_CONFIGS[mid];
                  const isSel = selected.includes(mid);
                  return (
                    <div
                      key={mid}
                      onClick={() => toggleModel(mid)}
                      className={cn(
                        "group cursor-pointer rounded-xl border p-2.5 transition-all flex items-center justify-between gap-2.5 select-none",
                        isSel
                          ? `${cfg.accentBorder} bg-white ring-2 ring-blue-500/20 shadow-xs`
                          : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-600",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg border transition",
                            isSel
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 group-hover:border-slate-300",
                          )}
                        >
                          {cfg.renderIcon("size-4")}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{cfg.name}</span>
                            {isSel ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{cfg.badge}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSoloModel(mid);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-slate-500 hover:text-blue-600 px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition"
                          title="Use only this model"
                        >
                          Solo
                        </button>
                        <span
                          className={cn(
                            "grid size-4 place-items-center rounded border transition",
                            isSel ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white text-transparent",
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex items-end gap-2 rounded-2xl bg-white p-2 shadow-sm border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder={
                    lowCredits
                      ? "Not enough credits remaining to send"
                      : isArenaMode
                        ? `Ask anything to compare ${selected.length} models… (Shift+Enter for a new line)`
                        : `Ask anything to ${MODEL_CONFIGS[selected[0]].name}… (Shift+Enter for a new line)`
                  }
                  className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={sending || !input.trim() || lowCredits}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs gap-1.5"
                >
                  {sending ? <Loader2 className="animate-spin size-4" /> : <SendHorizontal className="size-4" />}
                  <span>Send</span>
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
