import { describe, it, expect, vi } from 'vitest'
import {
  fitDelta,
  imageFootprint,
  rotatedFootprint,
  transformSelection,
  union,
} from './selectionGeometry'
const stage = { width: 10, depth: 6 }
const boxes = [
  { left: 1, right: 3, top: 1, bottom: 2 },
  { left: 4, right: 5, top: 3, bottom: 5 },
  { left: 7, right: 9, top: 4, bottom: 5 },
]
describe('geometria da seleção', () => {
  it.each(['left', 'right', 'top', 'bottom', 'centerX', 'centerY'] as const)(
    'alinha %s pelas bordas visuais ou centros, incluindo elementos de tamanhos diferentes',
    (action) => {
      const deltas = transformSelection(boxes, action, stage)
      const values = boxes.map((b, index) => {
        const d = deltas[index]!
        return action === 'left'
          ? b.left + d.x
          : action === 'right'
            ? b.right + d.x
            : action === 'top'
              ? b.top + d.y
              : action === 'bottom'
                ? b.bottom + d.y
                : action === 'centerX'
                  ? (b.left + b.right) / 2 + d.x
                  : (b.top + b.bottom) / 2 + d.y
      })
      expect(Math.max(...values) - Math.min(...values)).toBeCloseTo(0)
      expect(transformSelection([boxes[0]!], action, stage)).toHaveLength(1)
    },
  )
  it.each(['spaceX', 'spaceY', 'mirrorX', 'mirrorY'] as const)(
    'usa centros para %s, sem alterar o tamanho ou a formação do conjunto',
    (action) => {
      const axis = action.endsWith('X') ? 'x' : 'y',
        center = (b: (typeof boxes)[number]) =>
          axis === 'x' ? (b.left + b.right) / 2 : (b.top + b.bottom) / 2
      const values = boxes.map(center),
        deltas = transformSelection(boxes, action, stage),
        next = values.map((v, index) => v + deltas[index]![axis])
      if (action.startsWith('space')) {
        const sorted = next.sort((a, b) => a - b)
        expect(sorted[1]! - sorted[0]!).toBeCloseTo(sorted[2]! - sorted[1]!)
        expect(transformSelection([boxes[0]!], action, stage)).toEqual([
          { x: 0, y: 0 },
        ])
      } else {
        const pivot = (Math.min(...values) + Math.max(...values)) / 2
        next.forEach((v, index) =>
          expect(v).toBeCloseTo(2 * pivot - values[index]!),
        )
        expect(
          transformSelection([boxes[0]!], action, stage)[0]![axis],
        ).not.toBe(0)
      }
    },
  )
  it('limita movimento conjunto na borda e aceita seleção vazia', () => {
    const tied = transformSelection(
      [boxes[0]!, boxes[0]!, boxes[2]!],
      'spaceX',
      stage,
    )
    expect(tied[1]!.x).toBe(3)
    expect(transformSelection([], 'left', stage)).toEqual([])
    expect(union(boxes)).toEqual({ left: 1, right: 9, top: 1, bottom: 5 })
    expect(fitDelta(union(boxes), { x: 20, y: -20 }, stage)).toEqual({
      x: 1,
      y: -1,
    })
    expect(
      rotatedFootprint(
        { left: -0.5, right: 0.5, top: -0.25, bottom: 0.25 },
        40,
        40,
        90,
      ),
    ).toMatchObject({
      left: expect.closeTo(-10),
      right: expect.closeTo(10),
      top: expect.closeTo(-20),
      bottom: expect.closeTo(20),
    })
  })
  it('desconta margens transparentes da imagem e mantém limites seguros para imagem vazia', () => {
    const pixels = new Uint8ClampedArray(256 * 256 * 4)
    for (let y = 80; y < 176; y++)
      for (let x = 64; x < 192; x++) pixels[(y * 256 + x) * 4 + 3] = 255
    const drawImage = vi.fn(),
      getImageData = vi.fn(() => ({ data: pixels }))
    const mock = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        drawImage,
        getImageData,
        translate: vi.fn(),
        rotate: vi.fn(),
      } as unknown as CanvasRenderingContext2D)
    const image = document.createElement('img')
    Object.defineProperties(image, {
      naturalWidth: { value: 200 },
      naturalHeight: { value: 100 },
    })
    expect(imageFootprint(image)).toEqual({
      left: -0.25,
      right: 0.25,
      top: -0.1875,
      bottom: 0.1875,
    })
    getImageData.mockReturnValue({ data: new Uint8ClampedArray(pixels.length) })
    expect(imageFootprint(image)).toEqual({
      left: -0.5,
      right: 0.5,
      top: -0.5,
      bottom: 0.5,
    })
    mock.mockRestore()
  })
})
