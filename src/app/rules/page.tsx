import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/shared/ui/card";
import { Badge } from "@/features/shared/ui/badge";
import {
  AlertTriangle,
  Gavel,
  Monitor,
  ShieldAlert,
  Scale,
  Clock,
  Users,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/features/shared/ui/button";

export const metadata = {
  title: "Rules & Regulations | UOLJudge",
  description: "Contest rules and regulations for participants",
};

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Rules & Regulations
            </h1>
            <p className="text-sm text-slate-500">
              UOLJudge Programming Contest
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Critical Rules Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Critical Rules</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Cheating Policy */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Ban className="text-red-600" size={20} />
                  <CardTitle className="text-lg text-red-900">
                    Cheating Policy
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="destructive" className="mb-3">
                  Zero Tolerance
                </Badge>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Any form of cheating results in{" "}
                    <strong>immediate team suspension</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Sharing code, answers, or hints is{" "}
                    <strong>strictly prohibited</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Use of unauthorized resources (ChatGPT, external help)
                    during contest
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Plagiarism detection is <strong>actively running</strong>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Jury Decision */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Gavel className="text-amber-600" size={20} />
                  <CardTitle className="text-lg text-amber-900">
                    Jury Decision
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className="mb-3 border-amber-400 text-amber-700"
                >
                  Final Authority
                </Badge>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    All jury decisions are{" "}
                    <strong>final and non-negotiable</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    No appeals will be entertained after final verdict
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Jury has full discretion on partial scoring
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    Time penalties apply after the grace period
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Device & Technical Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">
              Technical Rules
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={18} />
                Device Usage Policy
              </CardTitle>
              <CardDescription>
                Strict limits on devices per team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">2</div>
                  <div className="text-sm text-slate-600">
                    Maximum devices per team
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    1
                  </div>
                  <div className="text-sm text-slate-600">
                    Active session at a time
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    ∞
                  </div>
                  <div className="text-sm text-slate-600">
                    Browser tabs allowed
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                * Device limit is enforced automatically. Exceeding the limit
                will block new login attempts.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submission Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">
              Submission Rules
            </h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" />
                    Timing
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Late submissions are penalized (-0.5 pts/min)</li>
                    <li>• Grace period: First 30 minutes</li>
                    <li>• Minimum score floor: 50% of max points</li>
                    <li>• No submissions after contest ends</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-slate-500" />
                    File Requirements
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Core: Single source file (.cpp, .py, .java)</li>
                    <li>• Web: ZIP archive with project files</li>
                    <li>• Android: APK or ZIP archive</li>
                    <li>• Max file size: 10MB</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fair Play Notice */}
        <Card className="border-slate-300 bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-slate-600">
              By participating in this contest, you agree to abide by all rules
              and regulations. Violations will result in disqualification.
              <br />
              <strong className="text-slate-900">
                Play fair. Code hard. Good luck!
              </strong>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
