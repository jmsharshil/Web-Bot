import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { useInterviewStore } from "@/lib/interviews/store";

export function ConnectSarvam({ children }: { children: ReactNode }) {
  const sarvam = useInterviewStore((s) => s.sarvam);
  const setSarvam = useInterviewStore((s) => s.setSarvam);
  const clearSarvam = useInterviewStore((s) => s.clearSarvam);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(sarvam);

  const onOpen = (next: boolean) => {
    if (next) {
      const s = useInterviewStore.getState().sarvam;
      setForm({
        apiKey: s.apiKey ?? "",
        orgId: s.orgId ?? "",
        workspaceId: s.workspaceId ?? "",
        appId: s.appId ?? "",
      });
    }
    setOpen(next);
  };

  const save = () => {
    if (!form.apiKey.trim() || !form.orgId.trim() || !form.workspaceId.trim()) {
      toast.error("API key, Organization ID, and Workspace ID are required.");
      return;
    }
    setSarvam({
      apiKey: form.apiKey.trim(),
      orgId: form.orgId.trim(),
      workspaceId: form.workspaceId.trim(),
      appId: form.appId.trim(),
    });
    setOpen(false);
    toast.success("Sarvam workspace credentials saved on this browser.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sarvam Workspace Credentials</DialogTitle>
          <DialogDescription>
            Shared credentials from <strong>Deploy with Code</strong> used by all
            configured voice agents. Make sure each agent is a committed{" "}
            <strong>Voice</strong> agent.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {(
            [
              ["API Key", "apiKey", "password"],
              ["Organization ID", "orgId", "text"],
              ["Workspace ID", "workspaceId", "text"],
              ["Default Agent ID (optional)", "appId", "text"],
            ] as const
          ).map(([label, key, type]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type}
                autoComplete="off"
                className="font-mono text-xs"
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <p className="text-xs leading-relaxed text-slate-500">
            Values set in <code className="font-mono text-[11px] text-slate-800">.env</code>{" "}
            load automatically on startup. Saving here overrides them on this
            browser only.
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {sarvam.apiKey ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  clearSarvam();
                  setForm({ apiKey: "", orgId: "", workspaceId: "", appId: "" });
                  toast.message("Cleared browser-saved credentials.");
                }}
              >
                Clear saved
              </Button>
            ) : null}
            <Button type="button" onClick={save}>
              Save credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
