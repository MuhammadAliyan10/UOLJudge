import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Auth Check (Keep this to protect the route)
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  return <>{children}</>;
}
