"use client";

import { useState } from "react";
import { generateCeremony } from "@/server/actions/ceremony";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Trophy, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Contest {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
    _count: {
        registrations: number;
    };
}

interface ResultsClientProps {
    contests: Contest[];
}

export default function ResultsClient({ contests }: ResultsClientProps) {
    const [generating, setGenerating] = useState<string | null>(null);

    const handleGenerateCeremony = async (contestId: string, contestName: string) => {
        setGenerating(contestId);

        try {
            const result = await generateCeremony(contestId);

            // Create blob and download
            const blob = new Blob([result.html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Ceremony generated for ${contestName}!`, {
                description: "HTML file downloaded successfully",
            });
        } catch (error) {
            toast.error("Failed to generate ceremony", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setGenerating(null);
        }
    };

    if (contests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Trophy className="h-16 w-16 text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-600">No Completed Contests</h2>
                <p className="text-gray-500">Completed contests will appear here for ceremony generation</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Award Ceremony Generator</h1>
                    <p className="text-gray-600 mt-1">
                        Download interactive HTML ceremonies for completed contests
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contests.map((contest) => (
                    <Card key={contest.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-start justify-between">
                                <span className="line-clamp-2">{contest.name}</span>
                                <Badge variant="outline" className="ml-2 shrink-0">
                                    {format(new Date(contest.endTime), "MMM d, yyyy")}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(contest.startTime), "MMM d")}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{contest._count.registrations} teams</span>
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => handleGenerateCeremony(contest.id, contest.name)}
                                disabled={generating === contest.id}
                            >
                                {generating === contest.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Ceremony
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-center text-gray-500">
                                Interactive HTML with keyboard controls
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                <h3 className="font-semibold text-blue-900 mb-2">How to use the ceremony:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Open the downloaded HTML file in any browser</li>
                    <li>• Press <kbd className="px-2 py-1 bg-white rounded border">→</kbd> or <kbd className="px-2 py-1 bg-white rounded border">Space</kbd> to reveal next stage</li>
                    <li>• Press <kbd className="px-2 py-1 bg-white rounded border">←</kbd> to go back</li>
                    <li>• Stages: Intro → Honorable Mentions → 🥉 → 🥈 → 🥇 (with fireworks!)</li>
                </ul>
            </div>
        </div>
    );
}
