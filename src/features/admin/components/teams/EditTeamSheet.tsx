"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateTeamAction, deleteTeamAction, getAllContestsForTeamAssignment } from "@/server/actions/admin/admin";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/features/shared/ui/sheet";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/shared/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/features/shared/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle, Save, KeyRound, Monitor } from "lucide-react";
import { ScrollArea } from "@/features/shared/ui/scroll-area";

// --- Schema Definition ---
const formSchema = z
    .object({
        id: z.string(),
        displayName: z.string().min(3, "Team name must be at least 3 characters"),
        username: z.string().min(3, "Username must be at least 3 characters"),
        labLocation: z.string().optional().nullable(),
        contestId: z.string().min(1, "Contest assignment is required"),
        isActive: z.string(),
        maxDevices: z.number().min(1).max(3).default(1),
        password: z.string().optional().or(z.literal("")),
    })
    .refine(
        (data) => {
            // Conditional validation: Password must be min 6 if provided
            return !(
                data.password &&
                data.password.length > 0 &&
                data.password.length < 6
            );
        },
        {
            message: "Password must be at least 6 characters if changed.",
            path: ["password"],
        }
    );

type FormValues = z.infer<typeof formSchema>;

interface EditTeamSheetProps {
    team: {
        id: string;
        username: string;
        is_active: boolean;
        team_profile: {
            display_name: string;
            members: any;
            lab_location: string | null;
            max_devices: number;
            assigned_contest_id: string | null;
        } | null;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTeamSheet({
    team,
    open,
    onOpenChange,
}: EditTeamSheetProps) {
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [contests, setContests] = useState<Array<{ id: string; name: string }>>([]);
    const [contestsLoading, setContestsLoading] = useState(true);

    // Fetch available contests using Server Action
    useEffect(() => {
        async function fetchContests() {
            setContestsLoading(true);
            try {
                const data = await getAllContestsForTeamAssignment();
                setContests(data);
            } catch (error) {
                console.error("Failed to fetch contests:", error);
                setContests([]);
            } finally {
                setContestsLoading(false);
            }
        }
        if (open) fetchContests();
    }, [open]);

    // Initialize RHF Form with existing data
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as Resolver<FormValues>,
        defaultValues: {
            id: team.id,
            displayName: team.team_profile?.display_name || "",
            username: team.username,
            labLocation: team.team_profile?.lab_location || "",
            contestId: team.team_profile?.assigned_contest_id || "",
            isActive: team.is_active ? "true" : "false",
            maxDevices: team.team_profile?.max_devices || 1,
            password: "",
        },
        mode: "onBlur",
    });

    // Reset form when team changes
    useEffect(() => {
        if (open && team) {
            form.reset({
                id: team.id,
                displayName: team.team_profile?.display_name || "",
                username: team.username,
                labLocation: team.team_profile?.lab_location || "",
                contestId: team.team_profile?.assigned_contest_id || "",
                isActive: team.is_active ? "true" : "false",
                maxDevices: team.team_profile?.max_devices || 1,
                password: "",
            });
        }
    }, [team, open, form]);

    // --- Handlers ---

    const handleUpdate = async (values: FormValues) => {
        setLoading(true);

        const formData = new FormData();
        formData.append("id", values.id);
        formData.append("displayName", values.displayName);
        formData.append("members", JSON.stringify([]));
        formData.append("username", values.username);
        formData.append("labLocation", values.labLocation || "");
        formData.append("contestId", values.contestId);
        formData.append("isActive", values.isActive);
        formData.append("maxDevices", values.maxDevices.toString());

        if (values.password && values.password.length > 0) {
            formData.append("password", values.password);
        }

        const res = await updateTeamAction(formData);

        if (res.success) {
            toast.success("Team updated successfully");
            onOpenChange(false);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await deleteTeamAction(team.id);
        if (res.success) {
            toast.success("Team deleted");
            onOpenChange(false);
        } else {
            toast.error(res.error);
        }
        setIsDeleting(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 gap-0">
                <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">Edit Team: {team.username}</SheetTitle>
                    <SheetDescription className="text-slate-500 text-sm mt-1">
                        Update team assignments or manage access.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-full pr-0">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleUpdate)}
                            className="flex flex-col flex-1 pb-20"
                        >
                            <input type="hidden" name="id" value={team.id} />

                            <div className="px-6 py-6 space-y-6">

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <Monitor size={14} className="text-slate-400" />
                                        Team Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Team Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Code Warriors" {...field} className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="labLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lab Location</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Lab 1" {...field} value={field.value ?? ""} className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Max Devices Input */}
                                    <FormField
                                        control={form.control}
                                        name="maxDevices"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Max Device Slots</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={3}
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    🔒 Maximum devices allowed for this team (1-3).
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Assignment & Status */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contestId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned Contest</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {contestsLoading ? (
                                                            <SelectItem value="_loading" disabled>
                                                                Loading contests...
                                                            </SelectItem>
                                                        ) : contests.length === 0 ? (
                                                            <SelectItem value="_no_contests" disabled>
                                                                No contests available - Create one first
                                                            </SelectItem>
                                                        ) : (
                                                            contests.map((contest) => (
                                                                <SelectItem key={contest.id} value={contest.id}>
                                                                    {contest.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="true">
                                                            <span className="flex items-center gap-2">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="false">
                                                            <span className="flex items-center gap-2">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Banned
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Password Reset */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                    <KeyRound size={12} />
                                                    Reset Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter new password to change..."
                                                        type="text"
                                                        className="h-9 bg-white border-slate-200 font-mono text-sm focus:border-slate-300 placeholder:text-slate-400"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Danger Zone */}
                                <div className="mt-2 p-3 rounded bg-red-50 border border-red-100 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-xs font-bold text-red-900 block">Delete Team</span>
                                        <span className="text-[10px] text-red-700/80 block">Permanently remove data.</span>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                            >
                                                <Trash2 size={12} className="mr-1.5" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white border-slate-200">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                                    <AlertTriangle size={20} /> Confirm Deletion
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-600">
                                                    Are you absolutely sure you want to delete <span className="font-bold text-slate-900">@{team.username}</span>?
                                                    This action cannot be undone and will permanently remove all associated submissions and data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="animate-spin mr-2" size={16} />
                                                    ) : (
                                                        "Yes, Delete Team"
                                                    )}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="h-9 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900 font-bold tracking-tight"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : (
                                        <>
                                            <Save size={14} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
