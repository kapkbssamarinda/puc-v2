import type { NextAuthConfig } from "next-auth"

const PUBLIC_ROUTES = ["/", "/login", "/panduan"]

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user
      const isPublic = PUBLIC_ROUTES.some(
        (route) =>
          nextUrl.pathname === route ||
          nextUrl.pathname.startsWith(route + "/")
      )
      if (isPublic) return true
      if (!isAuthenticated) return false

      // Kick user temporary yang sudah kadaluarsa
      const expiresAt = (auth.user as { expiresAt?: string }).expiresAt
      if (expiresAt && new Date(expiresAt) < new Date()) {
        return false
      }

      // Rute /admin/* hanya untuk role admin
      if (nextUrl.pathname.startsWith("/admin")) {
        const role = (auth.user as { role?: string }).role
        if (role !== "admin") {
          return Response.redirect(new URL("/", nextUrl))
        }
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: "auditor" | "admin" }).role
        token.expiresAt = (user as { expiresAt?: string }).expiresAt
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.expiresAt = token.expiresAt
      }
      return session
    },
  },
  session: { strategy: "jwt" as const },
  providers: [],
} satisfies NextAuthConfig
