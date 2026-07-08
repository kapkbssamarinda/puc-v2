import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis, type RedisUser } from "@/lib/redis"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { z } from "zod"

async function listAllUsers(): Promise<RedisUser[]> {
  const allKeys = await redis.keys("user:*")
  const userKeys = allKeys.filter((k) => !k.includes(":email:"))
  if (userKeys.length === 0) return []
  const results = await redis.mget<(RedisUser | null)[]>(...userKeys)
  return results.filter((u): u is RedisUser => u !== null)
}

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await listAllUsers()
  const publicUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    expiresAt: u.expiresAt,
  }))
  return NextResponse.json(publicUsers)
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["auditor", "admin"]),
  durationHours: z.number().min(0).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, password, role, durationHours } = parsed.data

  const existingId = await redis.get<string>(`user:email:${email}`)
  if (existingId) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 })
  }

  const id = randomUUID()
  const hashedPassword = await bcrypt.hash(password, 12)
  const now = new Date()

  const expiresAt =
    durationHours && durationHours > 0
      ? new Date(now.getTime() + durationHours * 3600 * 1000).toISOString()
      : undefined

  const user: RedisUser = {
    id,
    name,
    email,
    hashedPassword,
    role,
    createdAt: now.toISOString(),
    expiresAt,
  }

  await redis.set(`user:${id}`, JSON.stringify(user))
  await redis.set(`user:email:${email}`, id)

  if (expiresAt && durationHours) {
    const ttl = Math.ceil(durationHours * 3600)
    await redis.expire(`user:${id}`, ttl)
    await redis.expire(`user:email:${email}`, ttl)
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    expiresAt: user.expiresAt,
  }
  return NextResponse.json(publicUser, { status: 201 })
}
