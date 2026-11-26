import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { EditorInstrument } from './editorProjection'
import type { StageDimensions } from '../../domain/presentation/model'
import {
  imageFootprint,
  rotatedFootprint,
  type Bounds,
} from './selectionGeometry'

export function useStageBounds(
  surface: RefObject<HTMLDivElement | null>,
  instruments: readonly EditorInstrument[],
  stage: StageDimensions,
) {
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((n) => n + 1), [])
  const [footprints] = useState(() => new Map<string, Bounds>())
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(refresh)
    observer.observe(surface.current!)
    return () => observer.disconnect()
  }, [surface, refresh])
  const measure = useCallback(
    (image: HTMLImageElement) => {
      const angle = Number(
          image.closest<HTMLElement>('[data-instrument-id]')?.dataset
            .rotation ?? 0,
        ),
        key = image.src + ':' + angle
      if (!image.complete || !image.naturalWidth || footprints.has(key)) return
      footprints.set(key, imageFootprint(image, angle))
      refresh()
    },
    [footprints, refresh],
  )
  const size = {
    width: surface.current?.clientWidth || 600,
    height: surface.current?.clientHeight || 360,
  }
  const bounds = new Map(
    instruments.map((item) => {
      const image = [
        ...(surface.current?.querySelectorAll<HTMLImageElement>(
          '[data-instrument-id] img',
        ) ?? []),
      ].find(
        (image) =>
          image.closest<HTMLElement>('[data-instrument-id]')!.dataset
            .instrumentId === item.id,
      )
      const footprint = image
        ? footprints.get(image.src + ':' + item.rotation)
        : undefined
      const width = Math.min(
          image?.clientWidth || 43,
          image?.clientHeight || 44,
        ),
        height = width
      const box = rotatedFootprint(
        footprint ?? { left: -0.5, right: 0.5, top: -0.5, bottom: 0.5 },
        width,
        height,
        footprint ? 0 : item.rotation,
      )
      return [
        item.id,
        {
          left: item.x + (box.left / size.width) * stage.width,
          right: item.x + (box.right / size.width) * stage.width,
          top: item.y + (box.top / size.height) * stage.depth,
          bottom: item.y + (box.bottom / size.height) * stage.depth,
        },
      ] as const
    }),
  )
  useEffect(() => {
    surface.current?.querySelectorAll('img').forEach(measure)
  }, [instruments, measure, surface, revision])
  return { bounds, measure, size }
}
