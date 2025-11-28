import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSystemSettings() {
    console.log("Seeding SystemSettings...");

    // Create default system thresholds
    const settings = [
        {
            key: "RAM_LIMIT_MB",
            value: "16000",
            description: "Maximum RAM threshold in MB for monitoring (default: 16GB)",
        },
        {
            key: "CPU_WARNING_THRESHOLD",
            value: "70",
            description: "CPU usage percentage that triggers warning state",
        },
        {
            key: "NETWORK_SPEED_LIMIT_MBPS",
            value: "100",
            description: "Network speed limit in Mbps for percentage calculation (default: 100 Mbps)",
        },
        {
            key: "DISK_WARNING_THRESHOLD",
            value: "70",
            description: "Disk usage percentage that triggers warning state",
        },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {
                value: setting.value,
                description: setting.description,
            },
            create: setting,
        });
        console.log(`✓ Created/Updated setting: ${setting.key} = ${setting.value}`);
    }

    console.log("\n✓ System settings seeded successfully!");
}

seedSystemSettings()
    .catch((error) => {
        console.error("Error seeding system settings:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
