'use client';

import { useState, useRef } from 'react';
import { Category } from '@prisma/client';
import { submitSolution } from '@/server/actions/submit';
import { getAllowedExtensionsString } from '@/lib/fileUtils';

interface SubmitDialogProps {
    problemId: string;
    category: Category;
    contestEndTime: Date;
    onClose: () => void;
    onSuccess: () => void;
}

export function SubmitDialog({
    problemId,
    category,
    contestEndTime,
    onClose,
    onSuccess,
}: SubmitDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if contest has ended
    const isContestEnded = new Date() > new Date(contestEndTime);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || isSubmitting || isContestEnded) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('problemId', problemId);
            formData.append('file', selectedFile);

            const result = await submitSolution(formData);

            if (result.success) {
                onSuccess();
            } else {
                setError(result.error || 'Submission failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-4 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Submit Solution</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Contest Ended Warning */}
                {isContestEnded && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm font-semibold">
                            ⚠️ Contest has ended. Submissions are no longer accepted.
                        </p>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* File Input Info */}
                    <div className="mb-4">
                        <p className="text-sm text-slate-400 mb-2">
                            Allowed file types:{' '}
                            <span className="text-white font-mono">
                                {getAllowedExtensionsString(category)}
                            </span>
                        </p>
                        <p className="text-xs text-slate-500">Maximum file size: 50MB</p>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 mb-4 transition-all ${isDragging
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-slate-600 bg-slate-900/50'
                            }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    handleFileSelect(files[0]);
                                }
                            }}
                            className="hidden"
                            disabled={isContestEnded}
                        />

                        {selectedFile ? (
                            <div className="text-center">
                                <div className="text-4xl mb-2">📄</div>
                                <p className="text-white font-medium mb-1">
                                    {selectedFile.name}
                                </p>
                                <p className="text-sm text-slate-400 mb-3">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                    disabled={isContestEnded}
                                >
                                    Change file
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="text-4xl mb-2">📁</div>
                                <p className="text-white font-medium mb-1">
                                    Drag and drop your file here
                                </p>
                                <p className="text-sm text-slate-400 mb-3">or</p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                    disabled={isContestEnded}
                                >
                                    Browse Files
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || isSubmitting || isContestEnded}
                            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Solution'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
