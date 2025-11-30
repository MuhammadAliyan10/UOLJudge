"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateCeremony } from "@/server/actions/ceremony";
import { toast } from "sonner";

interface CeremonyExportButtonProps {
    contestId: string;
    contestName: string;
}

export function CeremonyExportButton({
    contestId,
    contestName,
}: CeremonyExportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);

        try {
            const result = await generateCeremony(contestId);

            // Download the HTML file
            const blob = new Blob([result.html], { type: "text/html" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Ceremony generated!", {
                description: "Interactive HTML downloaded successfully",
            });
        } catch (error: any) {
            console.error("Ceremony export error:", error);
            toast.error("Export failed", {
                description: error.message || "An unexpected error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Ceremony Artifact
                </>
            )}
        </Button>
    );
}
