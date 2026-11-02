import { act, renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useInstrumentDrag } from './useInstrumentDrag'

function pointer(x = 100, y = 100, id = 1, button = 0, width = 500) {
  return {
    pointerId: id,
    button,
    clientX: x,
    clientY: y,
    currentTarget: {
      setPointerCapture: vi.fn(),
      parentElement: {
        getBoundingClientRect: () => ({ width, height: 300 }),
      },
    },
  } as unknown as PointerEvent<HTMLButtonElement>
}

describe('arraste em metros', () => {
  it('usa as dimensões do mapa ativo ao converter o arraste', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() =>
      useInstrumentDrag(onMove, { width: 12, depth: 8 }),
    )
    act(() => result.current.start(pointer(), 'a'))
    act(() => result.current.move(pointer(350, 250)))
    expect(onMove).toHaveBeenCalledWith('a', 6, 4)
  })
  it('converte deslocamento, preserva captura e encerra ao soltar', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() => useInstrumentDrag(onMove))
    const start = pointer()
    act(() => result.current.start(start, 'a'))
    expect(start.currentTarget.setPointerCapture).toHaveBeenCalledWith(1)
    act(() => result.current.move(pointer(150, 150)))
    expect(onMove).toHaveBeenLastCalledWith('a', 1, 1)
    act(() => result.current.move(pointer(125, 100)))
    expect(onMove).toHaveBeenLastCalledWith('a', -0.5, -1)
    act(() => result.current.end(pointer()))
    act(() => result.current.move(pointer(200, 200)))
    expect(onMove).toHaveBeenCalledTimes(2)
  })

  it('ignora botão secundário, palco sem tamanho e outro ponteiro', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() => useInstrumentDrag(onMove))
    act(() => result.current.end(pointer()))
    act(() => result.current.start(pointer(0, 0, 1, 2), 'a'))
    act(() => result.current.start(pointer(0, 0, 1, 0, 0), 'a'))
    act(() => result.current.move(pointer()))
    expect(onMove).not.toHaveBeenCalled()
    act(() => result.current.start(pointer(), 'a'))
    act(() => result.current.start(pointer(0, 0, 2), 'b'))
    act(() => result.current.move(pointer(150, 150, 2)))
    act(() => result.current.end(pointer(0, 0, 2)))
    act(() => result.current.move(pointer(150, 150)))
    expect(onMove).toHaveBeenCalledExactlyOnceWith('a', 1, 1)
  })
})
