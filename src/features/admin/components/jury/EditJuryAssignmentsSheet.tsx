"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  updateJuryAssignmentsAction,
  getAllContestsForAssignment,
} from "@/server/actions/jury/jury-management";
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
import { Checkbox } from "@/features/shared/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Calendar, Save } from "lucide-react";
import { ScrollArea } from "@/features/shared/ui/scroll-area";

const formSchema = z.object({
  contestIds: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface EditJuryAssignmentsSheetProps {
  jury: {
    id: string;
    username: string;
    assignedContests: Array<{
      id: string;
      name: string;
    }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditJuryAssignmentsSheet({
  jury,
  open,
  onOpenChange,
}: EditJuryAssignmentsSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contests, setContests] = useState<Array<{ id: string; name: string }>>(
    []
  );

  useEffect(() => {
    async function fetchContests() {
      try {
        const data = await getAllContestsForAssignment();
        setContests(data);
      } catch (error) {
        console.error("Failed to fetch contests:", error);
      }
    }
    if (open) fetchContests();
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contestIds: jury.assignedContests.map((c) => c.id),
    },
  });

  // Reset form when jury changes
  useEffect(() => {
    if (open && jury) {
      form.reset({
        contestIds: jury.assignedContests.map((c) => c.id),
      });
    }
  }, [jury, open, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    const res = await updateJuryAssignmentsAction(jury.id, values.contestIds);

    if (res.success) {
      toast.success(res.message || "Assignments updated successfully");
      onOpenChange(false);
      router.refresh(); // Soft refresh without full page reload
    } else {
      toast.error(res.error || "Failed to update assignments");
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-slate-100">
          <SheetTitle className="text-xl font-bold text-slate-900 tracking-tight">
            Edit Assignments for {jury.username}
          </SheetTitle>
          <SheetDescription className="text-slate-500 text-sm">
            Add or remove contest access for this jury member. Changes take
            effect immediately.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col py-6 space-y-6"
          >
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                Contest Assignments
              </h4>
              <FormField
                control={form.control}
                name="contestIds"
                render={() => (
                  <FormItem>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                      <ScrollArea className="h-[300px] pr-4">
                        {contests.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-8">
                            No active contests available
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {contests.map((contest) => (
                              <FormField
                                key={contest.id}
                                control={form.control}
                                name="contestIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={contest.id}
                                      className="flex flex-row items-center space-x-3 space-y-0 p-3 bg-white border border-slate-200 rounded-md hover:border-primary-300 transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            contest.id
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  contest.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== contest.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-medium text-slate-900 cursor-pointer !mt-0 w-full">
                                        {contest.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
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
      </SheetContent>
    </Sheet>
  );
}
