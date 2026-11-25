import { useState } from "react";
import { AudioLines, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [description, setDescription] = useState("");
  const [accent, setAccent] = useState<AgentAccent>("blue");
  const [saving, setSaving] = useState(false);

  const configuredPin = expectedAdminPin();

  const resetAll = () => {
    setUnlocked(false);
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

      // Best-effort sync with backend server when running Node/Express
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
                Enter the admin passcode to add or manage voice agents.
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
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                  <ShieldCheck className="size-4" />
                </span>
                <DialogTitle>Manage Voice Agents</DialogTitle>
              </div>
              <DialogDescription>
                Add a new agent using just its Sarvam Agent ID. Your shared
                Sarvam API key, Org ID, and Workspace ID are applied
                automatically.
              </DialogDescription>
            </DialogHeader>

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

            {/* Current Agents List */}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
