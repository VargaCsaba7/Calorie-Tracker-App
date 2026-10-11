import axios from 'axios'

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

/** Turns an API error into a message that can be shown to the user. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server'
    }
    const detail = error.response.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    // FastAPI validation errors: [{ loc: ['body', 'calories'], msg: '...' }, ...]
    if (Array.isArray(detail) && detail.length > 0) {
      return (detail as ValidationIssue[])
        .map((issue) => `${issue.loc.at(-1)}: ${issue.msg}`)
        .join(', ')
    }
  }
  return 'Something went wrong'
}
