/**
 * Seed initial users into Upstash Redis.
 * Run with: npm run seed
 *
 * Edit USERS_TO_SEED below, then run again — existing users are skipped.
 * CHANGE PASSWORDS before running in production.
 */
import { Redis } from "@upstash/redis"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { config } from "dotenv"

config({ path: ".env.local" })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface UserSeed {
  name: string
  email: string
  password: string
  role: "auditor" | "admin"
}

const USERS_TO_SEED: UserSeed[] = [
  {
    name: "Admin1",
    email: "admin@kap.co.id",
    password: "adminkap123",
    role: "admin",
  },
  {
    name: "Auditor1",
    email: "auditor1@kap.co.id",
    password: "auditor123",
    role: "auditor",
  },
]

async function seedUsers() {
  console.log("Seeding users into Upstash Redis...\n")

  for (const user of USERS_TO_SEED) {
    const existingId = await redis.get<string>(`user:email:${user.email}`)
    if (existingId) {
      console.log(`  SKIP    ${user.email} (sudah ada, id=${existingId})`)
      continue
    }

    const id = randomUUID()
    const hashedPassword = await bcrypt.hash(user.password, 12)

    await redis.set(
      `user:${id}`,
      JSON.stringify({
        id,
        name: user.name,
        email: user.email,
        hashedPassword,
        role: user.role,
        createdAt: new Date().toISOString(),
      })
    )

    await redis.set(`user:email:${user.email}`, id)

    console.log(`  CREATED ${user.email} (id=${id}, role=${user.role})`)
  }

  console.log("\nSelesai.")
  process.exit(0)
}

seedUsers().catch((e) => {
  console.error("Seed gagal:", e)
  process.exit(1)
})
