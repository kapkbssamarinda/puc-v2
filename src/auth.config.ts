import type { NextAuthConfig } from "next-auth"

const PUBLIC_ROUTES = ["/login", "/panduan"]

// Batas sesi absolut: 1 shift kerja. Auth.js (strategi JWT) me-refresh iat/exp
// token di SETIAP request yang lewat middleware (lihat lib/actions/session.js
// di @auth/core — updateAge sama sekali tidak dibaca di jalur JWT, hanya di
// jalur database session), jadi session.maxAge saja hanya memberi sliding
// window, bukan batas absolut sejak login. Karena itu loginAt disimpan &
// ditegakkan manual di jwt() di bawah — jangan andalkan maxAge/updateAge saja.
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

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

      // Catatan: pengecekan expiresAt/8-jam TIDAK di sini — jwt() sudah
      // mengembalikan null (menghapus cookie sesi) sebelum authorized()
      // sempat jalan, jadi sesi yang kedaluwarsa sudah terlihat sebagai
      // tidak terautentikasi di titik ini.

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
        token.loginAt = Date.now()
        return token
      }

      // Kick: akun temporary (dibuat admin) sudah kadaluarsa
      if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now()) {
        return null
      }

      // Kick: sesi sudah melewati batas absolut 8 jam sejak login
      if (
        typeof token.loginAt === "number" &&
        Date.now() - token.loginAt > SESSION_MAX_AGE_SECONDS * 1000
      ) {
        return null
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
  session: { strategy: "jwt" as const, maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [],
} satisfies NextAuthConfig
