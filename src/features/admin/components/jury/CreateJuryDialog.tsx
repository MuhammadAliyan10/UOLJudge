"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    createJuryMemberAction,
    getAllContestsForAssignment,
} from "@/server/actions/jury/jury-management";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/features/shared/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/shared/ui/form";
import { Button } from "@/features/shared/ui/button";
import { Input } from "@/features/shared/ui/input";
import { Checkbox } from "@/features/shared/ui/checkbox";
import { toast } from "sonner";
import { Plus, Loader2, Shield, KeyRound, User, Calendar } from "lucide-react";
import { ScrollArea } from "@/features/shared/ui/scroll-area";

const formSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contestIds: z.array(z.string()).min(1, "Select at least one contest"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateJuryDialog() {
    const [open, setOpen] = useState(false);
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
            username: "",
            password: "",
            contestIds: [],
        },
    });

    const onSubmit = async (values: FormValues) => {
        setLoading(true);

        const formData = new FormData();
        formData.append("username", values.username);
        formData.append("password", values.password);
        formData.append("contestIds", JSON.stringify(values.contestIds));

        const res = await createJuryMemberAction(formData);

        if (res.success) {
            toast.success(res.message || "Jury member created successfully");
            form.reset();
            setOpen(false);
            window.location.reload(); // Refresh to show new jury member
        } else {
            toast.error(res.error || "Failed to create jury member");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/80 shadow-sm font-medium">
                    <Plus size={16} className="mr-2" /> New Jury Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-white p-0 gap-0 overflow-hidden rounded-lg">
                <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">

                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Create Jury Member
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm mt-1">
                        Create a new jury account with contest assignments. Zero-trust access control applied.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
                        <div className="px-6 py-6 space-y-6">
                            {/* Credentials Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                    <KeyRound size={14} className="text-slate-400" />
                                    Access Credentials
                                </h4>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Username
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User
                                                            size={14}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <Input
                                                            placeholder="jury_01"
                                                            autoComplete="off"
                                                            className="pl-9 h-9 bg-white border-slate-200 font-mono text-sm"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <KeyRound
                                                            size={14}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <Input
                                                            placeholder="••••••"
                                                            type="text"
                                                            className="pl-9 h-9 bg-white border-slate-200 font-mono text-sm"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Contest Assignment Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    Assign Contests
                                </h4>
                                <FormField
                                    control={form.control}
                                    name="contestIds"
                                    render={() => (
                                        <FormItem>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                                                <ScrollArea className="h-[100px] pr-4 overflow-y-auto">
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
                                                                                className="flex flex-row items-center space-x-3 space-y-0 p-3 bg-white border border-slate-200 rounded-md hover:border-primary-300 transition-colors"
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

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button
                                type="submit"
                                className="bg-primary cursor-pointer hover:bg-primary-700 text-white font-bold h-10 px-6 shadow-sm"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                Create Jury Member
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
