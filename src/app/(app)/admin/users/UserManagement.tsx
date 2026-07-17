"use client"

import { useEffect, useId, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus, Pencil, Trash2, X, AlertCircle, ShieldCheck, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { useFocusTrap } from "@/lib/useFocusTrap"

export interface UserRecord {
  id: string
  name: string
  email: string
  role: "auditor" | "admin"
  createdAt?: string
  expiresAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSisaWaktu(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "Kadaluarsa"
  const totalMinutes = Math.floor(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return `${days} hari ${remHours} jam lagi`
  }
  return `${hours} jam ${minutes} menit lagi`
}

function formatTanggalExpiry(expiresAt: string): string {
  return new Date(expiresAt).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const DURATION_OPTIONS = [
  { label: "Tidak ada batas (permanent)", value: "0" },
  { label: "1 jam", value: "1" },
  { label: "2 jam", value: "2" },
  { label: "4 jam", value: "4" },
  { label: "8 jam", value: "8" },
  { label: "24 jam (1 hari)", value: "24" },
  { label: "3 hari", value: "72" },
  { label: "7 hari", value: "168" },
]

// ─── Schemas ─────────────────────────────────────────────────────────────────

const addSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["auditor", "admin"]),
  durationHours: z.string(),
})

const editSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").or(z.literal("")),
  role: z.enum(["auditor", "admin"]),
  durationHours: z.string(),
})

type AddFormValues = z.infer<typeof addSchema>
type EditFormValues = z.infer<typeof editSchema>

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (user: UserRecord) => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { role: "auditor", durationHours: "0" },
  })

  async function onSubmit(values: AddFormValues) {
    setServerError(null)
    const durationHours = parseInt(values.durationHours, 10)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        durationHours: durationHours > 0 ? durationHours : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? "Terjadi kesalahan")
      return
    }
    onCreated(data)
  }

  return (
    <Modal title="Tambah User" onClose={onClose}>
      {serverError && <ErrorBanner message={serverError} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Nama"
          placeholder="John Doe"
          required
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="user@kap.co.id"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <Select label="Role" required error={errors.role?.message} {...register("role")}>
          <option value="auditor">Auditor</option>
          <option value="admin">Admin</option>
        </Select>
        <Select
          label="Batas Waktu Akses"
          helperText="User temporary otomatis terhapus setelah waktu habis."
          {...register("durationHours")}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <UserPlus className="w-4 h-4" />
            Tambah User
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  user,
  onClose,
  onUpdated,
}: {
  user: UserRecord
  onClose: () => void
  onUpdated: (user: UserRecord) => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      durationHours: "-1",  // -1 = tidak ubah
    },
  })

  async function onSubmit(values: EditFormValues) {
    setServerError(null)
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      role: values.role,
    }
    if (values.password) payload.password = values.password

    const duration = parseInt(values.durationHours, 10)
    if (duration >= 0) payload.durationHours = duration  // 0 = hapus batas

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? "Terjadi kesalahan")
      return
    }
    onUpdated(data)
  }

  return (
    <Modal title="Edit User" onClose={onClose}>
      {serverError && <ErrorBanner message={serverError} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Nama"
          required
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password Baru"
          type="password"
          placeholder="Kosongkan jika tidak ingin mengubah"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select label="Role" required error={errors.role?.message} {...register("role")}>
          <option value="auditor">Auditor</option>
          <option value="admin">Admin</option>
        </Select>
        <Select
          label="Ubah Batas Waktu"
          helperText={
            user.expiresAt
              ? `Saat ini: kadaluarsa ${formatTanggalExpiry(user.expiresAt)}`
              : "Saat ini: permanent (tidak ada batas)"
          }
          {...register("durationHours")}
        >
          <option value="-1">— Tidak ubah —</option>
          <option value="0">Hapus batas (jadikan permanent)</option>
          {DURATION_OPTIONS.slice(1).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} (dari sekarang)
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Pencil className="w-4 h-4" />
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  user,
  onClose,
  onDeleted,
}: {
  user: UserRecord
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setServerError(null)
    setLoading(true)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setServerError(data.error ?? "Terjadi kesalahan")
      return
    }
    onDeleted(user.id)
  }

  return (
    <Modal title="Hapus User" onClose={onClose}>
      {serverError && <ErrorBanner message={serverError} />}
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-700">
            Anda akan menghapus akun <span className="font-semibold">{user.name}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{user.email}</p>
          <p className="text-xs text-red-600 mt-3">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button variant="destructive" loading={loading} onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
          Hapus
        </Button>
      </div>
    </Modal>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const titleId = useId()
  const trapRef = useFocusTrap(onClose)

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-primary-900/45"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 id={titleId} className="font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="relative p-1 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors before:absolute before:-inset-3 before:content-['']"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 text-sm text-red-700">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      {message}
    </div>
  )
}

function RoleBadge({ role }: { role: "auditor" | "admin" }) {
  return role === "admin" ? (
    <Badge variant="info" className="inline-flex items-center gap-1">
      <ShieldCheck className="w-3 h-3" />
      Admin
    </Badge>
  ) : (
    <Badge variant="default" className="inline-flex items-center gap-1">
      <User className="w-3 h-3" />
      Auditor
    </Badge>
  )
}

function ExpiryCell({ expiresAt }: { expiresAt?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!expiresAt) return <span className="text-gray-500">—</span>

  // Hitung status kadaluarsa hanya setelah mount di client — Date.now() saat SSR
  // dan saat hydration bisa berbeda beberapa detik dan memicu mismatch.
  if (!mounted) return <span className="text-gray-500 text-xs">{formatTanggalExpiry(expiresAt)}</span>

  const isExpired = new Date(expiresAt) < new Date()
  if (isExpired) {
    return (
      <Badge variant="warning" className="inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Kadaluarsa
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
        <Clock className="w-3 h-3" />
        {formatSisaWaktu(expiresAt)}
      </span>
      <span className="text-gray-500 text-xs">{formatTanggalExpiry(expiresAt)}</span>
    </div>
  )
}

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; user: UserRecord }
  | { type: "delete"; user: UserRecord }

export default function UserManagement({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRecord[]
  currentUserId: string
}) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [modal, setModal] = useState<ModalState>({ type: "none" })

  function handleCreated(user: UserRecord) {
    setUsers((prev) => [user, ...prev])
    setModal({ type: "none" })
  }

  function handleUpdated(updated: UserRecord) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    setModal({ type: "none" })
  }

  function handleDeleted(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setModal({ type: "none" })
  }

  const tempCount = users.filter((u) => !!u.expiresAt).length

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{users.length} user terdaftar</p>
          {tempCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
              <Clock className="w-3 h-3" />
              {tempCount} temporary
            </span>
          )}
        </div>
        <Button onClick={() => setModal({ type: "add" })}>
          <UserPlus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Terdaftar</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Kadaluarsa</th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Belum ada user terdaftar.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs text-gray-500">(Anda)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <ExpiryCell expiresAt={user.expiresAt} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ type: "edit", user })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-secondary border border-secondary/30 hover:bg-secondary/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", user })}
                        disabled={user.id === currentUserId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal.type === "add" && (
        <AddModal onClose={() => setModal({ type: "none" })} onCreated={handleCreated} />
      )}
      {modal.type === "edit" && (
        <EditModal
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onUpdated={handleUpdated}
        />
      )}
      {modal.type === "delete" && (
        <DeleteModal
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
