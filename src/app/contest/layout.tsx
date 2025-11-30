import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already protects this route
  // During revalidation, session might transiently be null - don't redirect in that case
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    console.warn("Session missing in contest layout - this may indicate a revalidation issue");
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-yellow-200 rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Issue</h2>
          <p className="text-slate-600 mb-6">
            Please refresh the page or{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              log in again
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
