import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, action, className = '', children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
