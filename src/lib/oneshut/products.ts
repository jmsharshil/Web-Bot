export type ProductCategory = "web" | "marketplace" | "mobile";

export type ProductLinkKind = "web" | "play" | "appstore" | "marketplace";

export type ProductLink = {
  label: string;
  href: string;
  kind: ProductLinkKind;
};

export type Product = {
  id: string;
  name: string;
  tagline: string;
  categories: ProductCategory[];
  /** Optional logo image path in public/ */
  logo?: string;
  /** When true, logo fills the tile edge-to-edge (for full-bleed colored icons) */
  logoFullBleed?: boolean;
  /** When true, uses a wider tile for horizontal wordmark logos */
  logoWide?: boolean;
  /** Tailwind background class for the fallback monogram tile */
  color: string;
  links: ProductLink[];
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  web: "Websites & Platforms",
  marketplace: "Microsoft Marketplace",
  mobile: "Mobile Apps",
};

const MS = "https://marketplace.microsoft.com/en-us/product";
const PLAY = "https://play.google.com/store/apps/details?id=";

export const PRODUCTS: Product[] = [
  // ── Websites & Platforms ────────────────────────────────────────────
  {
    id: "naavya",
    name: "Naavya AI",
    tagline: "Multilingual Voice & WhatsApp AI workforce for Indian businesses.",
    categories: ["web"],
    logo: "/products/naavya-icon.png",
    color: "bg-blue-600",
    links: [{ label: "Visit Website", href: "https://naavya.ai/", kind: "web" }],
  },
  {
    id: "naavya-whatsapp",
    name: "Naavya WhatsApp Automation",
    tagline: "Grow faster with official Meta WhatsApp automation.",
    categories: ["web"],
    logo: "/products/whatsapp-naavya-icon.png",
    color: "bg-green-600",
    links: [{ label: "Visit Website", href: "https://whatsapp.naavya.ai/", kind: "web" }],
  },
  {
    id: "sellsharp",
    name: "SellSharp",
    tagline: "Smarter selling tools for growing sales teams.",
    categories: ["web"],
    logo: "/products/sellsharp-icon.png",
    color: "bg-orange-500",
    links: [{ label: "Visit Website", href: "https://sellsharp.co/", kind: "web" }],
  },
  {
    id: "recruitos",
    name: "RECRUIT-OS",
    tagline: "Recruitment operating system for modern hiring teams.",
    categories: ["web"],
    logo: "/products/recruitos.png",
    color: "bg-indigo-600",
    links: [{ label: "Visit Website", href: "https://recruitos.jmstech.co/", kind: "web" }],
  },
  {
    id: "pathdarshak",
    name: "Pathdarshak AI",
    tagline: "AI-powered guidance — available on the web, iOS and Android.",
    categories: ["web", "mobile"],
    logo: "/products/pathdarshak.jpg",
    color: "bg-amber-500",
    links: [
      { label: "Visit Website", href: "https://pathdarshakai.com/", kind: "web" },
      {
        label: "App Store",
        href: "https://apps.apple.com/in/app/pathdarshak-ai/id6753679762",
        kind: "appstore",
      },
      { label: "Google Play", href: `${PLAY}com.pathdarshakai`, kind: "play" },
    ],
  },
  {
    id: "retailtrack",
    name: "RetailTrack",
    tagline: "Track and manage retail operations from one dashboard.",
    categories: ["web"],
    logo: "/products/retailtrack.png",
    color: "bg-rose-600",
    links: [{ label: "Visit Website", href: "https://retailtrack.jmstech.co/", kind: "web" }],
  },

  // ── Microsoft Marketplace ───────────────────────────────────────────
  {
    id: "cpms",
    name: "Customer & Prospect Management",
    tagline: "Manage customers and prospects in one place.",
    categories: ["marketplace"],
    logo: "/products/cpms.png",
    color: "bg-sky-600",
    links: [
      { label: "Microsoft Marketplace", href: `${MS}/WA200009470?tab=Overview`, kind: "marketplace" },
    ],
  },
  {
    id: "vms",
    name: "Visitor Management System",
    tagline: "Register, track and manage visitors at your premises.",
    categories: ["marketplace"],
    logo: "/products/vms.png",
    color: "bg-teal-600",
    links: [{ label: "Microsoft Marketplace", href: `${MS}/WA200009532`, kind: "marketplace" }],
  },
  {
    id: "invoice",
    name: "Invoice Generation & Management",
    tagline: "Create, send and manage invoices with ease.",
    categories: ["marketplace"],
    logo: "/products/invoice.png",
    color: "bg-emerald-600",
    links: [{ label: "Microsoft Marketplace", href: `${MS}/WA200009463`, kind: "marketplace" }],
  },
  {
    id: "doc-sign",
    name: "Digital Document Signing",
    tagline: "Sign and manage documents digitally and securely.",
    categories: ["marketplace"],
    logo: "/products/doc-sign.png",
    color: "bg-violet-600",
    links: [{ label: "Microsoft Marketplace", href: `${MS}/WA200009829`, kind: "marketplace" }],
  },

  // ── Mobile Apps ─────────────────────────────────────────────────────
  {
    id: "attendance",
    name: "Attendance App",
    tagline: "Mark and track attendance right from your phone.",
    categories: ["mobile"],
    logo: "/products/attendance.jpg",
    color: "bg-blue-500",
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/in/app/jms-attendance-app/id6754920620",
        kind: "appstore",
      },
      { label: "Google Play", href: `${PLAY}com.jmsattendanceapp`, kind: "play" },
    ],
  },
  {
    id: "cardscanner",
    name: "CardScanner",
    tagline: "Scan business cards and save contacts instantly.",
    categories: ["mobile"],
    logo: "/products/cardscanner.jpg",
    color: "bg-cyan-600",
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/in/app/jms-cardscanner/id6762037044",
        kind: "appstore",
      },
      { label: "Google Play", href: `${PLAY}com.jmscardscanner`, kind: "play" },
    ],
  },
  {
    id: "societyhub",
    name: "Society Hub",
    tagline: "Manage your residential society in one app.",
    categories: ["mobile"],
    logo: "/products/societyhub.png",
    logoFullBleed: true,
    color: "bg-lime-600",
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/in/app/societyhub/id6757597827",
        kind: "appstore",
      },
      { label: "Google Play", href: `${PLAY}com.jmssocietyhub`, kind: "play" },
    ],
  },
  {
    id: "mydoorbell",
    name: "MyDoorbell",
    tagline: "Know who is at your door — right on your phone.",
    categories: ["mobile"],
    logo: "/products/mydoorbell.jpg",
    color: "bg-fuchsia-600",
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/in/app/jmsdoorbell/id6758932731",
        kind: "appstore",
      },
      { label: "Google Play", href: `${PLAY}com.mydoorbell`, kind: "play" },
    ],
  },
  {
    id: "vaishnavgpt",
    name: "VaishnavGPT",
    tagline: "An AI assistant app for everyday questions.",
    categories: ["mobile"],
    logo: "/products/vaishnavgpt.png",
    color: "bg-yellow-500",
    links: [{ label: "Google Play", href: `${PLAY}com.vaishnavgpt`, kind: "play" }],
  },
];
