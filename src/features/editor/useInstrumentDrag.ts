import { useRef, type PointerEvent } from 'react'
import { stageSize } from '../../domain/stage'
import type { StageDimensions } from '../../domain/presentation/model'

/** Pointer capture keeps a drag active even when the cursor leaves the icon. */
export function useInstrumentDrag(
  onMove: (id: string, dx: number, dy: number) => void,
  stage: StageDimensions = stageSize,
) {
  const drag = useRef<{
    id: string
    pointer: number
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  function start(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0 || drag.current) return
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect()
    if (bounds.width <= 0 || bounds.height <= 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      id,
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: bounds.width,
      height: bounds.height,
    }
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    onMove(
      current.id,
      ((event.clientX - current.x) / current.width) * stage.width,
      ((event.clientY - current.y) / current.height) * stage.depth,
    )
    current.x = event.clientX
    current.y = event.clientY
  }

  function end(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer === event.pointerId) drag.current = null
  }

  return { start, move, end }
}
