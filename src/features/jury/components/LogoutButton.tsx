"use client";

import { logoutAction } from "@/server/actions/auth/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/features/shared/ui/button";

export function LogoutButton() {
    const handleLogout = async () => {
        await logoutAction();
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
