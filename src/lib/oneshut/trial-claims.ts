import {
  getExpoIndustries,
  submitExpoClaimTrial,
  type ExpoIndustryOption,
} from "@/lib/expo-feedback/api";
import { loadUserProfile } from "@/lib/session/user-profile";

export type IndustryOption = ExpoIndustryOption;

export type TrialClaim = {
  id: string;
  sessionId?: string | null;
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

export const DEFAULT_INDUSTRY_PLACEHOLDER = "Select your industry";

export const DEFAULT_INDUSTRY_OPTIONS: IndustryOption[] = INDUSTRY_OPTIONS.map(
  (label) => ({ value: label, label }),
);

export async function fetchIndustryOptions(): Promise<{
  placeholder: string;
  industries: IndustryOption[];
}> {
  try {
    const data = await getExpoIndustries();
    const industries = Array.isArray(data.industries)
      ? data.industries
          .map((item) => ({
            value: String(item?.value ?? "").trim(),
            label: String(item?.label ?? item?.value ?? "").trim(),
          }))
          .filter((item) => Boolean(item.value))
      : [];

    if (industries.length > 0) {
      return {
        placeholder: data.placeholder?.trim() || DEFAULT_INDUSTRY_PLACEHOLDER,
        industries,
      };
    }
  } catch {
    /* fall back to built-in options if backend is temporarily unreachable */
  }

  return {
    placeholder: DEFAULT_INDUSTRY_PLACEHOLDER,
    industries: DEFAULT_INDUSTRY_OPTIONS,
  };
}

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
  const sessionId =
    input.sessionId !== undefined
      ? input.sessionId
      : loadUserProfile()?.sessionId;

  const saved = await submitExpoClaimTrial({
    user_name: input.name.trim(),
    email: input.email.trim(),
    phone_number: input.phone.trim(),
    company_name: input.companyName.trim(),
    industry: input.industry.trim(),
    address: input.address.trim(),
    ...(sessionId ? { session_id: sessionId } : {}),
  });

  const parsedCreatedAt = Date.parse(saved.created_at);
  const claim: TrialClaim = {
    id: saved.id || crypto.randomUUID(),
    sessionId: saved.session_id ?? sessionId ?? null,
    name: saved.user_name || input.name.trim(),
    phone: saved.phone_number || input.phone.trim(),
    email: saved.email || input.email.trim(),
    companyName: saved.company_name || input.companyName.trim(),
    industry: saved.industry || input.industry.trim(),
    address: saved.address || input.address.trim(),
    credits: 1000,
    submittedAt: Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now(),
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

  return claim;
}
