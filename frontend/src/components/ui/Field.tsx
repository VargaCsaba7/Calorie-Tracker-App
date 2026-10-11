import { useId, type InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean
}

export function Field({ label, hideLabel = false, id, className = '', ...props }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'mb-1 block text-xs font-medium text-slate-600'}
      >
        {label}
      </label>
      <input
        id={inputId}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        {...props}
      />
    </div>
  )
}
