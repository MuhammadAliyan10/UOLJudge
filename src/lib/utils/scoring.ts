/**
 * Hybrid Scoring System - Time-Based Penalty Calculation Engine
 * 
 * This module calculates recommended penalty deductions for late submissions
 * based on contest-specific scoring configurations.
 * 
 * Key Features:
 * - Safe Zone: Grace period with no penalties
 * - Dynamic Penalty Rate: Configurable points per minute
 * - Floor Protection: Score cannot drop below minimum percentage
 * - Problem-Specific: Uses actual problem.points (not hardcoded 100)
 */

export interface ContestScoringConfig {
    safeZoneMinutes: number;  // Grace period before penalties apply
    penaltyRate: number;       // Points deducted per minute late
    minScorePercent: number;   // Floor: minimum score as % of max (e.g., 50)
}

export interface PenaltySuggestion {
    penalty: number;           // Recommended points to deduct
    overtimeMinutes: number;   // Minutes past safe zone
    isLate: boolean;           // Whether submission is late
    reason: string;            // Human-readable explanation
    maxPossibleScore: number;  // Max score after penalty (maxPoints - penalty)
    floorScore: number;        // Minimum score based on config
}

/**
 * Calculate suggested penalty for a late submission
 * 
 * @param submissionDate - When the submission was made
 * @param contestStart - When the contest started
 * @param config - Contest scoring configuration
 * @param maxPoints - Maximum points for this problem (from problem.points)
 * @returns PenaltySuggestion object with penalty details
 * 
 * @example
 * const penalty = calculateSuggestedPenalty(
 *   new Date('2024-01-01T10:45:00'),  // Submitted at 10:45
 *   new Date('2024-01-01T10:00:00'),  // Contest started at 10:00
 *   { safeZoneMinutes: 30, penaltyRate: 0.5, minScorePercent: 50 },
 *   20  // This problem is worth 20 points
 * );
 * // Result: { penalty: 7.5, overtimeMinutes: 15, isLate: true, ... }
 */
export function calculateSuggestedPenalty(
    submissionDate: Date,
    contestStart: Date,
    config: ContestScoringConfig,
    maxPoints: number
): PenaltySuggestion {
    // Calculate elapsed time in minutes
    const elapsedMs = submissionDate.getTime() - contestStart.getTime();
    const elapsedMinutes = elapsedMs / 60000;

    // Safe Zone Check: No penalty if within grace period
    if (elapsedMinutes <= config.safeZoneMinutes) {
        return {
            penalty: 0,
            overtimeMinutes: 0,
            isLate: false,
            reason: `Within safe zone (${config.safeZoneMinutes} minutes)`,
            maxPossibleScore: maxPoints,
            floorScore: Math.floor(maxPoints * (config.minScorePercent / 100)),
        };
    }

    // Calculate overtime (minutes past safe zone)
    const overtimeMinutes = elapsedMinutes - config.safeZoneMinutes;

    // Calculate raw deduction based on penalty rate
    const rawDeduction = overtimeMinutes * config.penaltyRate;

    // Calculate floor score (minimum allowed score)
    const floorScore = Math.floor(maxPoints * (config.minScorePercent / 100));

    // Calculate maximum deductible points (cannot go below floor)
    const maxDeductible = maxPoints - floorScore;

    // Apply floor cap: final penalty cannot exceed maxDeductible
    const finalPenalty = Math.min(rawDeduction, maxDeductible);

    // Round to 1 decimal place for cleaner display
    const roundedPenalty = Math.round(finalPenalty * 10) / 10;

    return {
        penalty: roundedPenalty,
        overtimeMinutes: Math.round(overtimeMinutes),
        isLate: true,
        reason: `Late by ${Math.round(overtimeMinutes)} minutes (${config.penaltyRate} pts/min after ${config.safeZoneMinutes}m safe zone)`,
        maxPossibleScore: Math.max(maxPoints - roundedPenalty, floorScore),
        floorScore,
    };
}

/**
 * Format penalty suggestion for display to jury
 * 
 * @param suggestion - Penalty suggestion object
 * @param maxPoints - Maximum points for the problem
 * @returns Formatted string for UI display
 */
export function formatPenaltySuggestion(
    suggestion: PenaltySuggestion,
    maxPoints: number
): string {
    if (!suggestion.isLate) {
        return suggestion.reason;
    }

    return `Late by ${suggestion.overtimeMinutes} minutes. Recommended deduction: -${suggestion.penalty} points. Max possible score: ${suggestion.maxPossibleScore}/${maxPoints}`;
}

/**
 * Validate that a manual score is within acceptable bounds
 * 
 * @param manualScore - Score entered by jury
 * @param maxPoints - Maximum points for the problem
 * @returns Object with isValid flag and error message if invalid
 */
export function validateManualScore(
    manualScore: number,
    maxPoints: number
): { isValid: boolean; error?: string } {
    if (manualScore < 0) {
        return {
            isValid: false,
            error: "Score cannot be negative",
        };
    }

    if (manualScore > maxPoints) {
        return {
            isValid: false,
            error: `Score cannot exceed problem value of ${maxPoints} points`,
        };
    }

    return { isValid: true };
}

/**
 * Get difficulty badge color for UI
 * 
 * @param difficulty - Problem difficulty level
 * @returns Tailwind color classes for badge
 */
export function getDifficultyColor(
    difficulty: "EASY" | "MEDIUM" | "HARD"
): {
    badge: string;
    text: string;
    bg: string;
} {
    switch (difficulty) {
        case "EASY":
            return {
                badge: "secondary",
                text: "text-green-700",
                bg: "bg-green-50 border-green-200",
            };
        case "MEDIUM":
            return {
                badge: "default",
                text: "text-yellow-700",
                bg: "bg-yellow-50 border-yellow-200",
            };
        case "HARD":
            return {
                badge: "destructive",
                text: "text-red-700",
                bg: "bg-red-50 border-red-200",
            };
    }
}
