import type { Position, StageDimensions } from '../../domain/presentation/model'

export interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}
export type Align = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'
export type Axis = 'x' | 'y'
export function union(boxes: readonly Bounds[]): Bounds {
  return {
    left: Math.min(...boxes.map((b) => b.left)),
    right: Math.max(...boxes.map((b) => b.right)),
    top: Math.min(...boxes.map((b) => b.top)),
    bottom: Math.max(...boxes.map((b) => b.bottom)),
  }
}
export function center(box: Bounds, axis: Axis): number {
  return axis === 'x' ? (box.left + box.right) / 2 : (box.top + box.bottom) / 2
}
export function transformSelection(
  boxes: readonly Bounds[],
  action: Align | 'spaceX' | 'spaceY' | 'mirrorX' | 'mirrorY',
  stage: StageDimensions,
): Position[] {
  if (!boxes.length) return []
  const frame =
    boxes.length === 1
      ? { left: 0, right: stage.width, top: 0, bottom: stage.depth }
      : union(boxes)
  if (action.startsWith('space') || action.startsWith('mirror')) {
    const axis = action.endsWith('X') ? 'x' : 'y'
    const values = boxes.map((b) => center(b, axis)),
      first = Math.min(...values),
      last = Math.max(...values)
    const sorted = values
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value)
    const pivot =
      boxes.length === 1
        ? (axis === 'x' ? stage.width : stage.depth) / 2
        : (first + last) / 2
    return values.map((value, index) => {
      const target = action.startsWith('mirror')
        ? 2 * pivot - value
        : boxes.length < 3
          ? value
          : first +
            ((last - first) *
              sorted.findIndex((item) => item.index === index)) /
              (boxes.length - 1)
      return axis === 'x'
        ? { x: target - value, y: 0 }
        : { x: 0, y: target - value }
    })
  }
  return boxes.map((b) => ({
    x:
      action === 'left'
        ? frame.left - b.left
        : action === 'right'
          ? frame.right - b.right
          : action === 'centerX'
            ? center(frame, 'x') - center(b, 'x')
            : 0,
    y:
      action === 'top'
        ? frame.top - b.top
        : action === 'bottom'
          ? frame.bottom - b.bottom
          : action === 'centerY'
            ? center(frame, 'y') - center(b, 'y')
            : 0,
  }))
}

/** A common clipped delta keeps a Kumi rigid at the edge of the stage. */
export function fitDelta(
  box: Bounds,
  delta: Position,
  stage: StageDimensions,
): Position {
  return {
    x: Math.max(-box.left, Math.min(stage.width - box.right, delta.x)),
    y: Math.max(-box.top, Math.min(stage.depth - box.bottom, delta.y)),
  }
}

/** Alpha bounds exclude transparent SVG/PNG margins, independently of labels. */
export function imageFootprint(image: HTMLImageElement, angle = 0): Bounds {
  const canvas = document.createElement('canvas')
  const size = angle === 0 ? 256 : 512,
    offset = size / 2
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!
  const ratio = Math.min(256 / image.naturalWidth, 256 / image.naturalHeight)
  const width = image.naturalWidth * ratio,
    height = image.naturalHeight * ratio
  context.translate(offset, offset)
  context.rotate((angle * Math.PI) / 180)
  context.drawImage(image, -width / 2, -height / 2, width, height)
  const pixels = context.getImageData(0, 0, size, size).data
  let left = size,
    right = 0,
    top = size,
    bottom = 0
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (pixels[(y * size + x) * 4 + 3]! > 16) {
        left = Math.min(left, x)
        right = Math.max(right, x + 1)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y + 1)
      }
  return right
    ? {
        left: (left - offset) / 256,
        right: (right - offset) / 256,
        top: (top - offset) / 256,
        bottom: (bottom - offset) / 256,
      }
    : { left: -0.5, right: 0.5, top: -0.5, bottom: 0.5 }
}

export function rotatedFootprint(
  box: Bounds,
  width: number,
  height: number,
  angle: number,
): Bounds {
  const rad = (angle * Math.PI) / 180,
    c = Math.cos(rad),
    s = Math.sin(rad)
  const points = [box.left, box.right].flatMap((x) =>
    [box.top, box.bottom].map((y) => ({
      x: x * width * c - y * height * s,
      y: x * width * s + y * height * c,
    })),
  )
  return {
    left: Math.min(...points.map((p) => p.x)),
    right: Math.max(...points.map((p) => p.x)),
    top: Math.min(...points.map((p) => p.y)),
    bottom: Math.max(...points.map((p) => p.y)),
  }
}
