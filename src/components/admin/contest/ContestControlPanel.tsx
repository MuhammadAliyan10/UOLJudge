"use client";

import { useState } from "react";
import { useContestSocket } from "@/hooks/useContestSocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Snowflake, Clock, Loader2, AlertTriangle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import {
    toggleContestPause,
    toggleLeaderboardFreeze
} from "@/server/actions/contest-control";
import { ExtendContestDialog } from "./ExtendContestDialog";

interface ContestControlPanelProps {
    contestId: string;
    initialIsPaused: boolean;
    initialIsFrozen: boolean;
    initialEndTime: Date;
}

export function ContestControlPanel({
    contestId,
    initialIsPaused,
    initialIsFrozen,
    initialEndTime
}: ContestControlPanelProps) {
    const [isPaused, setIsPaused] = useState(initialIsPaused);
    const [isFrozen, setIsFrozen] = useState(initialIsFrozen);
    const [loading, setLoading] = useState<string | null>(null);
    const [showExtendDialog, setShowExtendDialog] = useState(false);

    // WebSocket Connection
    const { isConnected } = useContestSocket({
        onStatusUpdate: (payload) => {
            if (payload.contestId === contestId) {
                if (payload.isPaused !== undefined) setIsPaused(payload.isPaused);
            }
        },
        onLeaderboardUpdate: (payload) => {
            if (payload.contestId === contestId && payload.isFrozen !== undefined) {
                setIsFrozen(payload.isFrozen);
            }
        }
    });

    const handlePauseToggle = async () => {
        setLoading("pause");
        try {
            const result = await toggleContestPause(contestId);
            if (result.success) {
                setIsPaused(result.isPaused!);
                toast.success(result.isPaused ? "Contest Paused" : "Contest Resumed");
            } else {
                toast.error(result.error || "Failed to toggle pause");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handleFreezeToggle = async () => {
        setLoading("freeze");
        try {
            const result = await toggleLeaderboardFreeze(contestId);
            if (result.success) {
                setIsFrozen(result.isFrozen!);
                toast.success(result.isFrozen ? "Leaderboard Frozen" : "Leaderboard Unfrozen");
            } else {
                toast.error("Failed to toggle freeze");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            Contest Control
                            {isConnected ? (
                                <span className="flex h-2 w-2 rounded-full bg-green-500" title="Connected to Real-time Server" />
                            ) : (
                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Disconnected" />
                            )}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono">
                            ID: {contestId.slice(0, 8)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Pause/Resume Button */}
                        <Button
                            variant={isPaused ? "destructive" : "default"}
                            className={`h-24 text-lg font-bold flex flex-col gap-2 ${isPaused ? "animate-pulse" : ""}`}
                            onClick={handlePauseToggle}
                            disabled={!!loading}
                        >
                            {loading === "pause" ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : isPaused ? (
                                <>
                                    <Play className="h-8 w-8" />
                                    RESUME CONTEST
                                </>
                            ) : (
                                <>
                                    <Pause className="h-8 w-8" />
                                    PAUSE CONTEST
                                </>
                            )}
                        </Button>

                        {/* Freeze Button */}
                        <Button
                            variant="outline"
                            className={`h-24 text-lg font-bold flex flex-col gap-2 border-2 ${isFrozen ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "border-slate-200"}`}
                            onClick={handleFreezeToggle}
                            disabled={!!loading}
                        >
                            {loading === "freeze" ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                                <>
                                    <Snowflake className={`h-8 w-8 ${isFrozen ? "text-yellow-600" : "text-slate-400"}`} />
                                    {isFrozen ? "UNFREEZE BOARD" : "FREEZE BOARD"}
                                </>
                            )}
                        </Button>

                        {/* Extend Time Button */}
                        <Button
                            variant="secondary"
                            className="h-24 text-lg font-bold flex flex-col gap-2"
                            onClick={() => setShowExtendDialog(true)}
                            disabled={!!loading}
                        >
                            <Clock className="h-8 w-8 text-blue-600" />
                            EXTEND TIME
                        </Button>
                    </div>

                    {isPaused && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="font-medium">Contest is currently PAUSED. No submissions allowed.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ExtendContestDialog
                contestId={contestId}
                open={showExtendDialog}
                onOpenChange={setShowExtendDialog}
            />
        </>
    );
}
