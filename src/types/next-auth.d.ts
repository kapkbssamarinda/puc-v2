import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: "auditor" | "admin"
      expiresAt?: string
    }
  }

  interface User {
    role?: "auditor" | "admin"
    expiresAt?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "auditor" | "admin"
    expiresAt?: string
    loginAt?: number
  }
}
