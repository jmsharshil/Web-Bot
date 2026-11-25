import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductLink } from "@/lib/oneshut/products";
import { cn } from "@/lib/utils";

export type QrTarget = {
  title: string;
  subtitle?: string;
  logo?: string;
  links: ProductLink[];
};

type QrDialogProps = {
  target: QrTarget | null;
  onClose: () => void;
};

export function QrDialog({ target, onClose }: QrDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedIndex(0);
    setCopied(false);
  }, [target]);

  const activeLink = target?.links[selectedIndex] ?? target?.links[0];

  const handleCopy = async () => {
    if (!activeLink) return;
    try {
      await navigator.clipboard.writeText(activeLink.href);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        {target && activeLink ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-2 inline-flex size-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs">
                {target.logo ? (
                  <img
                    src={target.logo}
                    alt={target.title}
                    className="size-full object-contain"
                  />
                ) : (
                  <QrCode className="size-5 text-blue-600" />
                )}
              </div>
              <DialogTitle className="text-center">{target.title}</DialogTitle>
              <DialogDescription className="text-center">
                {target.subtitle || "Scan with your phone camera to open directly."}
              </DialogDescription>
            </DialogHeader>

            {target.links.length > 1 ? (
              <div className="mb-4 flex flex-wrap justify-center gap-1.5">
                {target.links.map((link, idx) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(idx);
                      setCopied(false);
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      selectedIndex === idx
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="rounded-xl bg-white p-3 shadow-xs ring-1 ring-slate-200/80">
                <QRCodeSVG
                  value={activeLink.href}
                  size={196}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0b1530"
                />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-700">
                {activeLink.label}
              </p>
              <p className="mt-0.5 max-w-full truncate font-mono text-[10px] text-slate-400">
                {activeLink.href}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button asChild>
                <a href={activeLink.href} target="_blank" rel="noopener noreferrer">
                  Open
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
