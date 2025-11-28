"use client";

import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { Category } from "@prisma/client"; // Assumed import

// --- Schema Definition ---
const formSchema = z.object({
  displayName: z.string().min(3, "Team name must be at least 3 characters"),
  labLocation: z.string().optional(),
  category: z.nativeEnum(Category, { message: "Category is required" }),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize RHF Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      displayName: "",
      labLocation: "",
      category: "CORE",
      username: "",
      password: "",
    },
    // Prevent strict validation on unmounted fields for clean UX
    mode: "onBlur",
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    // Convert RHF object to FormData for Server Action
    const formData = new FormData();
    formData.append("displayName", values.displayName);
    formData.append("labLocation", values.labLocation || "");
    formData.append("category", values.category);
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
        <Button className="bg-primary text-primary-foreground gap-2 shadow-sm">
          <Plus size={16} /> New Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Register New Team</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
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
                      <Input placeholder="Lab 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      <SelectItem value="CORE">Core Programming</SelectItem>
                      <SelectItem value="WEB">Web Development</SelectItem>
                      <SelectItem value="ANDROID">Android Dev</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credentials */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Credentials
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Username
                      </label>
                      <FormControl>
                        <Input
                          placeholder="team_01"
                          className="bg-white font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Password
                      </label>
                      <FormControl>
                        <Input
                          placeholder="******"
                          type="text"
                          minLength={6}
                          className="bg-white font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}{" "}
              Create Team
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
