import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import { ConfirmContext, type ConfirmOptions } from './ConfirmContext'

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

/**
 * App-wide confirm dialog, replacing window.confirm. Uses the native <dialog>
 * element, which traps focus and closes on Escape.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  )

  useEffect(() => {
    if (pending && !dialogRef.current?.open) dialogRef.current?.showModal()
  }, [pending])

  function finish(confirmed: boolean) {
    pending?.resolve(confirmed)
    dialogRef.current?.close()
    setPending(null)
  }

  return (
    <ConfirmContext value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        className="m-auto w-[min(92vw,420px)] rounded-2xl bg-white p-0 text-brand-600 shadow-2xl backdrop:bg-rubber/60"
        onCancel={(e) => {
          e.preventDefault()
          finish(false)
        }}
        // A click on the backdrop lands on the <dialog> itself
        onClick={(e) => e.target === e.currentTarget && finish(false)}
      >
        {pending && (
          <div className="p-6">
            <h2 id="confirm-title" className="text-2xl font-bold">
              {pending.title}
            </h2>
            {pending.message && <p className="mt-2 text-brand-500">{pending.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" autoFocus onClick={() => finish(false)}>
                Cancel
              </Button>
              <Button variant={pending.tone === 'danger' ? 'destructive' : 'primary'} onClick={() => finish(true)}>
                {pending.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext>
  )
}
