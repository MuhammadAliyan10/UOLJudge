"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

export function BlockedPage() {
    return (
        <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-red-200 shadow-2xl bg-white">
                <CardContent className="p-8 text-center">
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                        <Lock size={40} className="text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Access Restricted
                    </h1>

                    <p className="text-slate-600 mb-8">
                        Your team has been blocked from accessing this contest. If you believe this is a mistake, please contact an administrator immediately.
                    </p>

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => logoutAction()}
                    >
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
