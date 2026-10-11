/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API base URL. Leave unset in dev to use the Vite proxy. */
  readonly VITE_API_URL?: string
}
