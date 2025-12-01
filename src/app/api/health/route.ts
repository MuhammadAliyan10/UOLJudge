import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Simple query to check DB connection
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: "ok" }, { status: 200 });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
