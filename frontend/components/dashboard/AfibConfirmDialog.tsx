"use client";
import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  afibDetected: boolean;
  afibEventId: string | null;
  confidence: number | null;
}

export function AfibConfirmDialog({ afibDetected, afibEventId, confidence }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const shownEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (afibDetected && afibEventId && !shownEventsRef.current.has(afibEventId)) {
      shownEventsRef.current.add(afibEventId);
      setCurrentEventId(afibEventId);
      setOpen(true);
    }
  }, [afibDetected, afibEventId]);

  const handleFeedback = async (confirmed: boolean) => {
    if (!currentEventId || submitting) return;
    setSubmitting(true);
    try {
      await mutate("/afib/feedback", { eventId: currentEventId, confirmed });
      if (confirmed) {
        toast.success("AFib confirmed — training data saved", {
          description: "Both AFib and healthy windows captured for model training.",
        });
      } else {
        toast.info("Marked as false positive", {
          description: "This detection will help improve accuracy.",
        });
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) setOpen(v); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="text-center">
            AFib Detected
          </DialogTitle>
          <DialogDescription className="text-center">
            Our analysis detected atrial fibrillation
            {confidence != null && ` (${Math.round(confidence * 100)}% confidence)`}.
            Did you feel any symptoms — palpitations, fluttering, dizziness, or shortness of breath?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row gap-3 sm:justify-center pt-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => handleFeedback(false)}
          >
            <X className="h-4 w-4" />
            No, I felt fine
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={submitting}
            onClick={() => handleFeedback(true)}
          >
            <Check className="h-4 w-4" />
            Yes, I felt it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
