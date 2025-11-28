"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useContestSocket } from "@/hooks/useContestSocket";
import type { Category } from "@prisma/client";

interface TeamScoreData {
    id: string;
    teamId: string;
    teamName: string;
    category: Category;
    solvedCount: number;
    totalPenalty: number;
    rank?: number;
}

interface LiveBoardProps {
    initialScores: TeamScoreData[];
    contestId: string;
    isFrozen?: boolean;
}

/**
 * Live Leaderboard Component
 * O(1) reads from TeamScore table
 * Real-time updates via WebSocket
 * Freeze logic: stops processing updates when contest is frozen
 */
export function LiveBoard({ initialScores, contestId, isFrozen = false }: LiveBoardProps) {
    const [scores, setScores] = useState<TeamScoreData[]>(initialScores);
    const [frozenState, setFrozenState] = useState(isFrozen);

    // Sort scores by ICPC rules: Most Solved → Lowest Penalty
    const sortScores = (scores: TeamScoreData[]) => {
        return [...scores].sort((a, b) => {
            // First: Most problems solved (descending)
            if (b.solvedCount !== a.solvedCount) {
                return b.solvedCount - a.solvedCount;
            }
            // Second: Lowest penalty (ascending)
            return a.totalPenalty - b.totalPenalty;
        });
    };

    // WebSocket for real-time updates
    useContestSocket({
        onLeaderboardUpdate: (payload) => {
            // CASE 1: Freeze Update
            if ("isFrozen" in payload) {
                if (payload.contestId === contestId) {
                    setFrozenState(payload.isFrozen);
                }
                return;
            }

            // CASE 2: Score Update
            // FREEZE LOGIC: Don't update if leaderboard is frozen
            if (frozenState) {
                console.log("Leaderboard frozen - ignoring update");
                return;
            }

            // Update specific team score
            setScores((prevScores) => {
                const updated = prevScores.map((score) =>
                    score.teamId === payload.teamId
                        ? {
                            ...score,
                            solvedCount: payload.solvedCount,
                            totalPenalty: payload.totalPenalty,
                        }
                        : score
                );
                return sortScores(updated);
            });
        },
        onStatusUpdate: (payload) => {
            // Only handle non-freeze status updates here
        },
    });

    // Initial sort
    useEffect(() => {
        setScores(sortScores(initialScores));
    }, [initialScores]);

    // Assign ranks
    const rankedScores = scores.map((score, index) => ({
        ...score,
        rank: index + 1,
    }));

    // Get rank icon/color
    const getRankDisplay = (rank: number) => {
        if (rank === 1) {
            return <Trophy className="h-5 w-5 text-yellow-500" />;
        }
        if (rank === 2) {
            return <Medal className="h-5 w-5 text-gray-400" />;
        }
        if (rank === 3) {
            return <Award className="h-5 w-5 text-amber-600" />;
        }
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    };

    // Get category color
    const getCategoryColor = (category: Category) => {
        const colors: Record<Category, string> = {
            CORE: "bg-blue-500",
            WEB: "bg-green-500",
            ANDROID: "bg-purple-500",
        };
        return colors[category] || "bg-gray-500";
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Live Leaderboard</h2>
                {frozenState && (
                    <Badge variant="outline" className="bg-yellow-50 border-yellow-500 text-yellow-700">
                        ❄️ Frozen
                    </Badge>
                )}
            </div>

            {/* Leaderboard Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr className="border-b">
                                <th className="text-left p-4 font-semibold w-20">Rank</th>
                                <th className="text-left p-4 font-semibold">Team</th>
                                <th className="text-center p-4 font-semibold w-32">Category</th>
                                <th className="text-center p-4 font-semibold w-32">Solved</th>
                                <th className="text-center p-4 font-semibold w-32">Penalty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankedScores.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                                        No teams yet
                                    </td>
                                </tr>
                            ) : (
                                rankedScores.map((score) => (
                                    <tr
                                        key={score.teamId}
                                        className="border-b hover:bg-muted/50 transition-colors"
                                        style={{
                                            transition: "transform 0.3s ease, background-color 0.2s ease",
                                        }}
                                    >
                                        {/* Rank */}
                                        <td className="p-4">
                                            <div className="flex items-center justify-center">
                                                {getRankDisplay(score.rank!)}
                                            </div>
                                        </td>

                                        {/* Team Name */}
                                        <td className="p-4">
                                            <div className="font-medium">{score.teamName}</div>
                                        </td>

                                        {/* Category */}
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <Badge className={`${getCategoryColor(score.category)} text-white`}>
                                                    {score.category}
                                                </Badge>
                                            </div>
                                        </td>

                                        {/* Solved Count */}
                                        <td className="p-4 text-center">
                                            <div className="text-lg font-bold text-green-600">
                                                {score.solvedCount}
                                            </div>
                                        </td>

                                        {/* Total Penalty */}
                                        <td className="p-4 text-center">
                                            <div className="text-sm text-muted-foreground">
                                                {score.totalPenalty} min
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span>CORE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>WEB</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    <span>ANDROID</span>
                </div>
            </div>
        </div>
    );
}
