import { auth } from "@/auth"
import { redis, type RedisUser } from "@/lib/redis"
import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import UserManagement from "./UserManagement"

export const metadata: Metadata = {
  title: "Manajemen User",
}

async function getAllUsers() {
  const allKeys = await redis.keys("user:*")
  const userKeys = allKeys.filter((k) => !k.includes(":email:"))
  if (userKeys.length === 0) return []
  const results = await redis.mget<(RedisUser | null)[]>(...userKeys)
  return results
    .filter((u): u is RedisUser => u !== null)
    .map(({ hashedPassword: _hp, ...u }) => u)
    .sort((a, b) => {
      // admin dulu, lalu urut nama
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1
      return a.name.localeCompare(b.name, "id")
    })
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/")

  const users = await getAllUsers()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
        </div>
        <p className="text-sm text-gray-500">
          Kelola akun auditor dan admin yang dapat mengakses PUC Kalkulator.
        </p>
      </div>

      <UserManagement initialUsers={users} currentUserId={session.user.id} />
    </div>
  )
}
