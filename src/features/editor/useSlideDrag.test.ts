import { act, renderHook } from '@testing-library/react'
import type { PointerEvent, MouseEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useSlideDrag } from './useSlideDrag'

function event(y = 0, id = 1, button = 0, target: HTMLElement | null = null) {
  return {
    clientX: 100,
    clientY: y,
    pointerId: id,
    button,
    preventDefault: vi.fn(),
    currentTarget: {
      getBoundingClientRect: () => ({
        left: 80,
        top: 0,
        width: 200,
        height: 80,
      }),
      setPointerCapture: vi.fn(),
      closest: () => ({ querySelectorAll: () => (target ? [target] : []) }),
    },
  } as unknown as PointerEvent<HTMLButtonElement>
}
describe('controle do arraste de slides', () => {
  it('respeita limiar, ponteiro e cancelamento e evita abrir o slide ao soltar', () => {
    const reorder = vi.fn(),
      select = vi.fn()
    const { result } = renderHook(() => useSlideDrag(reorder, select))
    const target = document.createElement('button')
    target.dataset.slideId = 'b'
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 200,
      top: 0,
      height: 100,
    } as DOMRect)
    act(() => {
      result.current.move(event())
      result.current.end(event())
      result.current.start(event(0, 1, 2), 'a')
    })
    act(() => result.current.start(event(), 'a'))
    act(() => {
      result.current.start(event(0, 2), 'b')
      result.current.move(event(10, 2))
      result.current.move(event(2))
      result.current.end(event(0, 2))
    })
    expect(result.current.active).toBeNull()
    act(() => result.current.move(event(100, 1, 0, target)))
    expect(result.current.active).toEqual({
      id: 'a',
      targetId: 'b',
      side: 'after',
      left: 80,
      top: 100,
      width: 200,
      height: 80,
    })
    act(() => result.current.end(event(100)))
    expect(reorder).toHaveBeenCalledExactlyOnceWith('a', 'b', 'after')
    act(() =>
      result.current.click({ detail: 1 } as MouseEvent<HTMLButtonElement>, 'a'),
    )
    expect(select).toHaveBeenCalledTimes(1)
    act(() =>
      result.current.click({ detail: 0 } as MouseEvent<HTMLButtonElement>, 'a'),
    )
    expect(select).toHaveBeenCalledWith('a')
    act(() => {
      result.current.start(event(), 'a')
      result.current.move(event(100))
      result.current.end(event(100))
    })
    expect(reorder).toHaveBeenCalledTimes(1)
    target.dataset.slideId = 'a'
    act(() => {
      result.current.start(event(), 'a')
      result.current.move(event(100, 1, 0, target))
      result.current.end(event(100))
    })
    expect(reorder).toHaveBeenCalledTimes(1)
    act(() => {
      result.current.start(event(), 'a')
      result.current.cancel()
      result.current.end(event())
    })
    act(() => {
      result.current.start(event(), 'a')
      result.current.end(event())
      result.current.click({ detail: 1 } as MouseEvent<HTMLButtonElement>, 'a')
    })
    expect(select).toHaveBeenCalledTimes(5)
  })
})
