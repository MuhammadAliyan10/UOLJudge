"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    updateJuryAssignmentsAction,
    getAllContestsForAssignment,
} from "@/server/actions/jury-management";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Shield, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
    contestIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface EditJuryAssignmentsDialogProps {
    jury: {
        id: string;
        username: string;
        assignedContests: Array<{
            id: string;
            name: string;
        }>;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditJuryAssignmentsDialog({
    jury,
    open,
    onOpenChange,
}: EditJuryAssignmentsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [contests, setContests] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        async function fetchContests() {
            try {
                const data = await getAllContestsForAssignment();
                setContests(data);
            } catch (error) {
                console.error("Failed to fetch contests:", error);
            }
        }
        if (open) fetchContests();
    }, [open]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            contestIds: jury.assignedContests.map((c) => c.id),
        },
    });

    // Reset form when jury changes
    useEffect(() => {
        form.reset({
            contestIds: jury.assignedContests.map((c) => c.id),
        });
    }, [jury, form]);

    const onSubmit = async (values: FormValues) => {
        setLoading(true);

        const res = await updateJuryAssignmentsAction(jury.id, values.contestIds);

        if (res.success) {
            toast.success(res.message || "Assignments updated successfully");
            onOpenChange(false);
            window.location.reload(); // Refresh to show updated assignments
        } else {
            toast.error(res.error || "Failed to update assignments");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] bg-white p-0 gap-0 overflow-hidden rounded-lg">
                <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">

                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Edit Assignments for {jury.username}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm mt-1">
                        Add or remove contest access for this jury member. Changes take effect immediately.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
                        <div className="px-6 py-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    Contest Assignments
                                </h4>
                                <FormField
                                    control={form.control}
                                    name="contestIds"
                                    render={() => (
                                        <FormItem>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                                <ScrollArea className="h-[100px] overflow-y-auto pr-4">
                                                    {contests.length === 0 ? (
                                                        <p className="text-sm text-slate-400 text-center py-8">
                                                            No active contests available
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {contests.map((contest) => (
                                                                <FormField
                                                                    key={contest.id}
                                                                    control={form.control}
                                                                    name="contestIds"
                                                                    render={({ field }) => {
                                                                        return (
                                                                            <FormItem
                                                                                key={contest.id}
                                                                                className="flex flex-row items-center space-x-3 space-y-0 p-3 bg-white border border-slate-200 rounded-md hover:border-purple-300 transition-colors"
                                                                            >
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={field.value?.includes(contest.id)}
                                                                                        onCheckedChange={(checked) => {
                                                                                            return checked
                                                                                                ? field.onChange([...field.value, contest.id])
                                                                                                : field.onChange(
                                                                                                    field.value?.filter(
                                                                                                        (value) => value !== contest.id
                                                                                                    )
                                                                                                );
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="text-sm font-medium text-slate-900 cursor-pointer !mt-0">
                                                                                    {contest.name}
                                                                                </FormLabel>
                                                                            </FormItem>
                                                                        );
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/80 text-white font-bold h-10 px-6 shadow-sm"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
