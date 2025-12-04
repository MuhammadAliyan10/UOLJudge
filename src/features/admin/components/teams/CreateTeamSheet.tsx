"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createTeamAction,
  getAllContestsForTeamAssignment,
} from "@/server/actions/admin/admin";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
  SheetClose,
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
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  KeyRound,
  Monitor,
  User,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/features/shared/ui/scroll-area";

// --- Schema Definition ---
const formSchema = z.object({
  displayName: z.string().min(3, "Team name must be at least 3 characters"),
  labLocation: z.string().optional(),
  contestId: z.string().min(1, "Contest selection is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  maxDevices: z
    .number()
    .min(1, "At least 1 device required")
    .max(3, "Maximum 3 devices allowed")
    .default(2),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTeamSheet() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState<Array<{ id: string; name: string }>>(
    []
  );
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

  // Initialize RHF Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      displayName: "",
      labLocation: "",
      contestId: "",
      username: "",
      password: "",
      maxDevices: 2,
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("displayName", values.displayName);
    formData.append("members", JSON.stringify([]));
    formData.append("labLocation", values.labLocation || "");
    formData.append("contestId", values.contestId);
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("maxDevices", values.maxDevices.toString());

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/80 shadow-sm border border-primary font-medium transition-all">
          <Plus size={16} className="mr-2" /> New Team
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[500px] w-full  p-0 gap-0">
        <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Register New Team
          </SheetTitle>
          <SheetDescription className="text-slate-500 text-sm mt-1">
            Create a team profile and issue access credentials.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-full pr-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 " // Add padding bottom for scroll
            >
              <div className="px-6 py-6 space-y-6 ">
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
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Team Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Code Warriors"
                              {...field}
                              className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                            />
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
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Lab Location
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Lab 1"
                              {...field}
                              className="h-9 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
                            />
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
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Max Device Slots
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={3}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
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

                  <FormField
                    control={form.control}
                    name="contestId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Assigned Contest
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200 focus:bg-white text-slate-900">
                              <SelectValue placeholder="Select Contest" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contestsLoading ? (
                              <SelectItem value="_loading" disabled>
                                Loading contests...
                              </SelectItem>
                            ) : contests.length === 0 ? (
                              <SelectItem value="_no_contests" disabled>
                                ⚠️ No contests available - Create one first
                              </SelectItem>
                            ) : (
                              contests.map((contest) => (
                                <SelectItem key={contest.id} value={contest.id}>
                                  <span className="font-medium text-slate-900">
                                    {contest.name}
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
                                placeholder="team_01"
                                autoComplete="off"
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

              <SheetFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 ">
                <SheetClose asChild>
                  <Button variant="outline">Close</Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-800 text-white font-bold tracking-tight h-10 px-6 shadow-sm border border-slate-900"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <span className="flex items-center justify-center">
                      Create Team Account{" "}
                      <ChevronRight size={16} className="ml-1 opacity-70" />
                    </span>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
