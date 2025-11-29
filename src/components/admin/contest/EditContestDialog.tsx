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
    start_time: Date;
    end_time: Date;
    is_active: boolean;
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
      startTime: new Date(contest.start_time),
      endTime: new Date(contest.end_time),
      isActive: contest.is_active ? "true" : "false",
    },
  });

  // Reset form when contest changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        id: contest.id,
        name: contest.name,
        startTime: new Date(contest.start_time),
        endTime: new Date(contest.end_time),
        isActive: contest.is_active ? "true" : "false",
      });
    }
  }, [contest, open, form]);

  // --- Handlers ---

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    // Convert RHF object to FormData for Server Action
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
      // If the deletion fails due to FK constraint (teams still registered), inform the admin.
      toast.error(res.error || "Deletion failed. Unregister teams first.");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Edit Contest</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-2"
          >
            {/* Contest Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contest Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Final Speed Run" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Start Time Picker */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
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
                    <FormLabel>End Time</FormLabel>
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
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Actions */}
            <div className="flex justify-between pt-6 border-t border-slate-100">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200"
                  >
                    <Trash2 size={18} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle size={24} /> Delete Contest?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is permanent and **cannot be undone**. It will
                      delete the contest, all linked problems, and all related
                      submissions.
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
                        "Yes, Delete Permanently"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground min-w-[100px] shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
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
  // Validate date to prevent format errors
  const isValidDate = value instanceof Date && !isNaN(value.getTime());
  const safeValue = isValidDate ? value : new Date();

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;

    // Validate HH:MM format (prevent backslash crash)
    if (!/^\d{2}:\d{2}$/.test(timeValue)) {
      return; // Silently ignore invalid input
    }

    const [hours, minutes] = timeValue.split(":");
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    // Validate time ranges
    if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) {
      return;
    }

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
              "w-full justify-start text-left font-normal border-slate-200",
              !isValidDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {isValidDate ? format(safeValue, "PPP p") : <span>Pick a date</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={safeValue}
          onSelect={(d) => d && onChange(d)}
          disabled={(date) => {
            // Disable past dates (client-side UX only)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }}
          initialFocus
          className="p-3 border-b border-slate-100"
        />
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
          <Clock size={16} className="text-slate-500" />
          <Input
            type="time"
            className="bg-white border-slate-200 h-9"
            value={isValidDate ? format(safeValue, "HH:mm") : "00:00"}
            onChange={handleTimeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
