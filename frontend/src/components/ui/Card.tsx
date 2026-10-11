import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function Card({ title, action, className = '', children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-black/5 bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-2">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
