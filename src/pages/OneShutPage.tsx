import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  LayoutGrid,
  MessageCircle,
  Mic,
  QrCode,
  Search,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { QrDialog, type QrTarget } from "@/components/oneshut/qr-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  PRODUCTS,
  type ProductCategory,
  type ProductLinkKind,
} from "@/lib/oneshut/products";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

function GooglePlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M3.609 1.814L13.792 12 3.61 22.186a1.75 1.75 0 0 1-.61-1.33V3.144c0-.52.226-.994.609-1.33z"
      />
      <path
        fill="#34A853"
        d="M3.609 1.814c.557-.316 1.174-.226 1.595.144l11.999 6.631L13.792 12 3.609 1.814z"
      />
      <path
        fill="#FBBC05"
        d="M17.203 8.589L13.792 12l3.411 3.411 3.854-2.188c.78-.443.78-1.563 0-2.006l-3.854-2.628z"
      />
      <path
        fill="#EA4335"
        d="M17.203 15.411L13.792 12 3.61 22.186c.42.37 1.037.46 1.594.144l11.999-6.919z"
      />
    </svg>
  );
}

function AppStoreIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.78-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function MicrosoftBadgeIcon({ className }: IconProps) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[3px] bg-white p-[2px]",
        className,
      )}
    >
      <MicrosoftIcon className="size-full" />
    </span>
  );
}

type Filter = "all" | ProductCategory;

const FILTERS: { id: Filter; label: string; icon: ComponentType<IconProps> }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "web", label: CATEGORY_LABELS.web, icon: Globe },
  { id: "marketplace", label: CATEGORY_LABELS.marketplace, icon: MicrosoftIcon },
  { id: "mobile", label: CATEGORY_LABELS.mobile, icon: Smartphone },
];

const LINK_STYLES: Record<
  ProductLinkKind,
  { icon: ComponentType<IconProps>; className: string }
> = {
  web: { icon: Globe, className: "bg-blue-600 text-white hover:bg-blue-700" },
  marketplace: {
    icon: MicrosoftBadgeIcon,
    className: "bg-[#0067b8] text-white hover:bg-[#005a9e]",
  },
  play: {
    icon: GooglePlayIcon,
    className:
      "border border-slate-200 bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-slate-50",
  },
  appstore: {
    icon: AppStoreIcon,
    className:
      "border border-slate-200 bg-white text-slate-900 shadow-xs hover:border-slate-300 hover:bg-slate-50",
  },
};

const VOICE_LANGUAGES = ["English", "हिन्दी", "ગુજરાતી", "मराठी", "+7 more"];

function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
}

