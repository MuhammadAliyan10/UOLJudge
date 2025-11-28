// prisma/seed.ts
import { PrismaClient, UserRole, Category } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({}) // Instantiate locally. Do not import from src/lib/db

async function main() {
    console.log('🌱 Starting Seed...')

    // 1. Create Global Admin
    const adminPassword = await bcrypt.hash('uol0512', 10)

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password_hash: adminPassword,
            role: UserRole.ADMIN,
        }
    })
    console.log('✅ Admin Created')

    // 2. Create Contests
    const contestsData = [
        { name: 'Core Speed Run', cat: Category.CORE },
        { name: 'Web Warfare', cat: Category.WEB },
        { name: 'Android Sprint', cat: Category.ANDROID },
    ]

    for (const c of contestsData) {
        await prisma.contest.create({
            data: {
                name: c.name,
                start_time: new Date(),
                end_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
                config: {},
                problems: {
                    create: {
                        title: `${c.name} - Problem 1`,
                        description: `This is a sample problem for ${c.cat}.`,
                        category: c.cat,
                        points: 100,
                        assets_path: '/files/sample.txt'
                    }
                }
            }
        })
    }
    console.log('✅ Contests Created')

    // 3. Create Teams
    const teams = [
        { user: 'team_core', name: 'Alpha Coders', cat: Category.CORE },
        { user: 'team_web', name: 'Pixel Perfect', cat: Category.WEB },
        { user: 'team_android', name: 'Droid Squad', cat: Category.ANDROID },
    ]

    const password = await bcrypt.hash('code123', 10)

    for (const t of teams) {
        await prisma.user.create({
            data: {
                username: t.user,
                password_hash: password,
                role: UserRole.PARTICIPANT,
                team_profile: {
                    create: {
                        display_name: t.name,
                        category: t.cat,
                        members: ["Member A", "Member B"],
                        lab_location: "Lab 1"
                    }
                }
            }
        })
    }
    console.log('✅ Teams Created')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })