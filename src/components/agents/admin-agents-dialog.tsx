import { useEffect, useState } from "react";
import {
  AudioLines,
  Download,
  Lock,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useInterviewStore } from "@/lib/interviews/store";
import {
  AGENT_ACCENTS,
  type AgentAccent,
  type WebAgent,
} from "@/lib/sarvam/agents";
import {
  downloadFeedbackCsv,
  loadFeedbackHistory,
  type SessionFeedback,
} from "@/lib/session/user-profile";
import { cn } from "@/lib/utils";

function expectedAdminPin(): string {
  return (import.meta.env.VITE_ADMIN_PIN as string | undefined)?.trim() || "";
}

type AdminAgentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: WebAgent[];
  activeAgentId: string | null;
  onAgentAdded: (agent: WebAgent) => void;
  onAgentRemoved: (agent: WebAgent) => void;
};

type AdminTab = "agents" | "leads";

export function AdminAgentsDialog({
  open,
  onOpenChange,
  agents,
  activeAgentId,
  onAgentAdded,
  onAgentRemoved,
}: AdminAgentsDialogProps) {
  const addCustomAgent = useInterviewStore((s) => s.addCustomAgent);
  const removeCustomAgent = useInterviewStore((s) => s.removeCustomAgent);

  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<AdminTab>("agents");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState<AgentAccent>("blue");
  const [saving, setSaving] = useState(false);
  const [feedbackEntries, setFeedbackEntries] = useState<SessionFeedback[]>([]);

  const configuredPin = expectedAdminPin();

  useEffect(() => {
    if (unlocked) {
      setFeedbackEntries(loadFeedbackHistory());
    }
  }, [unlocked, tab]);

  const resetAll = () => {
    setUnlocked(false);
    setTab("agents");
    setPinInput("");
    setPinError("");
    setName("");
    setAppId("");
    setDescription("");
    setAccent("blue");
    setSaving(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) resetAll();
    onOpenChange(next);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuredPin) {
      setPinError("Admin passcode (VITE_ADMIN_PIN) is not configured in .env.");
      return;
    }
    if (pinInput.trim() !== configuredPin) {
      setPinError("Incorrect passcode. Authorized staff only.");
      return;
    }
    setPinError("");
    setUnlocked(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanAppId = appId.trim();

    if (!cleanName || !cleanAppId) {
      toast.error("Agent name and Sarvam Agent ID are required.");
      return;
    }

    if (agents.some((a) => a.appId.toLowerCase() === cleanAppId.toLowerCase())) {
      toast.error("An agent with this Agent ID is already in the list.");
      return;
    }

    const slugBase = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const id = `${slugBase || "agent"}-${Date.now().toString(36).slice(-4)}`;

    const payload: Omit<WebAgent, "source"> = {
      id,
      name: cleanName,
      appId: cleanAppId,
      description:
        description.trim() || "Interactive AI voice agent.",
      language: "English",
      accent,
      includeAgentVariables: false,
    };

    setSaving(true);
    try {
      const created = addCustomAgent(payload);

      try {
        await fetch("/api/agents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-pin": pinInput.trim(),
          },
          body: JSON.stringify(created),
        });
      } catch {
        /* static hosting — saved locally in this browser */
      }

      toast.success(`Added "${created.name}" to the dropdown.`);
      setName("");
      setAppId("");
      setDescription("");
      setAccent("blue");
      onAgentAdded(created);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agent: WebAgent) => {
    removeCustomAgent(agent.id);
    onAgentRemoved(agent);

    try {
      await fetch(`/api/agents/${encodeURIComponent(agent.id)}`, {
        method: "DELETE",
        headers: { "x-admin-pin": pinInput.trim() },
      });
    } catch {
      /* static hosting */
    }

    toast.message(`Removed "${agent.name}".`);
  };

  const avgRating =
    feedbackEntries.length > 0
      ? (
          feedbackEntries.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
          feedbackEntries.length
        ).toFixed(1)
      : "—";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {!unlocked ? (
          <>
            <DialogHeader>
              <div className="mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                <Lock className="size-5" />
              </div>
              <DialogTitle>Authorized Access</DialogTitle>
              <DialogDescription>
                Enter the admin passcode to manage voice agents or export visitor
                leads &amp; ratings.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-pin">Admin Passcode</Label>
                <Input
                  id="admin-pin"
                  type="password"
                  autoComplete="off"
                  placeholder="Enter admin passcode"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError("");
                  }}
                  autoFocus
                />
                {pinError ? (
                  <p className="text-xs font-medium text-red-600">{pinError}</p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Unlock</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <ShieldCheck className="size-4" />
                </span>
                <DialogTitle>Booth Admin Console</DialogTitle>
              </div>
            </DialogHeader>

            {/* Admin Tabs */}
            <div className="mb-5 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("agents")}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  tab === "agents"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <AudioLines className="size-3.5" />
                Voice Agents ({agents.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("leads")}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  tab === "leads"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Users className="size-3.5" />
                Leads &amp; Ratings ({feedbackEntries.length})
              </button>
            </div>

            {tab === "agents" ? (
              <>
                <p className="mb-4 text-xs leading-relaxed text-slate-500">
                  Add a new agent using just its Sarvam Agent ID. Your shared
                  Sarvam API key, Org ID, and Workspace ID are applied
                  automatically.
                </p>

                <form onSubmit={(e) => void handleAdd(e)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="admin-agent-name">Agent Name</Label>
                      <Input
                        id="admin-agent-name"
                        placeholder="e.g. Support Agent"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="admin-agent-id">Sarvam Agent ID</Label>
                      <Input
                        id="admin-agent-id"
                        placeholder="e.g. support-bot-1234abcd"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-agent-desc">Description (optional)</Label>
                    <Textarea
                      id="admin-agent-desc"
                      placeholder="Short description shown in the dropdown"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-16"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Label>Color</Label>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                        {AGENT_ACCENTS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            title={item.label}
                            aria-label={item.label}
                            onClick={() => setAccent(item.id)}
                            className={cn(
                              "size-4.5 rounded-full transition-transform",
                              item.dot,
                              accent === item.id
                                ? "scale-115 ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-50"
                                : "opacity-60 hover:opacity-100",
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <Button type="submit" disabled={saving}>
                      <Plus className="size-4" />
                      {saving ? "Adding…" : "Add Agent"}
                    </Button>
                  </div>
                </form>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="mb-2.5 font-mono text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                    Active Agents ({agents.length})
                  </p>
                  <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50">
                    {agents.map((agent) => (
                      <li
                        key={agent.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <AudioLines className="size-4 shrink-0 text-slate-400" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-slate-800">
                                {agent.name}
                              </span>
                              <Badge
                                tone={agent.source === "custom" ? "accent" : "muted"}
                                className="py-0 text-[10px]"
                              >
                                {agent.source === "custom" ? "Added" : "Env"}
                              </Badge>
                              {activeAgentId === agent.id ? (
                                <Badge tone="live" className="py-0 text-[10px]">
                                  Selected
                                </Badge>
                              ) : null}
                            </div>
                            <p className="truncate font-mono text-[11px] text-slate-500">
                              {agent.appId}
                            </p>
                          </div>
                        </div>

                        {agent.source === "custom" ? (
                          <button
                            type="button"
                            title={`Remove ${agent.name}`}
                            aria-label={`Remove ${agent.name}`}
                            onClick={() => void handleDelete(agent)}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Summary Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">
                      Recorded Sessions
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-bold text-slate-900">
                      {feedbackEntries.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">
                      Average Rating
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xl font-bold text-slate-900">
                      <Star className="size-4.5 fill-amber-400 text-amber-400" />
                      {avgRating}
                      {avgRating !== "—" ? (
                        <span className="text-xs font-normal text-slate-400">/ 5</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Leads & Feedback List */}
                {feedbackEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
                    No visitor feedback recorded on this device yet.
                  </p>
                ) : (
                  <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50">
                    {feedbackEntries.map((item) => (
                      <li key={item.id} className="flex flex-col gap-1 px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {item.user?.name || "Visitor"}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {item.rating}/5
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {item.user?.phone} · {item.user?.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-medium text-blue-600">
                            {item.agentName}
                          </span>
                          <span>·</span>
                          <span>{new Date(item.submittedAt).toLocaleString()}</span>
                        </div>
                        {item.comment ? (
                          <p className="mt-1 rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200/80">
                            “{item.comment}”
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={feedbackEntries.length === 0}
                    onClick={() => {
                      downloadFeedbackCsv(feedbackEntries);
                      toast.success("Downloaded visitor leads & ratings CSV.");
                    }}
                  >
                    <Download className="size-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
