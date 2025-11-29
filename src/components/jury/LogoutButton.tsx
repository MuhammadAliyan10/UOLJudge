"use client";

import { logoutAction } from "@/server/actions/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LogoutButton() {
    const handleLogout = async () => {
        try {
            await logoutAction();
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    return (
        <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start"
        >
            <LogOut size={14} className="mr-2" />
            Logout
        </Button>
    );
}
