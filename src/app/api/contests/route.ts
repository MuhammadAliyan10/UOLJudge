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

        return NextResponse.json(contests);
    } catch (error) {
        console.error("Error fetching contests:", error);
        return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }
}
