import { useEffect, useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import { savePresentationCache } from '../../integrations/presentationCache'

export function usePresentationCache(
  presentation: Presentation,
  mapId: string | null,
  initialError: string,
) {
  const [enabled, setEnabled] = useState(!initialError)
  const [message, setMessage] = useState(initialError)
  useEffect(() => {
    if (!enabled) return
    const save = () => setMessage(savePresentationCache(presentation, mapId))
    const timer = window.setTimeout(save, 0)
    window.addEventListener('pagehide', save)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pagehide', save)
    }
  }, [presentation, mapId, enabled])
  return { message, blocked: !enabled, enable: () => setEnabled(true) }
}
