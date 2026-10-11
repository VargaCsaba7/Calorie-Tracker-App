import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { getErrorMessage } from '../api/errors'

/**
 * Loads data on mount and whenever `deps` change.
 * Only the latest request may update state, so quickly switching
 * e.g. the selected date can't show an older response.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const latestRequest = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps)

  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await load()
      if (requestId === latestRequest.current) setData(result)
    } catch (err) {
      if (requestId === latestRequest.current) setError(getErrorMessage(err))
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false)
    }
  }, [load])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, isLoading, reload }
}
