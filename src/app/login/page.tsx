import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import LoginForm from "./LoginForm"

export const metadata: Metadata = {
  title: "Masuk",
  description: "Login ke PUC Kalkulator",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  if (session) redirect(params.callbackUrl ?? "/kalkulator")

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 bg-surface">
      <LoginForm callbackUrl={params.callbackUrl} error={params.error} />
    </div>
  )
}
