import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from 'react'
import type { StageDimensions } from '../../domain/presentation/model'
import type { StageSelection } from './useStageSelection'
import type { Bounds } from './selectionGeometry'

export function useStageGestures(
  surface: RefObject<HTMLDivElement | null>,
  stage: StageDimensions,
  selection: StageSelection,
) {
  const [rectangle, setRectangle] = useState<Bounds | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const current = useRef<{
    pointer: number
    kind: 'move' | 'box' | 'select' | 'pending'
    id: string | null
    before: string[]
    keys: string[]
    x: number
    y: number
    lastX: number
    lastY: number
    moved: boolean
    touch: boolean
  } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recent = useRef({ ids: [] as string[], time: 0 })
  const tap = useRef({ time: 0, x: 0, y: 0 })
  const latest = useRef(selection)
  useLayoutEffect(() => {
    latest.current = selection
  })
  function cancelTimer() {
    if (timer.current) clearTimeout(timer.current)
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  function coordinates(x: number, y: number) {
    const rect = surface.current!.getBoundingClientRect()
    return {
      x: ((x - rect.left) / (rect.width || 600)) * stage.width,
      y: ((y - rect.top) / (rect.height || 360)) * stage.depth,
    }
  }
  function open(x: number, y: number, ids = selection.ids) {
    if (!ids.length) return
    selection.select(ids)
    const rect = surface.current!.getBoundingClientRect()
    setMenu({
      x: Math.max(0, Math.min(x - rect.left, (rect.width || 600) - 145)),
      y: Math.max(0, Math.min(y - rect.top, (rect.height || 360) - 140)),
    })
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || current.current) return
    const target = event.target as Element
    if (
      target.closest(
        '[data-stage-label],input,[role="menu"],.empty-stage-action',
      )
    )
      return
    const element = target.closest<HTMLElement>('[data-entity-id]'),
      id = element?.dataset.entityId ?? null
    if (selection.editing && id && !selection.entityIds.includes(id)) return
    setMenu(null)
    const append = event.ctrlKey || event.metaKey || event.shiftKey,
      touch = event.pointerType === 'touch',
      point = coordinates(event.clientX, event.clientY)
    const before = [...selection.ids]
    if (before.length) recent.current = { ids: before, time: Date.now() }
    let keys = before
    if (id) {
      if (append) {
        keys = before.includes(id)
          ? before.filter((i) => i !== id)
          : [...before, id]
        selection.select(keys)
      } else if (!touch && !before.includes(id)) {
        keys = [id]
        selection.select(keys)
      }
    } else if (!append) selection.select([])
    current.current = {
      pointer: event.pointerId,
      kind: id ? (append ? 'select' : touch ? 'pending' : 'move') : 'box',
      id,
      before: append ? before : [],
      keys,
      x: point.x,
      y: point.y,
      lastX: point.x,
      lastY: point.y,
      moved: false,
      touch,
    }
    if (touch && id)
      timer.current = setTimeout(() => {
        const drag = current.current
        if (!drag || drag.kind !== 'pending') return
        const ids = latest.current.ids
        latest.current.select(
          ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
        )
        drag.kind = 'select'
      }, 450)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    if (id) event.preventDefault()
    if (id) target.closest<HTMLButtonElement>('button')?.focus()
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = current.current
    if (!drag || drag.pointer !== event.pointerId || drag.kind === 'select')
      return
    const point = coordinates(event.clientX, event.clientY)
    if (!drag.moved && Math.hypot(point.x - drag.x, point.y - drag.y) < 0.08)
      return
    drag.moved = true
    cancelTimer()
    if (drag.kind === 'pending') {
      drag.kind = 'move'
      if (!drag.keys.includes(drag.id!)) {
        drag.keys = [drag.id!]
        selection.select(drag.keys)
      }
    }
    if (drag.kind === 'box') {
      const box = {
        left: Math.min(drag.x, point.x),
        right: Math.max(drag.x, point.x),
        top: Math.min(drag.y, point.y),
        bottom: Math.max(drag.y, point.y),
      }
      setRectangle(box)
      selection.select([
        ...new Set([
          ...drag.before,
          ...selection.entityIds.filter((id) => {
            const b = selection.box(id)
            return (
              b.left <= box.right &&
              b.right >= box.left &&
              b.top <= box.bottom &&
              b.bottom >= box.top
            )
          }),
        ]),
      ])
    } else selection.move(drag.keys, point.x - drag.lastX, point.y - drag.lastY)
    drag.lastX = point.x
    drag.lastY = point.y
  }
  function end(event: PointerEvent<HTMLDivElement>) {
    const drag = current.current
    if (!drag || drag.pointer !== event.pointerId) return
    cancelTimer()
    setRectangle(null)
    current.current = null
    if (event.type === 'pointercancel') return
    if (!drag.moved && drag.kind !== 'select') {
      if (drag.id) selection.select([drag.id])
      if (drag.touch) {
        if (
          Date.now() - tap.current.time < 350 &&
          Math.hypot(
            event.clientX - tap.current.x,
            event.clientY - tap.current.y,
          ) < 28
        ) {
          const ids = drag.id ? [drag.id] : recent.current.ids
          open(event.clientX, event.clientY, ids)
          tap.current.time = 0
        } else
          tap.current = { time: Date.now(), x: event.clientX, y: event.clientY }
      }
    }
  }
  return {
    rectangle,
    menu,
    closeMenu: () => setMenu(null),
    down,
    move,
    end,
    open,
    doubleClick: (x: number, y: number) =>
      open(
        x,
        y,
        selection.ids.length
          ? selection.ids
          : Date.now() - recent.current.time < 700
            ? recent.current.ids
            : [],
      ),
  }
}
