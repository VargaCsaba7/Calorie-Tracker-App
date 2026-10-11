import { createContext } from 'react'

export interface ConfirmOptions {
  title: string
  message?: string
  /** Says exactly what happens, e.g. "Delete meal" */
  confirmLabel: string
  tone?: 'danger' | 'default'
}

/** Opens the confirm dialog; resolves to true if the user confirmed. */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<ConfirmFn | null>(null)
