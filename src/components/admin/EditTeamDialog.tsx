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
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

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
      <DialogContent className="sm:max-w-[425px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Edit Team: {team.username}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdate)}
            className="space-y-6 pt-2"
          >
            <input type="hidden" name="id" value={team.id} />

            {/* Field Groups (Team Name, Location, etc.) */}
            {/* ... (All FormFields are omitted here for brevity, but they follow the standard pattern from previous step) ... */}

            {/* Team Name and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Code Warriors" {...field} />
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
                    <FormLabel>Lab Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Lab 1" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contest Assignment and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contestId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Contest *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                              {contest.name} - {new Date(contest.startTime).toLocaleDateString()}
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
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Reset */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase">
                Change Password
              </p>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="New password (leave empty to keep)"
                        type="text"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between pt-4">
              {/* SHADCN ALERT DIALOG FOR DELETION */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200"
                  >
                    <Trash2 size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle size={24} /> Confirm Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you absolutely sure you want to delete **@
                      {team.username}**? This action cannot be undone and will
                      permanently remove all associated submissions and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
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

              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground min-w-[120px] shadow-sm"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
