"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LogIn, Lock, Mail, Calculator, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card"

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email atau password salah. Silakan coba lagi.",
  Default: "Terjadi kesalahan. Silakan coba lagi.",
}

interface LoginFormProps {
  callbackUrl?: string
  error?: string
}

export default function LoginForm({ callbackUrl, error: initialError }: LoginFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(
    initialError ? (ERROR_MESSAGES[initialError] ?? ERROR_MESSAGES.Default) : null
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default)
      return
    }

    router.push(callbackUrl ?? "/kalkulator")
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-lg mb-4">
          <Calculator className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">PUC Kalkulator</h1>
        <p className="text-sm text-gray-500 mt-1">Imbalan Pasca Kerja · SAK EP / PSAK 24</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Masuk ke Akun</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="auditor@kap.co.id"
              prefix={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              prefix={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register("password")}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              loading={isSubmitting}
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-gray-500 mt-6 space-y-1">
        <p>Akses terbatas untuk auditor KAP yang terdaftar.</p>
        <p>
          Silahkan hubungi nomor WhatsApp berikut untuk mendapatkan akses{" "}
          <a
            href="https://wa.me/6287881331743"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline font-medium"
          >
            +62 878-8133-1743
          </a>
        </p>
      </div>
    </div>
  )
}
