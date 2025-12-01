import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET() {
    try {
        const contests = await prisma.contest.findMany({
            select: {
                id: true,
                name: true,
                startTime: true,
            },
            orderBy: { startTime: "desc" },
        });

        // CRITICAL FIX: Serialize Date objects to ISO strings
        // Next.js cannot properly serialize Prisma Date objects in all cases
        const serializedContests = contests.map(contest => ({
            id: contest.id,
            name: contest.name,
            startTime: contest.startTime.toISOString(),
        }));

        return NextResponse.json(serializedContests);
    } catch (error) {
        console.error("Error fetching contests:", error);
        return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }
}
