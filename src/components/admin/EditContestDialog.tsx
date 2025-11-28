"use client";

import { useState } from "react";
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
import { Loader2, Trash2, CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (
      !confirm(
        "DELETE CONTEST? This will also delete all associated PROBLEMS and SUBMISSIONS."
      )
    )
      return;

    const res = await deleteContestAction(contest.id);
    if (res.success) {
      toast.success("Contest deleted");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
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
              {/* Start Time */}
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

              {/* End Time */}
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
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200"
              >
                <Trash2 size={18} />
              </Button>
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
                  className="bg-primary text-primary-foreground min-w-[100px]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    "Save"
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
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":");
    const newDate = new Date(value);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
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
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {value ? format(value, "PPP p") : <span>Pick a date</span>}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => d && onChange(d)}
          initialFocus
          className="p-3 border-b border-slate-100"
        />
        <div className="p-3 bg-slate-50 flex items-center gap-3">
          <Clock size={16} className="text-slate-500" />
          <Input
            type="time"
            className="bg-white border-slate-200 h-9 font-mono text-sm"
            value={format(value, "HH:mm")}
            onChange={handleTimeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
