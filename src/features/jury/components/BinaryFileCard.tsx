import { Card } from "@/features/shared/ui/card";
import { Button } from "@/features/shared/ui/button";
import { Download, Package, Smartphone, FileArchive } from "lucide-react";
import { formatFileSize } from "@/lib/utils/file-type";

interface BinaryFileCardProps {
    fileName: string;
    fileSize?: number;
    fileType: string;
    downloadUrl: string;
    iconType?: "archive" | "mobile" | "code";
}

export function BinaryFileCard({
    fileName,
    fileSize,
    fileType,
    downloadUrl,
    iconType = "archive"
}: BinaryFileCardProps) {
    const getIcon = () => {
        switch (iconType) {
            case "mobile":
                return <Smartphone size={48} className="text-slate-400" />;
            case "archive":
                return <Package size={48} className="text-slate-400" />;
            default:
                return <FileArchive size={48} className="text-slate-400" />;
        }
    };

    return (
        <div className="h-full flex items-center justify-center p-8">
            <Card className="max-w-md w-full border-2 border-dashed border-slate-300 bg-slate-50/50">
                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                    {/* Icon */}
                    <div className="p-6 bg-slate-100 rounded-2xl">
                        {getIcon()}
                    </div>

                    {/* File Info */}
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">
                            Binary Artifact
                        </h3>
                        <p className="text-sm font-medium text-slate-600">
                            {fileName || `${fileType.toUpperCase()} File`}
                        </p>
                        {fileSize && (
                            <p className="text-xs text-slate-500">
                                Size: {formatFileSize(fileSize)}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 text-center max-w-sm">
                        This file cannot be previewed in the browser. Download it to review the submission content.
                    </p>

                    {/* Download Button */}
                    <a href={downloadUrl} download className="w-full">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11 shadow-md"
                        >
                            <Download size={16} className="mr-2" />
                            Download File
                        </Button>
                    </a>

                    {/* Security Note */}
                    <p className="text-[10px] text-slate-400 text-center">
                        🔒 Secure download via authenticated API
                    </p>
                </div>
            </Card>
        </div>
    );
}
