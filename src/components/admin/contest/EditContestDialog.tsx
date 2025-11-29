"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  updateContestAction,
  deleteContestAction,
} from "@/server/actions/admin";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  CalendarIcon,
  Clock,
  AlertTriangle,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

// --- Schema Definition ---
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Contest name is required"),
  startTime: z.date({ error: "Start time is required" }),
  endTime: z.date({ error: "End time is required" }),
  isActive: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditContestDialogProps {
  contest: {
    id: string;
    name: string;
    startTime: Date; // Fixed: Matches Prisma object key
    endTime: Date;   // Fixed: Matches Prisma object key
    isActive: boolean; // Fixed: Matches Prisma object key
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContestDialog({
  contest,
  open,
  onOpenChange,
}: EditContestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: contest.id,
      name: contest.name,
      startTime: new Date(contest.startTime),
      endTime: new Date(contest.endTime),
      isActive: contest.isActive ? "true" : "false",
    },
  });

  // Reset form when contest changes or dialog opens
  useEffect(() => {
    if (open && contest) {
      form.reset({
        id: contest.id,
        name: contest.name,
        startTime: new Date(contest.startTime),
        endTime: new Date(contest.endTime),
        isActive: String(contest.isActive), // Ensure string conversion
      });
    }
  }, [contest, open, form]);

  // --- Handlers ---

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("id", values.id);
    formData.append("name", values.name);
    formData.append("startTime", values.startTime.toISOString());
    formData.append("endTime", values.endTime.toISOString());
    formData.append("isActive", values.isActive);

    const res = await updateContestAction(formData);

    if (res.success) {
      toast.success("Contest updated successfully");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const res = await deleteContestAction(contest.id);
    if (res.success) {
      toast.success("Contest deleted");
      onOpenChange(false);
    } else {
      toast.error(res.error || "Deletion failed. Unregister teams first.");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]! max-h-[90vh]! overflow-y-auto bg-white border-slate-200 shadow-xl p-0 gap-0 rounded-lg ring-1 ring-slate-950/5">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">

          <DialogTitle className="text-xl  font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Edit Contest
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Update schedule parameters or manage lifecycle state.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="px-6 py-6 space-y-5">
              {/* Contest Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contest Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Final Speed Run"
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 font-medium text-slate-900"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Start Time Picker */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Start Time</FormLabel>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Time Picker */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">End Time</FormLabel>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lifecycle Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 text-slate-900 font-medium">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </SelectItem>
                        <SelectItem value="false">
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Danger Zone */}
              <div className="mt-4 p-4 rounded-md border border-red-100 bg-red-50/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
                    <p className="text-xs text-red-600/80">Irreversibly remove this contest.</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 px-3 border border-red-200/50"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-slate-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle size={20} /> Delete Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                          This action cannot be undone. It will permanently delete the contest
                          <span className="font-semibold text-slate-900"> "{contest.name}"</span>,
                          all linked problems, and submissions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                        >
                          {isDeleting ? (
                            <Loader2 className="animate-spin mr-2" size={16} />
                          ) : (
                            "Yes, Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
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
                className="h-9 bg-primary text-white hover:bg-primary/80 border border-primary shadow-sm"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
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

// --- Reusable DateTime Picker Component ---
function DateTimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const isValidDate = value instanceof Date && !isNaN(value.getTime());
  const safeValue = isValidDate ? value : new Date();

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    if (!/^\d{2}:\d{2}$/.test(timeValue)) return;
    const [hours, minutes] = timeValue.split(":");
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) return;

    const newDate = new Date(safeValue);
    newDate.setHours(hoursNum);
    newDate.setMinutes(minutesNum);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "w-full h-10 justify-start text-left font-normal border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all",
              !isValidDate && "text-slate-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
            {isValidDate ? (
              <span className="font-mono text-sm font-medium text-slate-700">{format(safeValue, "PPP p")}</span>
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-xl rounded-md" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={safeValue}
            onSelect={(d) => d && onChange(d)}
            disabled={(date) => {
              // Allow selecting past dates for editing
              return false;
            }}
            initialFocus
            className="p-3"
          />
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wide">
              <Clock size={14} className="mr-1.5 text-slate-400" />
              Time
            </div>
            <Input
              type="time"
              className="bg-white border-slate-200 h-8 w-32 font-mono text-sm text-slate-700"
              value={isValidDate ? format(safeValue, "HH:mm") : "00:00"}
              onChange={handleTimeChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
