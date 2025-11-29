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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Loader2, CalendarIcon, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "@prisma/client";

// --- Schema Definition ---
const formSchema = z
  .object({
    name: z.string().min(1, "Contest Name is required"),
    startTime: z.date({ error: "Start time is required" }),
    endTime: z.date({ error: "End time is required" }),
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
      endTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000),
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

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
        <Button className="bg-primary text-white hover:bg-primary/80 shadow-sm border border-primary font-medium transition-all">
          <Plus size={16} className="mr-2" />
          New Contest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] bg-white border-slate-200 shadow-xl p-0 gap-0 overflow-hidden rounded-lg ring-1 ring-slate-950/5">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">

          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Create New Contest</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Set up the schedule, category, and problem parameters.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-6 space-y-5">
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
                      autoComplete="off"
                      placeholder="e.g. Winter Speed Run 2024"
                      className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-5">
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

            <div className="grid grid-cols-2 gap-5">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 text-slate-900 font-medium">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CORE">Core Prgramming</SelectItem>
                        <SelectItem value="WEB">Web Development</SelectItem>
                        <SelectItem value="ANDROID">Android Development</SelectItem>
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
                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Problem Slots</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 text-slate-900 font-medium"
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

            <div className="pt-2">
              <Button

                type="submit"
                className="w-full h-11 bg-primary text-white hover:bg-primary/80 font-bold tracking-tight shadow-sm border border-primary hover:border-primary/80 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <span className="flex items-center justify-center">
                    Generate Contest <ChevronRight size={16} className="ml-1 opacity-70" />
                  </span>
                )}
              </Button>
            </div>
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
            required={true}
            selected={safeValue}
            onSelect={(d) => d && onChange(d)}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
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