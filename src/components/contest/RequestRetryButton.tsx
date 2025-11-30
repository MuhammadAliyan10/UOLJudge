"use client";

import { useState } from "react";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestRetry } from "@/server/actions/retry-system";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RequestRetryButtonProps {
    submissionId: string;
    problemTitle: string;
}

export function RequestRetryButton({ submissionId, problemTitle }: RequestRetryButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [requesting, setRequesting] = useState(false);

    const handleSubmit = async () => {
        if (reason.trim().length < 10) {
            toast.error("Please provide a detailed reason (minimum 10 characters)");
            return;
        }

        setRequesting(true);

        try {
            const result = await requestRetry(submissionId, reason);

            if (result.success) {
                toast.success(result.message || "Retry request submitted successfully");
                setOpen(false);
                setReason("");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to submit retry request");
            }
        } catch (error) {
            console.error("Error requesting retry:", error);
            toast.error("An error occurred while submitting retry request");
        } finally {
            setRequesting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                    <Hand size={14} className="mr-2" />
                    Request Another Chance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Hand size={18} className="text-orange-600" />
                        Request Retry
                    </DialogTitle>
                    <DialogDescription>
                        Explain why you need another chance to submit for <strong>{problemTitle}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Retry Request *</Label>
                        <Textarea
                            id="reason"
                            placeholder="E.g., 'I uploaded the wrong file' or 'My code works locally but failed on submission'..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px] resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-slate-500">
                            {reason.length}/500 characters (minimum 10 required)
                        </p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900">
                        <strong>Note:</strong> The jury will review your request. If approved, you'll be able to submit again.
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={requesting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={requesting || reason.trim().length < 10}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {requesting ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
