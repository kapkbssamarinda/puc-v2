import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface RedisUser {
  id: string
  name: string
  email: string
  hashedPassword: string
  role: "auditor" | "admin"
  createdAt?: string
  expiresAt?: string  // ISO timestamp; undefined = permanent
}

export type PublicUser = Omit<RedisUser, "hashedPassword">
