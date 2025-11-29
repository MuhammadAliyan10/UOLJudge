import { db } from "@/lib/db";

async function main() {
    const user = await db.user.findFirst({
        where: { username: "admin" },
    });

    console.log("User found:", user);

    const contest = await db.contest.findFirst();

    console.log("Contest:", contest);
    console.log("Current Time:", new Date());
    if (contest) {
        console.log("Has Ended?", new Date() > contest.endTime);
    }
}

main();
