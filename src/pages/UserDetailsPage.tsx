import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { startExpoSession } from "@/lib/expo-feedback/api";
import { saveUserProfile } from "@/lib/session/user-profile";

type FormErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

function validate(name: string, phone: string, email: string): FormErrors {
  const errors: FormErrors = {};
  if (name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    errors.phone = "Please enter a valid phone number.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  return errors;
}

const STEPS = [
  { n: "01", title: "Register", copy: "Share your name, phone & email.", color: "bg-[#3fa3e0]" },
  { n: "02", title: "Pick an agent", copy: "Choose an AI voice agent.", color: "bg-[#f8c300]" },
  { n: "03", title: "Start talking", copy: "Speak naturally — it talks back.", color: "bg-[#e5372a]" },
];

export function UserDetailsPage({
  nextPath = "/studio",
  backPath,
}: {
  nextPath?: string;
  backPath?: string;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validate(name, phone, email);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const session = await startExpoSession({
        user_name: name.trim(),
        email_id: email.trim(),
        phone_number: phone.trim(),
      });

      const parsedStartedAt = Date.parse(session.started_at);
      saveUserProfile({
        sessionId: session.session_id,
        name: session.user_name || name.trim(),
        phone: session.phone_number || phone.trim(),
        email: session.email_id || email.trim(),
        startedAt: Number.isFinite(parsedStartedAt) ? parsedStartedAt : Date.now(),
      });
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not start your session. Please try again.";
      setSubmitError(message);
      toast.error(message);
      setSubmitting(false);
    }
  };

  const field = (
    id: string,
    label: string,
    icon: React.ReactNode,
    props: React.ComponentProps<typeof Input>,
    error?: string,
  ) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <Input id={id} className="h-12 pl-10 text-base" {...props} />
      </div>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );

  return (
    <div className="expo-grid flex min-h-dvh flex-col text-foreground">
      <div className="expo-stripe h-1.5 w-full" />

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: Expo hero */}
        <section className="flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <img src="/jms-logo.png" alt="JMS" className="h-16 w-auto object-contain" />
            {backPath ? (
              <Link
                to={backPath}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-[var(--shadow-border)] hover:bg-slate-50"
              >
                <ArrowLeft className="size-4" />
                All products
              </Link>
            ) : null}
          </div>

          {/* <span className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-blue-700 uppercase shadow-[var(--shadow-border)]">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            Tech Expo · Live Demo
          </span> */}

          <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Talk to our{" "}
            <span className="text-blue-600">AI Voice Agents</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            Experience real-time conversations with AI. Register in seconds, pick an
            agent, and just start speaking.
          </p>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-xl bg-white p-4 shadow-[var(--shadow-border)]">
                <span className={`block h-1 w-8 rounded-full ${s.color}`} />
                <p className="mt-3 font-mono text-xs font-semibold text-slate-400">{s.n}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Right: Registration form */}
        <Card className="p-6 sm:p-8">
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            Step 01 · Register
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Enter your details
          </h2>

          <form onSubmit={(e) => void onSubmit(e)} noValidate className="mt-6 flex flex-col gap-5">
            {field(
              "user-name",
              "Full Name",
              <User className="size-4" />,
              {
                type: "text",
                autoComplete: "name",
                placeholder: "Your full name",
                value: name,
                disabled: submitting,
                autoFocus: true,
                onChange: (e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  if (submitError) setSubmitError("");
                },
              },
              errors.name,
            )}
            {field(
              "user-phone",
              "Phone Number",
              <Phone className="size-4" />,
              {
                type: "tel",
                autoComplete: "tel",
                placeholder: "+91 98765 43210",
                value: phone,
                disabled: submitting,
                onChange: (e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                  if (submitError) setSubmitError("");
                },
              },
              errors.phone,
            )}
            {field(
              "user-email",
              "Email Address",
              <Mail className="size-4" />,
              {
                type: "email",
                autoComplete: "email",
                placeholder: "you@example.com",
                value: email,
                disabled: submitting,
                onChange: (e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  if (submitError) setSubmitError("");
                },
              },
              errors.email,
            )}

            {submitError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="mt-1 h-13 w-full text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Starting Session…
                </>
              ) : (
                <>
                  Start the Experience
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Tip: use headphones and allow microphone access when asked.
          </p>
        </Card>
      </main>

      <footer className="px-4 pb-6 text-center font-mono text-[11px] tracking-wider text-slate-400 uppercase">
        Powered by JMS · AI Voice Technology
      </footer>
    </div>
  );
}