export function OneShutPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [qrTarget, setQrTarget] = useState<QrTarget | null>(null);

  useEffect(() => {
    document.title = "JMS Onesuit";
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: PRODUCTS.length, web: 0, marketplace: 0, mobile: 0 };
    for (const p of PRODUCTS) for (const cat of p.categories) c[cat] += 1;
    return c;
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        (filter === "all" || p.categories.includes(filter)) &&
        (!q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)),
    );
  }, [filter, query]);

  const openPageQr = () => {
    const origin = window.location.origin;
    setQrTarget({
      title: "JMS Onesuit",
      subtitle: "Scan to open all JMS products and the live Voice AI demo on your phone.",
      logo: "/jms-favicon.png",
      links: [
        { label: "Onesuit Hub", href: origin, kind: "web" },
        { label: "Live Voice AI", href: `${origin}/voiceai`, kind: "web" },
      ],
    });
  };

  return (
    <div className="expo-grid flex min-h-dvh flex-col text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(11,21,48,0.06)]">
        <div className="expo-stripe h-1 w-full" />
        <div className="border-b border-slate-200 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/jms-logo.png" alt="JMS" className="h-10 w-auto shrink-0 object-contain" />
              <div className="min-w-0 border-l border-slate-200 pl-3">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  Onesuit
                </p>
                <p className="hidden font-mono text-[10px] font-medium tracking-[0.18em] text-blue-600 uppercase sm:block">
                  All JMS products · One place
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openPageQr}
                title="Scan Onesuit QR on your phone"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 sm:text-sm"
              >
                <QrCode className="size-4 text-blue-600" />
                <span className="hidden sm:inline">Scan QR</span>
              </button>
              <Link
                to="/voiceai"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:text-sm"
              >
                <Mic className="size-4" />
                Try Voice AI
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 px-4 py-8 md:px-8">
        {/* Hero */}
        <section className="flex flex-col gap-3">
          {/* <span className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-blue-700 uppercase shadow-[var(--shadow-border)]">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            Tech Expo · JMS TechNova
          </span> */}
          <h1 className="text-3xl leading-[1.1] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Every JMS product, <span className="text-blue-600">one place.</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-600">
            Explore our websites, Microsoft Marketplace solutions and mobile apps. Open directly or
            tap the QR icon on any card to scan onto your phone.
          </p>
        </section>

        {/* Subtle Free Trial Credits Strip */}
        <section className="flex flex-col gap-3 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/50 px-4 py-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-100/80 text-blue-700 ring-1 ring-blue-200/70">
              <Sparkles className="size-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">
                  1,000 Free Trial Credits
                </p>
                <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
                  Free Trial
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Start with 1,000 complimentary credits to try our platforms — no upfront commitment.
              </p>
            </div>
          </div>
          <Link
            to="/claim-credits"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs transition-colors hover:bg-blue-50 sm:self-center"
          >
            Claim Credits
            <ArrowRight className="size-3.5" />
          </Link>
        </section>

        {/* Featured: Voice AI */}
        <Link
          to="/voiceai"
          className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div className="expo-stripe absolute inset-x-0 top-0 h-1" />
          <div className="flex items-start gap-4 sm:items-center">
            <div className="relative grid size-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <div className="flex h-6 items-center gap-1" aria-hidden="true">
                {[0, 140, 280, 140, 0].map((delay, i) => (
                  <span
                    key={i}
                    className="wave-bar w-1 rounded-full bg-white"
                    style={{
                      height: i === 2 ? "100%" : i === 1 || i === 3 ? "75%" : "45%",
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-sky-300 uppercase">
                Live demo at the booth
              </p>
              <p className="mt-0.5 text-lg font-bold sm:text-xl">Talk to our AI Voice Agents</p>
              <p className="text-sm text-slate-300">
                Speak naturally and switch languages mid-conversation — the agent adapts instantly.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {VOICE_LANGUAGES.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-200 ring-1 ring-white/15"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-transform group-hover:translate-x-0.5 sm:self-center">
            Start Voice AI
            <ArrowRight className="size-4" />
          </span>
        </Link>

        {/* Filters + search */}
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  filter === id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 shadow-[var(--shadow-border)] hover:bg-slate-50",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    id === "marketplace" &&
                      filter === id &&
                      "rounded-[2px] bg-white p-[1.5px]",
                  )}
                />
                {label}
                <span
                  className={cn(
                    "rounded-md px-1.5 font-mono text-[11px]",
                    filter === id ? "bg-white/20" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="pl-10"
            />
          </div>
        </section>

        {/* Product grid */}
        {visible.length === 0 ? (
          <p className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[var(--shadow-border)]">
            No products match “{query}”.
          </p>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <Card
                key={p.id}
                className="relative flex flex-col overflow-hidden p-5 pt-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
              >
                {/* Thin brand color accent bar */}
                <span className={cn("absolute inset-x-0 top-0 h-1", p.color)} aria-hidden="true" />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-3.5">
                    {p.logo ? (
                      <div
                        className={cn(
                          "grid h-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs",
                          p.logoWide ? "w-24 px-2 py-1" : "w-12",
                          !p.logoFullBleed && !p.logoWide && "p-1",
                        )}
                      >
                        <img
                          src={p.logo}
                          alt={p.name}
                          className={cn(
                            "size-full",
                            p.logoFullBleed ? "object-cover" : "object-contain",
                          )}
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "grid size-12 shrink-0 place-items-center rounded-xl text-base font-extrabold text-white",
                          p.color,
                        )}
                      >
                        {initials(p.name).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base leading-snug font-bold text-slate-900">{p.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 uppercase"
                          >
                            {CATEGORY_LABELS[c]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick QR scan button */}
                  <button
                    type="button"
                    title={`Scan QR for ${p.name}`}
                    aria-label={`Scan QR for ${p.name}`}
                    onClick={() =>
                      setQrTarget({
                        title: p.name,
                        subtitle: "Scan with your phone camera to visit or download.",
                        logo: p.logo,
                        links: p.links,
                      })
                    }
                    className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <QrCode className="size-4" />
                  </button>
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{p.tagline}</p>

                <div className="mt-4 flex flex-col gap-2">
                  {(() => {
                    const storeLinks = p.links
                      .filter((l) => l.kind === "play" || l.kind === "appstore")
                      .sort((a, b) => (a.kind === "play" ? -1 : b.kind === "play" ? 1 : 0));
                    const otherLinks = p.links.filter(
                      (l) => l.kind !== "play" && l.kind !== "appstore",
                    );

                    return (
                      <>
                        {storeLinks.length > 0 ? (
                          <div
                            className={cn(
                              "grid gap-2",
                              storeLinks.length >= 2 ? "grid-cols-2" : "grid-cols-1",
                            )}
                          >
                            {storeLinks.map((l) => {
                              const { icon: Icon, className } = LINK_STYLES[l.kind];
                              return (
                                <a
                                  key={l.href}
                                  href={l.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm",
                                    className,
                                  )}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  {l.label}
                                  <ExternalLink className="size-3 shrink-0 opacity-70" />
                                </a>
                              );
                            })}
                          </div>
                        ) : null}

                        {otherLinks.map((l) => {
                          const { icon: Icon, className } = LINK_STYLES[l.kind];
                          return (
                            <a
                              key={l.href}
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                                className,
                              )}
                            >
                              <Icon className="size-4 shrink-0" />
                              {l.label}
                              <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                            </a>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </Card>
            ))}
          </section>
        )}

        {/* Contact / Book Demo CTA */}
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="expo-stripe absolute inset-x-0 top-0 h-1" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-blue-600 uppercase">
                Custom AI &amp; Enterprise Solutions
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                Want a custom demo for your business?
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Connect with our team on WhatsApp or try our live Voice AI booth right now.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://whatsapp.naavya.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <MessageCircle className="size-4" />
                Chat on WhatsApp
              </a>
              <Link
                to="/voiceai"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50"
              >
                <Mic className="size-4 text-blue-600" />
                Live Voice AI
              </Link>
            </div>
          </div>
        </Card>
      </main>

      <footer className="px-4 pb-6 text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        © JMS TechNova · Onesuit
      </footer>

      <QrDialog target={qrTarget} onClose={() => setQrTarget(null)} />
    </div>
  );
}
