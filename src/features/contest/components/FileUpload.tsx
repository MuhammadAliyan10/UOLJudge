"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { Category } from "@prisma/client";

const mainVariant = {
    initial: {
        x: 0,
        y: 0,
    },
    animate: {
        x: 20,
        y: -20,
        opacity: 0.9,
    },
};

const secondaryVariant = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
};

// File type configurations per category
const ACCEPTED_FILES: Record<Category, Record<string, string[]>> = {
    CORE: {
        'application/zip': ['.zip'],
        'text/x-python': ['.py'],
        'text/x-c++src': ['.cpp', '.c++', '.cc'],
        'text/x-csrc': ['.c'],
        'text/javascript': ['.js'],
        'application/typescript': ['.ts'],
        'text/x-java': ['.java'],
    },
    WEB: {
        'application/zip': ['.zip'],
    },
    ANDROID: {
        'application/zip': ['.zip'],
    },
};

interface FileUploadProps {
    category: Category;
    onChange?: (file: File | null) => void;
    disabled?: boolean;
}

export const FileUpload = ({ category, onChange, disabled = false }: FileUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (newFiles: File[]) => {
        const selectedFile = newFiles[0] || null;
        setFile(selectedFile);
        onChange?.(selectedFile);
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const { getRootProps, isDragActive } = useDropzone({
        multiple: false,
        noClick: true,
        disabled,
        accept: ACCEPTED_FILES[category],
        onDrop: handleFileChange,
        onDropRejected: (rejections) => {
            console.error("File rejected:", rejections);
        },
    });

    // Get accepted extensions for display
    const getAcceptedExtensions = () => {
        return Object.values(ACCEPTED_FILES[category])
            .flat()
            .join(', ');
    };

    return (
        <div className="w-full" {...getRootProps()}>
            <motion.div
                onClick={handleClick}
                whileHover={disabled ? undefined : "animate"}
                className={cn(
                    "p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden border-2 border-dashed",
                    disabled ? "cursor-not-allowed opacity-50 border-slate-200" : "border-slate-300 hover:border-blue-400",
                    isDragActive && "border-blue-500 bg-blue-50"
                )}
            >
                <input
                    ref={fileInputRef}
                    id="file-upload-handle"
                    type="file"
                    accept={getAcceptedExtensions()}
                    onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
                    className="hidden"
                    disabled={disabled}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                    <GridPattern />
                </div>
                <div className="flex flex-col items-center justify-center relative z-10">
                    <p className="font-sans font-bold text-slate-700 dark:text-slate-300 text-base">
                        Upload file
                    </p>
                    <p className="font-sans font-normal text-slate-400 dark:text-slate-400 text-sm mt-2">
                        Drag or drop your file here or click to upload
                    </p>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                        Accepted: {getAcceptedExtensions()}
                    </p>
                    <div className="relative w-full mt-10 max-w-xl mx-auto">
                        {file ? (
                            <motion.div
                                key="file-display"
                                layoutId="file-upload"
                                className={cn(
                                    "relative overflow-hidden z-40 bg-white dark:bg-slate-900 flex flex-col items-start justify-start md:h-24 p-4 w-full mx-auto rounded-md border border-slate-200",
                                    "shadow-sm"
                                )}
                            >
                                <div className="flex justify-between w-full items-center gap-4">
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                        className="text-base text-slate-700 dark:text-slate-300 truncate max-w-xs font-medium"
                                    >
                                        {file.name}
                                    </motion.p>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                        className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-white"
                                    >
                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    </motion.p>
                                </div>

                                <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-slate-600 dark:text-slate-400">
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs"
                                    >
                                        {file.type || 'Unknown type'}
                                    </motion.p>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        layout
                                        className="text-xs"
                                    >
                                        Modified {new Date(file.lastModified).toLocaleDateString()}
                                    </motion.p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                layoutId="file-upload"
                                variants={mainVariant}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                }}
                                className={cn(
                                    "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-slate-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md border border-slate-200",
                                    "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                                )}
                            >
                                {isDragActive ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-slate-600 flex flex-col items-center"
                                    >
                                        Drop it
                                        <Upload className="h-4 w-4 text-slate-600 dark:text-slate-400 mt-1" />
                                    </motion.p>
                                ) : (
                                    <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                )}
                            </motion.div>
                        )}

                        {!file && (
                            <motion.div
                                variants={secondaryVariant}
                                className="absolute opacity-0 border border-dashed border-blue-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                            ></motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export function GridPattern() {
    const columns = 41;
    const rows = 11;
    return (
        <div className="flex bg-slate-100 dark:bg-slate-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
            {Array.from({ length: rows }).map((_, row) =>
                Array.from({ length: columns }).map((_, col) => {
                    const index = row * columns + col;
                    return (
                        <div
                            key={`${col}-${row}`}
                            className={`w-10 h-10 flex shrink-0 rounded-[2px] ${index % 2 === 0
                                    ? "bg-slate-50 dark:bg-slate-950"
                                    : "bg-slate-50 dark:bg-slate-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
                                }`}
                        />
                    );
                })
            )}
        </div>
    );
}
