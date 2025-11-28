"use client";

import { useState } from "react";
import { updateTeamAction, deleteTeamAction } from "@/server/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Trash2 } from "lucide-react";
import { Category } from "@prisma/client";

interface EditTeamDialogProps {
  team: {
    id: string;
    username: string;
    is_active: boolean;
    team_profile: {
      display_name: string;
      category: Category;
      lab_location: string | null;
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

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateTeamAction(formData);
    if (res.success) {
      toast.success("Team updated");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (
      !confirm("Are you sure? This will delete the team and all submissions.")
    )
      return;
    const res = await deleteTeamAction(team.id);
    if (res.success) {
      toast.success("Team deleted");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle>Edit Team: {team.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 pt-4">
          <input type="hidden" name="id" value={team.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Name</label>
              <Input
                name="displayName"
                defaultValue={team.team_profile?.display_name}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lab Location</label>
              <Input
                name="labLocation"
                defaultValue={team.team_profile?.lab_location || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              name="category"
              defaultValue={team.team_profile?.category || "CORE"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORE">Core</SelectItem>
                <SelectItem value="WEB">Web</SelectItem>
                <SelectItem value="ANDROID">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              name="isActive"
              defaultValue={team.is_active ? "true" : "false"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Change Password
            </label>
            <Input
              name="password"
              placeholder="New password (leave empty to keep)"
              type="text"
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary text-white"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
