"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { bulkImportTeams, type BulkImportResult } from "@/server/actions/team-management";
import { toast } from "sonner";

interface BulkImportDialogProps {
    contests: Array<{ id: string; name: string }>;
}

export function BulkImportDialog({ contests }: BulkImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [csvContent, setCsvContent] = useState("");
    const [selectedContest, setSelectedContest] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!csvContent.trim()) {
            toast.error("Please paste CSV content");
            return;
        }

        if (!selectedContest) {
            toast.error("Please select a contest");
            return;
        }

        setIsLoading(true);

        try {
            const result: BulkImportResult = await bulkImportTeams(
                selectedContest,
                csvContent
            );

            if (result.success && result.credentials && result.credentials.length > 0) {
                // Generate credentials CSV for download
                const csvHeader = "Team Name,Username,Password,Category,Member 1,Member 2\n";
                const csvRows = result.credentials
                    .map(
                        (cred) =>
                            `${cred.teamName},${cred.username},${cred.password},${cred.category},${cred.members[0] || ""},${cred.members[1] || ""}`
                    )
                    .join("\n");
                const csvData = csvHeader + csvRows;

                // Trigger download
                const blob = new Blob([csvData], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `credentials_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Show success message
                toast.success(
                    `Successfully imported ${result.successCount} team(s)! Credentials downloaded.`,
                    {
                        description: result.failureCount
                            ? `${result.failureCount} team(s) failed. Check console for details.`
                            : undefined,
                    }
                );

                if (result.errors && result.errors.length > 0) {
                    console.error("Import errors:", result.errors);
                }

                // Reset form
                setCsvContent("");
                setSelectedContest("");
                setOpen(false);
            } else {
                toast.error("Import failed", {
                    description: result.errors?.join(", ") || "Unknown error",
                });
            }
        } catch (error: any) {
            console.error("Import error:", error);
            toast.error("Import failed", {
                description: error.message || "An unexpected error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import Teams
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Import Teams from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with team data. Expected format:{" "}
                        <code className="bg-slate-100 px-1 rounded text-xs">
                            TeamName,Category,Member1Name,Member2Name
                        </code>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Contest Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="contest">Contest</Label>
                        <Select value={selectedContest} onValueChange={setSelectedContest}>
                            <SelectTrigger id="contest">
                                <SelectValue placeholder="Select contest to register teams" />
                            </SelectTrigger>
                            <SelectContent>
                                {contests.map((contest) => (
                                    <SelectItem key={contest.id} value={contest.id}>
                                        {contest.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* CSV Input */}
                    <div className="space-y-2">
                        <Label htmlFor="csv">CSV Data</Label>
                        <Textarea
                            id="csv"
                            placeholder="TeamName,Category,Member1Name,Member2Name&#10;Alpha Squad,CORE,Alice Johnson,Bob Smith&#10;Web Warriors,WEB,Charlie Davis,Diana Evans"
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <div className="flex gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="text-blue-900 font-medium">Important Notes:</p>
                                <ul className="text-blue-700 space-y-0.5 list-disc list-inside">
                                    <li>Category must be: CORE, WEB, or ANDROID</li>
                                    <li>Usernames will be auto-generated (e.g., team_web_a8x9)</li>
                                    <li>Passwords will be 6-character random strings</li>
                                    <li>Credentials will download automatically after import</li>
                                    <li>Malformed rows will be skipped with error logging</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Import & Generate Credentials
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
