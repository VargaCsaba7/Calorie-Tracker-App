import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const WIDTHS = { md: 'w-[min(94vw,520px)]', lg: 'w-[min(94vw,760px)]', xl: 'w-[min(96vw,1100px)]' }

/** Native <dialog>: traps focus, closes on Escape and on a click outside. */
export function Modal({ open, onClose, title, children, size = 'lg' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto max-h-[92vh] ${WIDTHS[size]} overflow-hidden rounded-2xl bg-white p-0 text-brand-600 shadow-2xl backdrop:bg-rubber/60`}
    >
      {open && (
        <div className="flex max-h-[92vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
            <h2 className="truncate text-2xl font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xl hover:bg-black/10"
            >
              ×
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  )
}
