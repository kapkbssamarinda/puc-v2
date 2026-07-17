"use client"

import { createContext, useContext, useId, useState, type HTMLAttributes, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (v: string) => void
  idBase: string
}
const TabsContext = createContext<TabsContextValue>({ activeTab: '', setActiveTab: () => {}, idBase: '' })

// id aman untuk atribut HTML: value tab bisa mengandung spasi/karakter khusus
function slug(v: string) {
  return v.replace(/[^a-zA-Z0-9_-]/g, '-')
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (v: string) => void
}

function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const idBase = useId()
  const active = value ?? internal
  const set = (v: string) => { setInternal(v); onValueChange?.(v) }
  return (
    <TabsContext.Provider value={{ activeTab: active, setActiveTab: set, idBase }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    )
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (current === -1) return
    e.preventDefault()
    let next = current
    if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    tabs[next].focus()
    tabs[next].click()
  }

  return (
    <div
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center rounded-lg bg-gray-100 p-1 gap-1',
        className,
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}
function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { activeTab, setActiveTab, idBase } = useContext(TabsContext)
  const active = activeTab === value
  return (
    <button
      type="button"
      role="tab"
      id={`${idBase}-tab-${slug(value)}`}
      aria-selected={active}
      aria-controls={`${idBase}-panel-${slug(value)}`}
      tabIndex={active ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}
function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { activeTab, idBase } = useContext(TabsContext)
  if (activeTab !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${slug(value)}`}
      aria-labelledby={`${idBase}-tab-${slug(value)}`}
      tabIndex={0}
      className={cn('mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-md', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
