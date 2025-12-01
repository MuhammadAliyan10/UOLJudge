import { useState } from "react";
import { Button } from "@/features/shared/ui/button";
import { ScrollArea } from "@/features/shared/ui/scroll-area";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodePreviewProps {
    content: string;
    language: string;
    fileName?: string;
}

export function CodePreview({ content, language, fileName }: CodePreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast.success("Code copied to clipboard!");

            // Reset icon after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy code");
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Copy Button */}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="h-8 px-3 text-xs bg-white/90 hover:bg-white shadow-sm"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="mr-1.5 text-green-600" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy size={14} className="mr-1.5" />
                            Copy Code
                        </>
                    )}
                </Button>
            </div>

            {/* Code Content */}
            <ScrollArea className="h-full overflow-y-auto">
                <pre className="p-6 text-sm font-mono bg-slate-900 text-slate-100 overflow-x-auto min-h-full">
                    <code className={`language-${language}`}>
                        {content || "// No content available"}
                    </code>
                </pre>
            </ScrollArea>
        </div>
    );
}
