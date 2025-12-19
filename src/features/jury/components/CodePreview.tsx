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
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for non-secure contexts (HTTP) or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("execCommand copy failed");
        }
      }

      setCopied(true);
      toast.success("Code copied to clipboard!");

      // Reset icon after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy code. Please select and copy manually.");
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
