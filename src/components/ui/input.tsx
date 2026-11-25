import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/15 disabled:bg-slate-50 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-22 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/15",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-xs font-semibold tracking-wide text-slate-700", className)}
      {...props}
    />
  );
}

export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 pr-9 text-sm text-slate-900 shadow-xs focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-500/15",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
