import { useId, useState, type ReactNode } from 'react'

interface CollapsibleProps {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}

/** A card that opens on click. Content mounts on first open, so its data loads only when needed. */
export function Collapsible({ title, subtitle, defaultOpen = false, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <section className="rounded-2xl border border-black/5 bg-white">
      <h2>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left hover:bg-black/[0.02] focus-visible:outline-2 focus-visible:outline-plate-blue"
        >
          <span>
            <span className="block text-2xl font-bold">{title}</span>
            {subtitle && (
              <span className="block font-sans text-sm font-normal tracking-normal text-brand-500">{subtitle}</span>
            )}
          </span>
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`size-6 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </h2>
      {isOpen && (
        <div id={contentId} className="border-t border-black/5 p-5">
          {children}
        </div>
      )}
    </section>
  )
}
