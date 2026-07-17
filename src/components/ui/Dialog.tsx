"use client"

import { type ReactNode, useId } from 'react'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { cn } from '@/lib/utils'

interface DialogProps {
  onClose: () => void
  /** Class tambahan untuk kartu dialog (mis. max-w-sm, padding). */
  className?: string
  /** Isi dialog; bentuk fungsi menerima titleId untuk dipasang di judul. */
  children: ReactNode | ((titleId: string) => ReactNode)
}

/**
 * Shell modal bersama: backdrop gelap, focus trap (Esc + klik luar menutup),
 * dan atribut ARIA dialog. Isi kartu sepenuhnya milik pemanggil.
 */
export function Dialog({ onClose, className, children }: DialogProps) {
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
        className={cn('bg-white rounded-2xl shadow-2xl w-full outline-none', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {typeof children === 'function' ? children(titleId) : children}
      </div>
    </div>
  )
}
