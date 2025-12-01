"use client";

import { useState, useEffect } from "react";
import { Button } from "@/features/shared/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/features/shared/ui/dialog";
import { Input } from "@/features/shared/ui/input";
import { Label } from "@/features/shared/ui/label";
import { Textarea } from "@/features/shared/ui/textarea";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { requestClarification, getClarifications } from "@/server/actions/contest/clarifications";
import { toast } from "sonner";
import { useContestSocket } from "@/features/contest/hooks/useContestSocket";

interface ClarificationDialogProps {
    userId: string;
    contestId: string;
    problemId?: string;
    problemTitle?: string;
}

export function ClarificationDialog({ userId, contestId, problemId, problemTitle }: ClarificationDialogProps) {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clarifications, setClarifications] = useState<any[]>([]);

    const { isConnected } = useContestSocket({
        onClarificationUpdate: (payload) => {
            // Refresh list or append
            // For simplicity, let's just toast and maybe refresh if we had a refresh function
            toast.info(`Clarification Update: ${payload.question.substring(0, 20)}...`);
            fetchClarifications();
        }
    });

    const fetchClarifications = async () => {
        const result = await getClarifications(userId, contestId);
        if (result.success) {
            setClarifications(result.data);
        }
    };

    useEffect(() => {
        if (open) {
            fetchClarifications();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await requestClarification(userId, contestId, problemId || null, question);
            if (result.success) {
                toast.success("Clarification requested sent to Jury.");
                setQuestion("");
                setOpen(false);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to send request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquarePlus className="h-4 w-4" />
                    Ask Jury
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Clarification</DialogTitle>
                    <DialogDescription>
                        Ask a question about {problemTitle ? `problem "${problemTitle}"` : "the contest"}.
                        The Jury will reply shortly.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Previous Clarifications List */}
                    {clarifications.length > 0 && (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2 bg-slate-50">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase">History</h4>
                            {clarifications.map((c) => (
                                <div key={c.id} className="text-sm border-b last:border-0 pb-2">
                                    <p className="font-medium text-slate-900">Q: {c.question}</p>
                                    {c.answer ? (
                                        <p className="text-emerald-600 mt-1">A: {c.answer}</p>
                                    ) : (
                                        <p className="text-slate-400 italic mt-1">Pending reply...</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <form id="clarification-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question">Your Question</Label>
                            <Textarea
                                id="question"
                                placeholder="e.g., Is the input array always sorted?"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="clarification-form" disabled={isSubmitting || !question.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
