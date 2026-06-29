import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { redis, type RedisUser } from "@/lib/redis"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["auditor", "admin"]).optional(),
  // 0 = hapus batas (permanent), >0 = set TTL baru dari sekarang, undefined = tidak ubah
  durationHours: z.number().min(0).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params
  const existing = await redis.get<RedisUser>(`user:${id}`)
  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, email, password, role, durationHours } = parsed.data

  if (email && email !== existing.email) {
    const taken = await redis.get<string>(`user:email:${email}`)
    if (taken && taken !== id) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 })
    }
    await redis.del(`user:email:${existing.email}`)
    await redis.set(`user:email:${email}`, id)
  }

  // Hitung expiresAt baru
  let expiresAt = existing.expiresAt
  if (durationHours !== undefined) {
    if (durationHours === 0) {
      expiresAt = undefined  // hapus batas → permanent
    } else {
      expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString()
    }
  }

  const updated: RedisUser = {
    ...existing,
    name: name ?? existing.name,
    email: email ?? existing.email,
    role: role ?? existing.role,
    expiresAt,
    hashedPassword: password
      ? await bcrypt.hash(password, 12)
      : existing.hashedPassword,
  }

  await redis.set(`user:${id}`, JSON.stringify(updated))

  const targetEmail = email ?? existing.email

  // Update TTL
  if (durationHours !== undefined) {
    if (durationHours === 0) {
      // Hapus TTL → jadikan permanent
      await redis.persist(`user:${id}`)
      await redis.persist(`user:email:${targetEmail}`)
    } else {
      const ttl = Math.ceil(durationHours * 3600)
      await redis.expire(`user:${id}`, ttl)
      await redis.expire(`user:email:${targetEmail}`, ttl)
    }
  }

  const { hashedPassword: _hp, ...publicUser } = updated
  return NextResponse.json(publicUser)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = params

  if (session.user.id === id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 })
  }

  const existing = await redis.get<RedisUser>(`user:${id}`)
  if (!existing) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }

  await redis.del(`user:${id}`)
  await redis.del(`user:email:${existing.email}`)

  return NextResponse.json({ success: true })
}
