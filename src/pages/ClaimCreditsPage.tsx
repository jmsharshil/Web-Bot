import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import {
  DEFAULT_INDUSTRY_OPTIONS,
  DEFAULT_INDUSTRY_PLACEHOLDER,
  fetchIndustryOptions,
  submitTrialClaim,
  type IndustryOption,
  type TrialClaim,
} from "@/lib/oneshut/trial-claims";

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  industry?: string;
  address?: string;
};

function validate(fields: {
  name: string;
  phone: string;
  email: string;
  companyName: string;
  industry: string;
  address: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (fields.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }
  const digits = fields.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    errors.phone = "Please enter a valid phone number (7–15 digits).";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (fields.companyName.trim().length < 2) {
    errors.companyName = "Please enter your company name.";
  }
  if (fields.industry.trim().length < 2) {
    errors.industry = "Please select or enter your industry.";
  }
  if (fields.address.trim().length < 5) {
    errors.address = "Please enter your address.";
  }
  return errors;
}

export function ClaimCreditsPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryOptions, setIndustryOptions] = useState<IndustryOption[]>(
    DEFAULT_INDUSTRY_OPTIONS,
  );
  const [industryPlaceholder, setIndustryPlaceholder] = useState(
    DEFAULT_INDUSTRY_PLACEHOLDER,
  );
  const [industryChoice, setIndustryChoice] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<TrialClaim | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    document.title = "Claim 1,000 Free Credits · JMS Onesuit";
  }, []);

  useEffect(() => {
    let active = true;
    void fetchIndustryOptions().then(({ placeholder, industries }) => {
      if (!active) return;
      setIndustryPlaceholder(placeholder);
      setIndustryOptions(industries);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!submittedClaim) return;
    const tick = window.setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    const redirect = window.setTimeout(() => {
      navigate("/ask-ai", { replace: true });
    }, 3000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [navigate, submittedClaim]);

  const effectiveIndustry =
    industryChoice === "Other" ? customIndustry : industryChoice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validate({
      name,
      phone,
      email,
      companyName,
      industry: effectiveIndustry,
      address,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const claim = await submitTrialClaim({
        name,
        phone,
        email,
        companyName,
        industry: effectiveIndustry,
        address,
      });
      setSubmittedClaim(claim);
      toast.success("Your free trial credits have been added!");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not submit your trial claim. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expo-grid flex min-h-dvh flex-col text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(11,21,48,0.06)]">
        <div className="expo-stripe h-1 w-full" />
        <div className="border-b border-slate-200 px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/jms-logo.png"
                alt="JMS"
                className="h-10 w-auto shrink-0 object-contain"
              />
              <div className="border-l border-slate-200 pl-3">
                <p className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                  Onesuit
                </p>
                <p className="hidden font-mono text-[10px] font-medium tracking-[0.18em] text-blue-600 uppercase sm:block">
                  Free Trial Credits
                </p>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 sm:text-sm"
            >
              <ArrowLeft className="size-4" />
              Back to Onesuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10 md:px-8">
        {submittedClaim ? (
          <Card className="relative overflow-hidden p-8 text-center sm:p-10">
            <div className="expo-stripe absolute inset-x-0 top-0 h-1.5" />
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <CheckCircle2 className="size-9" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
              <Sparkles className="size-3.5 text-amber-500" />
              1,000 Free Trial Credits Added
            </span>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Thank you, {submittedClaim.name.split(" ")[0]}!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
              Your trial for{" "}
              <strong className="font-semibold text-slate-900">
                {submittedClaim.companyName}
              </strong>{" "}
              is ready.{" "}
              <strong className="font-semibold text-blue-700">
                {submittedClaim.credits.toLocaleString()} credits
              </strong>{" "}
              have been added to your account. Opening Ask AI for you…
            </p>

            <p className="mt-6 font-mono text-xs text-slate-400">
              Opening Ask AI in {countdown}s…
            </p>

            <div className="mt-4">
              <Button asChild size="lg">
                <Link to="/ask-ai">
                  Open Ask AI Now
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div className="expo-stripe absolute inset-x-0 top-0 h-1" />

            <div className="mb-6 flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-blue-600 uppercase">
                  Free Trial Offer
                </p>
                <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">
                  Claim 1,000 Free Trial Credits
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in your details below and we&apos;ll set up your complimentary trial credits.
                </p>
              </div>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="claim-name">Full Name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="claim-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={name}
                      disabled={submitting}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  {errors.name ? (
                    <p className="text-xs font-medium text-red-600">{errors.name}</p>
                  ) : null}
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="claim-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="claim-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      disabled={submitting}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs font-medium text-red-600">{errors.phone}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="claim-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="claim-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      disabled={submitting}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs font-medium text-red-600">{errors.email}</p>
                  ) : null}
                </div>

                {/* Company Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="claim-company">Company Name</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="claim-company"
                      type="text"
                      autoComplete="organization"
                      placeholder="Your company name"
                      value={companyName}
                      disabled={submitting}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (errors.companyName)
                          setErrors((p) => ({ ...p, companyName: undefined }));
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                  {errors.companyName ? (
                    <p className="text-xs font-medium text-red-600">{errors.companyName}</p>
                  ) : null}
                </div>
              </div>

              {/* Industry */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="claim-industry">Industry</Label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                  <NativeSelect
                    id="claim-industry"
                    value={industryChoice}
                    disabled={submitting}
                    onChange={(e) => {
                      setIndustryChoice(e.target.value);
                      if (errors.industry) setErrors((p) => ({ ...p, industry: undefined }));
                      if (submitError) setSubmitError("");
                    }}
                    className="pl-10"
                  >
                    <option value="">{industryPlaceholder}</option>
                    {industryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                {industryChoice === "Other" ? (
                  <Input
                    type="text"
                    placeholder="Enter your industry"
                    value={customIndustry}
                    disabled={submitting}
                    onChange={(e) => {
                      setCustomIndustry(e.target.value);
                      if (errors.industry) setErrors((p) => ({ ...p, industry: undefined }));
                      if (submitError) setSubmitError("");
                    }}
                    className="mt-1.5"
                  />
                ) : null}
                {errors.industry ? (
                  <p className="text-xs font-medium text-red-600">{errors.industry}</p>
                ) : null}
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="claim-address">Address</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-slate-400" />
                  <Textarea
                    id="claim-address"
                    placeholder="Office / business address, city, state"
                    value={address}
                    disabled={submitting}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (errors.address) setErrors((p) => ({ ...p, address: undefined }));
                      if (submitError) setSubmitError("");
                    }}
                    className="min-h-22 pl-10"
                  />
                </div>
                {errors.address ? (
                  <p className="text-xs font-medium text-red-600">{errors.address}</p>
                ) : null}
              </div>

              {submitError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
                <Button asChild type="button" variant="ghost">
                  <Link to="/">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" disabled={submitting} className="min-w-48">
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Claim 1,000 Credits
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>

      <footer className="px-4 pb-6 text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        © JMS TechNova · Onesuit
      </footer>
    </div>
  );
}
