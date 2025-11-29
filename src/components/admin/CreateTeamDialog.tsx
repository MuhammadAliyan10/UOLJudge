"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createTeamAction } from "@/server/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { Plus, Loader2, KeyRound, Monitor, User } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Schema Definition ---
const formSchema = z.object({
  displayName: z.string().min(3, "Team name must be at least 3 characters"),
  labLocation: z.string().optional(),
  contestId: z.string().min(1, "Contest selection is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Initialize RHF Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      displayName: "",
      labLocation: "",
      contestId: "",
      username: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("displayName", values.displayName);
    formData.append("labLocation", values.labLocation || "");
    formData.append("contestId", values.contestId);
    formData.append("username", values.username);
    formData.append("password", values.password);

    const res = await createTeamAction(formData);

    if (res.success) {
      toast.success("Team created successfully");
      form.reset();
      setOpen(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900 font-medium transition-all">
          <Plus size={16} className="mr-2" /> New Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-white border-slate-200 shadow-xl p-0 gap-0 overflow-hidden rounded-lg ring-1 ring-slate-950/5">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Registration</span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Register New Team</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mt-1">
            Create a team profile and issue access credentials.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="px-6 py-6 space-y-6">
              {/* Team Details Section */}
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
                          <Input placeholder="e.g. Code Warriors" {...field} className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900" />
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
                          <Input placeholder="e.g. Lab 1" {...field} className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <SelectTrigger className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900">
                            <SelectValue placeholder="Select Contest" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contests.length === 0 ? (
                            <SelectItem value="_loading" disabled>
                              Loading contests...
                            </SelectItem>
                          ) : (
                            contests.map((contest) => (
                              <SelectItem key={contest.id} value={contest.id}>
                                <span className="font-medium text-slate-900">{contest.name}</span>
                                <span className="ml-2 text-slate-400 text-xs">
                                  ({new Date(contest.startTime).toLocaleDateString()})
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Credentials Section */}
              <div className="space-y-4 pt-2">
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                              placeholder="team_01"
                              className="pl-9 h-9 bg-white border-slate-200 font-mono text-sm text-slate-900 focus:border-slate-300"
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                              placeholder="******"
                              type="text"
                              minLength={6}
                              className="pl-9 h-9 bg-white border-slate-200 font-mono text-sm text-slate-900 focus:border-slate-300"
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
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-tight h-10 px-6 shadow-sm border border-slate-900"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Create Team Account
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}