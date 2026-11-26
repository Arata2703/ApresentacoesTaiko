import { act, renderHook } from '@testing-library/react'
import { afterEach, it, expect, vi } from 'vitest'
import { useStageBounds } from './useStageBounds'
import { presentationFixture } from '../../test/presentationFixture'
import { projectMap } from './editorProjection'
afterEach(() => vi.restoreAllMocks())
it('mede margens transparentes, atualiza ao redimensionar e ignora imagens ainda não carregadas', () => {
  const stage = document.createElement('div')
  stage.innerHTML =
    '<div data-instrument-id="drum"><img src="drum.png" /></div>'
  const image = stage.querySelector('img')!
  Object.defineProperties(image, {
    complete: { value: true, configurable: true },
    naturalWidth: { value: 256, configurable: true },
    naturalHeight: { value: 256 },
    clientWidth: { value: 40 },
    clientHeight: { value: 40 },
  })
  Object.defineProperties(stage, {
    clientWidth: { value: 500 },
    clientHeight: { value: 300 },
  })
  const pixels = new Uint8ClampedArray(256 * 256 * 4)
  for (let y = 64; y < 192; y++)
    for (let x = 64; x < 192; x++) pixels[(y * 256 + x) * 4 + 3] = 255
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    getImageData: () => ({ data: pixels }),
  } as unknown as CanvasRenderingContext2D)
  let resize = () => {}
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe = vi.fn()
      disconnect = disconnect
    },
  )
  const instruments = projectMap(presentationFixture(), 'a')!.instruments.map(
    (i) => ({ ...i, rotation: 0 }),
  )
  const { result, unmount } = renderHook(() =>
    useStageBounds({ current: stage }, instruments, { width: 10, depth: 6 }),
  )
  expect(
    result.current.bounds.get('drum')!.right -
      result.current.bounds.get('drum')!.left,
  ).toBeCloseTo(0.4)
  act(() => resize())
  act(() => result.current.measure(image))
  Object.defineProperty(image, 'complete', { value: false })
  act(() => result.current.measure(image))
  Object.defineProperty(image, 'complete', { value: true })
  Object.defineProperty(image, 'naturalWidth', { value: 0 })
  act(() => result.current.measure(image))
  disconnect.mockClear()
  unmount()
  expect(disconnect).toHaveBeenCalledOnce()
  vi.unstubAllGlobals()
})
