import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import {
  clearUserProfile,
  submitSessionFeedback,
  type UserProfile,
} from "@/lib/session/user-profile";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

type FeedbackDialogProps = {
  open: boolean;
  user: UserProfile;
  agentId: string;
  agentName: string;
  turnsCount: number;
  durationSec: number;
};

export function FeedbackDialog({
  open,
  user,
  agentId,
  agentName,
  turnsCount,
  durationSec,
}: FeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeStars = hovered || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a star rating from 1 to 5.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSessionFeedback({
        user,
        agentId,
        agentName,
        rating,
        comment: comment.trim(),
        turnsCount,
        durationSec,
      });
      setSubmitted(true);
      clearUserProfile();
      toast.success("Thank you for your feedback! Starting a new session…");

      window.setTimeout(() => {
        window.location.replace("/");
      }, 650);
    } catch {
      setSubmitting(false);
      toast.error("Could not submit feedback. Please try again.");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-md"
      >
        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Thank you, {user.name}!
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Your {rating}/5 rating has been recorded. Refreshing for a new
              session…
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="pr-0 text-center">
              <p className="text-center font-mono text-[11px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
                Step 03 · Feedback
              </p>
              <DialogTitle className="text-center">
                Rate Your Experience
              </DialogTitle>
              <DialogDescription className="text-center">
                How was your conversation with{" "}
                <strong className="font-semibold text-slate-800">
                  {agentName}
                </strong>
                ?
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
              {/* 5-Star Rating Control */}
              <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-5">
                <div
                  className="flex items-center justify-center gap-2"
                  role="radiogroup"
                  aria-label="Conversation rating out of 5 stars"
                  onMouseLeave={() => setHovered(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= activeStars;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} out of 5 stars`}
                        onMouseEnter={() => setHovered(star)}
                        onClick={() => setRating(star)}
                        className="rounded-xl p-1.5 transition-transform duration-150 hover:scale-115 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      >
                        <Star
                          className={cn(
                            "size-9 transition-colors duration-150",
                            filled
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "fill-transparent text-slate-300 hover:text-amber-300",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="min-h-5 text-sm font-semibold text-slate-700">
                  {activeStars > 0
                    ? `${activeStars} / 5 — ${RATING_LABELS[activeStars]}`
                    : "Tap a star to rate (out of 5)"}
                </p>
              </div>

              {/* Optional comment */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="feedback-comment">
                  Additional Feedback (optional)
                </Label>
                <Textarea
                  id="feedback-comment"
                  placeholder="Tell us what went well or what could be improved..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || rating < 1}
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
