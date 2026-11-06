import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import {
  addTransition,
  updateTransition,
  reviewTransition,
  removeTransition,
} from '../../domain/presentation/sequence'

export function useTransitions(
  p: Presentation,
  update: (change: (p: Presentation) => Presentation) => void,
) {
  const [id, setId] = useState<string | null>(null)
  const selected = p.transitions.find((item) => item.id === id)
  return {
    selected,
    open: (id: string) => setId(id),
    close: () => setId(null),
    create: (afterSlideId?: string | null) => {
      if (
        typeof afterSlideId === 'string' &&
        !p.sequence.some((slide) => slide.id === afterSlideId)
      )
        return
      const id = crypto.randomUUID()
      update((current) =>
        addTransition(
          current,
          id,
          afterSlideId === null
            ? 0
            : afterSlideId === undefined
              ? current.sequence.length
              : current.sequence.findIndex((item) => item.id === afterSlideId) +
                1,
          '',
          '',
        ),
      )
      setId(id)
    },
    change: (name: string, text: string, instructionsFormat?: 'html') => {
      if (selected)
        update((current) =>
          updateTransition(
            current,
            selected.id,
            name,
            text,
            instructionsFormat,
          ),
        )
    },
    review: (transitionId: string) => {
      update((current) =>
        current.transitions.some((transition) => transition.id === transitionId)
          ? reviewTransition(current, transitionId)
          : current,
      )
    },
    remove: () => {
      if (selected) {
        update((current) => removeTransition(current, selected.id))
        setId(null)
      }
    },
  }
}
