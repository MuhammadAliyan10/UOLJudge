"use client";

import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/features/shared/ui/button";
import Link from "next/link";

interface ContestEndedProps {
  contestId?: string;
}

export default function ContestEnded({ contestId }: ContestEndedProps) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center px-4 z-50">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center space-y-8">
          {/* Trophy Icon */}
          <div className="mx-auto w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 uppercase tracking-wider">
                Competition Complete
              </span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Contest Has Ended
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Thank you for participating! Check the final leaderboard to see
              how you ranked against other participants.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">🏆</div>
              <div className="text-xs text-slate-500 mt-1">Results Ready</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">📊</div>
              <div className="text-xs text-slate-500 mt-1">Final Scores</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-primary">🎯</div>
              <div className="text-xs text-slate-500 mt-1">Rankings</div>
            </div>
          </div>

          {/* CTA Button */}
          {contestId && (
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-medium shadow-lg"
              asChild
            >
              <Link
                href={`/leaderboard/${contestId}`}
                target="_blank"
                className="gap-2"
              >
                View Final Leaderboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Quote */}
          <p className="text-slate-400 text-xs italic">
            "Success is not final, failure is not fatal: it is the courage to
            continue that counts."
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          UOLJudge • Programming Contest Platform
        </p>
      </div>
    </div>
  );
}
