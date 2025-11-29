"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { createContestAction } from "@/server/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Loader2, CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@prisma/client";

// --- Schema Definition ---
const formSchema = z
  .object({
    name: z.string().min(1, "Contest Name is required"),
    startTime: z.date({ error: "Start time is required" }),
    endTime: z.date({ error: "End time is required" }),
    // Zod's nativeEnum handles the string output from the Select component correctly.
    category: z.nativeEnum(Category, { error: "Category is required" }),
    problemCount: z.coerce
      .number()
      .min(1, "Min 1 problem")
      .max(15, "Max 15 problems"),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

type FormValues = z.infer<typeof formSchema>;

export function CreateContestDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      problemCount: 5,
      category: "CORE",
      startTime: new Date(),
      // Default end time 3 hours later
      endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    // CRITICAL STEP: Convert Date objects to ISO strings for Server Action consumption.
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("startTime", values.startTime.toISOString());
    formData.append("endTime", values.endTime.toISOString());
    formData.append("category", values.category);
    formData.append("problemCount", String(values.problemCount));

    const res = await createContestAction(formData);

    if (res.success) {
      toast.success("Contest created & problems generated");
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
        <Button className="bg-primary text-primary-foreground gap-2 shadow-sm">
          <Plus size={16} /> New Contest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Create Contest</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            {/* Contest Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contest Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Final Speed Run 2024" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CORE">Core</SelectItem>
                        <SelectItem value="WEB">Web</SelectItem>
                        <SelectItem value="ANDROID">Android</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Problem Slots */}
              <FormField
                control={form.control}
                name="problemCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Slots</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? "" : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                "Generate Contest"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Internal Reusable DateTime Component ---

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
          required={true}
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
            className="bg-white border-slate-200 h-8"
            value={isValidDate ? format(safeValue, "HH:mm") : "00:00"}
            onChange={handleTimeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
