"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateTeamAction, deleteTeamAction } from "@/server/actions/admin";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle, Save, KeyRound } from "lucide-react";

// --- Schema Definition ---
const formSchema = z
  .object({
    id: z.string(),
    displayName: z.string().min(3, "Team name must be at least 3 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    labLocation: z.string().optional().nullable(),
    contestId: z.string().min(1, "Contest assignment is required"),
    isActive: z.string(),
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

interface EditTeamDialogProps {
  team: {
    id: string;
    username: string;
    is_active: boolean;
    team_profile: {
      display_name: string;
      lab_location: string | null;
      assigned_contest_id: string | null;
    } | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({
  team,
  open,
  onOpenChange,
}: EditTeamDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contests, setContests] = useState<Array<{ id: string; name: string; startTime: Date }>>([]);

  // Fetch available contests
  useEffect(() => {
    async function fetchContests() {
      try {
        const res = await fetch("/api/contests");
        const data = await res.json();
        setContests(data);
      } catch (error) {
        console.error("Failed to fetch contests:", error);
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
      password: "",
    },
    mode: "onBlur",
  });

  // --- Handlers ---

  const handleUpdate = async (values: FormValues) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("id", values.id);
    formData.append("displayName", values.displayName);
    formData.append("username", values.username);
    formData.append("labLocation", values.labLocation || "");
    formData.append("contestId", values.contestId);
    formData.append("isActive", values.isActive);

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
      onOpenChange(false); // Close Edit Dialog
    } else {
      toast.error(res.error);
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-0 bg-white border-slate-200 shadow-xl overflow-hidden rounded-lg ring-1 ring-slate-950/5">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">

          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Edit Team: {team.username}</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Update team assignments or manage access.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdate)}
            className="flex flex-col"
          >
            <input type="hidden" name="id" value={team.id} />

            <div className="px-6 py-6 space-y-6">

              {/* Basic Info */}
              <div className="space-y-4">
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
                          {contests.length === 0 ? (
                            <SelectItem value="_loading" disabled>
                              Loading...
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
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
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
      </DialogContent>
    </Dialog>
  );
}