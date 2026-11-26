export type TrialClaim = {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  industry: string;
  address: string;
  credits: number;
  submittedAt: number;
};

const TRIAL_CLAIMS_KEY = "onesuit-trial-claims";

export const INDUSTRY_OPTIONS = [
  "IT & Software",
  "Retail & E-Commerce",
  "Automotive",
  "Real Estate & Housing",
  "Healthcare",
  "Finance & Insurance",
  "Manufacturing",
  "Education",
  "Hospitality & Travel",
  "Logistics & Supply Chain",
  "Professional Services",
  "Other",
] as const;

export function loadTrialClaims(): TrialClaim[] {
  try {
    const raw = localStorage.getItem(TRIAL_CLAIMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrialClaim[]) : [];
  } catch {
    return [];
  }
}

export async function submitTrialClaim(
  input: Omit<TrialClaim, "id" | "credits" | "submittedAt">,
): Promise<TrialClaim> {
  const claim: TrialClaim = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    companyName: input.companyName.trim(),
    industry: input.industry.trim(),
    address: input.address.trim(),
    credits: 1000,
    submittedAt: Date.now(),
  };

  try {
    const prev = loadTrialClaims();
    localStorage.setItem(
      TRIAL_CLAIMS_KEY,
      JSON.stringify([claim, ...prev].slice(0, 200)),
    );
  } catch {
    /* ignore storage quota errors */
  }

  try {
    await fetch("/api/trial-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claim),
    });
  } catch {
    /* best-effort backend delivery on static hosting */
  }

  return claim;
}
