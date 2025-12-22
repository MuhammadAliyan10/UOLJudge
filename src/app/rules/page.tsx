"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import { Separator } from "@/features/shared/ui/separator";
import {
  AlertTriangle,
  Gavel,
  Monitor,
  ShieldAlert,
  Scale,
  Clock,
  User,
  Ban,
  CheckCircle,
  FileCode,
  Trophy,
} from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Rules & Regulations
              </h1>
              <p className="text-sm text-slate-500">
                UOLJudge Programming Contest
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Critical Rules Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
              <ShieldAlert className="text-red-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Critical Rules</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Cheating Policy */}
            <Card className="border-red-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <Ban className="text-red-600" size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      Cheating Policy
                    </CardTitle>
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Zero Tolerance
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">1</span>
                    </div>
                    <span>
                      Any form of cheating results in{" "}
                      <strong className="text-red-700">
                        immediate disqualification
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">2</span>
                    </div>
                    <span>
                      Sharing code, answers, or hints is{" "}
                      <strong className="text-red-700">
                        strictly prohibited
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">3</span>
                    </div>
                    <span>
                      Use of AI tools (ChatGPT, Copilot) is prohibited during
                      the contest
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-600 text-xs font-bold">4</span>
                    </div>
                    <span>
                      Plagiarism detection is{" "}
                      <strong className="text-red-700">actively running</strong>
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Jury Decision */}
            <Card className="border-amber-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Gavel className="text-amber-600" size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      Jury Decision
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs border-amber-300 text-amber-700 bg-amber-50"
                    >
                      Final Authority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      All jury decisions are{" "}
                      <strong className="text-amber-700">
                        final and binding
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>No appeals after final verdict</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Jury has full discretion on partial scoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Time penalties apply after the grace period</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-slate-100" />

        {/* Participant Rules */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="text-primary" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Participant Guidelines
            </h2>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor size={18} className="text-primary" />
                Individual Participation
              </CardTitle>
              <CardDescription>
                This is a solo competition - each participant works
                independently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    1
                  </div>
                  <div className="text-sm text-slate-500">
                    Participant per account
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <Monitor className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    1
                  </div>
                  <div className="text-sm text-slate-500">Device allowed</div>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    ∞
                  </div>
                  <div className="text-sm text-slate-500">
                    Problems to solve
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-5 text-center">
                * Device limit is enforced automatically. Exceeding the limit
                will block login attempts.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-slate-100" />

        {/* Submission Rules */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileCode className="text-purple-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Submission Rules
            </h2>
          </div>

          <Card className="border-slate-100 bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Clock size={16} className="text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Timing</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600 ml-10">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Late submissions are penalized (-0.5 pts/min)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Grace period: First 30 minutes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Minimum score floor: 50% of max points
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      No submissions after contest ends
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">
                      File Requirements
                    </h3>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600 ml-10">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Core: Single source file (.cpp, .py, .java)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Web: ZIP archive with project files
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Android: APK or ZIP archive
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Maximum file size: 10MB
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Fair Play Notice */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-8">
            <p className="text-center text-sm text-slate-600">
              By participating in this contest, you agree to abide by all rules
              and regulations.
              <br />
              <span className="text-slate-400">
                Violations will result in disqualification.
              </span>
            </p>
            <p className="text-center text-lg font-bold text-primary mt-4">
              Play fair. Code hard. Good luck! 🚀
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
