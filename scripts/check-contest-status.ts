import { db } from "@/lib/db";

async function main() {
    const user = await db.user.findFirst({
        where: { email: "aliyan@example.com" }, // Assuming this is the user, or I'll list all
        include: { team_profile: true }
    });

    if (!user || !user.team_profile) {
        console.log("User or team profile not found");
        // List all team profiles to find one
        const profiles = await db.teamProfile.findMany({ take: 1 });
        console.log("First profile:", profiles[0]);
        return;
    }

    const contestId = user.team_profile.assigned_contest_id;
    if (!contestId) {
        console.log("No contest assigned");
        return;
    }

    const contest = await db.contest.findUnique({
        where: { id: contestId }
    });

    console.log("Contest:", contest);
    console.log("Current Time:", new Date());
    if (contest) {
        console.log("Has Ended?", new Date() > contest.endTime);
    }
}

main();
