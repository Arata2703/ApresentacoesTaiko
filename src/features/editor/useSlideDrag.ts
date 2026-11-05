import { useRef, useState, type PointerEvent, type MouseEvent } from 'react'
import { slideDropTarget, type DropSide } from './slideDropTarget'

export function useSlideDrag(
  onReorder: (id: string, targetId: string, side: DropSide) => void,
  onSelect: (id: string) => void,
) {
  const pointer = useRef<{
    id: string
    pointerId: number
    x: number
    y: number
    moved: boolean
    targetId: string | null
    side: DropSide
  } | null>(null)
  const skipClick = useRef(false)
  const [active, setActive] = useState<{
    id: string
    targetId: string | null
    side: DropSide
  } | null>(null)
  function cancel() {
    pointer.current = null
    setActive(null)
  }
  return {
    active,
    start: (event: PointerEvent<HTMLButtonElement>, id: string) => {
      if (event.button !== 0 || pointer.current) return
      skipClick.current = false
      pointer.current = {
        id,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
        targetId: null,
        side: 'after',
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    move: (event: PointerEvent<HTMLButtonElement>) => {
      const current = pointer.current
      if (!current || current.pointerId !== event.pointerId) return
      if (
        !current.moved &&
        Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5
      )
        return
      event.preventDefault()
      if (!current.moved) onSelect(current.id)
      current.moved = true
      const target = slideDropTarget(
        event.currentTarget,
        event.clientX,
        event.clientY,
      )
      current.targetId = target?.id ?? null
      current.side = target?.side ?? 'after'
      setActive({
        id: current.id,
        targetId: current.targetId,
        side: current.side,
      })
    },
    end: (event: PointerEvent<HTMLButtonElement>) => {
      const current = pointer.current
      if (!current || current.pointerId !== event.pointerId) return
      skipClick.current = current.moved
      if (
        current.moved &&
        current.targetId !== null &&
        current.targetId !== current.id
      )
        onReorder(current.id, current.targetId, current.side)
      cancel()
    },
    click: (event: MouseEvent<HTMLButtonElement>, id: string) => {
      if (event.detail === 0 || !skipClick.current) onSelect(id)
      skipClick.current = false
    },
    cancel,
  }
}
