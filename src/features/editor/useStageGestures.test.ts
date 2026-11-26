import { act, renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { useStageGestures } from './useStageGestures'
import type { StageSelection } from './useStageSelection'

function harness(ids = ['a']) {
  const surface = document.createElement('div')
  surface.innerHTML =
    '<div data-entity-id="a"><button>A</button></div><div data-entity-id="b"><button>B</button></div><input data-stage-label />'
  const selection = {
    ids,
    editing: undefined,
    entityIds: ['a', 'b', 'c'],
    select: vi.fn((next: string[]) => {
      selection.ids = next
    }),
    move: vi.fn(),
    box: (id: string) =>
      id === 'a'
        ? { left: 1, right: 3, top: 1, bottom: 3 }
        : id === 'b'
          ? { left: 4, right: 6, top: 1, bottom: 3 }
          : { left: 8, right: 9, top: 4, bottom: 5 },
  }
  const hook = renderHook(() =>
    useStageGestures(
      { current: surface },
      { width: 10, depth: 6 },
      selection as unknown as StageSelection,
    ),
  )
  function event(
    id: string | null,
    x = 100,
    y = 100,
    extra: Record<string, unknown> = {},
  ) {
    return {
      target:
        id === null
          ? surface
          : surface.querySelector(`[data-entity-id="${id}"] button`)!,
      currentTarget: surface,
      button: 0,
      pointerId: 1,
      clientX: x,
      clientY: y,
      pointerType: 'mouse',
      type: 'pointerup',
      preventDefault: vi.fn(),
      ...extra,
    } as unknown as PointerEvent<HTMLDivElement>
  }
  return { ...hook, selection, event, surface }
}
afterEach(() => vi.useRealTimers())
describe('gestos de seleção no palco', () => {
  it.each(['shiftKey', 'ctrlKey', 'metaKey'])(
    '%s alterna seleção sem mover, mesmo com movimento involuntário',
    (modifier) => {
      const h = harness()
      act(() =>
        h.result.current.down(h.event('b', 100, 100, { [modifier]: true })),
      )
      act(() => h.result.current.move(h.event('b', 200, 200)))
      act(() => h.result.current.end(h.event('b')))
      expect(h.selection.ids).toEqual(['a', 'b'])
      expect(h.selection.move).not.toHaveBeenCalled()
      act(() =>
        h.result.current.down(h.event('a', 100, 100, { [modifier]: true })),
      )
      act(() => h.result.current.end(h.event('a')))
      expect(h.selection.ids).toEqual(['b'])
    },
  )
  it('arraste respeita limiar, move a seleção como unidade e ignora ponteiro diferente e botão direito', () => {
    const h = harness(['a', 'b'])
    act(() => h.result.current.move(h.event('a')))
    act(() => h.result.current.end(h.event('a')))
    act(() => h.result.current.down(h.event('a', 100, 100, { button: 2 })))
    act(() => h.result.current.down(h.event('a')))
    act(() => h.result.current.down(h.event('b')))
    act(() => h.result.current.move(h.event('a', 101, 101)))
    expect(h.selection.move).not.toHaveBeenCalled()
    act(() => h.result.current.move(h.event('a', 200, 200, { pointerId: 2 })))
    act(() => h.result.current.end(h.event('a', 200, 200, { pointerId: 2 })))
    act(() => h.result.current.move(h.event('a', 160, 160)))
    expect(h.selection.move).toHaveBeenCalledWith(
      ['a', 'b'],
      expect.closeTo(1),
      expect.closeTo(1),
    )
    act(() => h.result.current.end(h.event('a')))
    act(() => h.result.current.down(h.event('b')))
    act(() => h.result.current.end(h.event('b')))
    expect(h.selection.ids).toEqual(['b'])
    act(() => h.result.current.down(h.event('a')))
    act(() =>
      h.result.current.end(h.event('a', 100, 100, { type: 'pointercancel' })),
    )
    expect(h.result.current.rectangle).toBeNull()
  })
  it('retângulo seleciona interseções, permite seleção aditiva e ignora campos de texto e elementos externos ao Kumi', () => {
    const h = harness(['c'])
    act(() => h.result.current.down(h.event(null, 30, 30, { shiftKey: true })))
    act(() => h.result.current.move(h.event(null, 370, 200)))
    expect(h.selection.ids).toEqual(['c', 'a', 'b'])
    expect(h.result.current.rectangle).not.toBeNull()
    act(() => h.result.current.end(h.event(null)))
    act(() => h.result.current.down(h.event(null, 30, 30)))
    act(() => h.result.current.move(h.event(null, 200, 200)))
    act(() => h.result.current.end(h.event(null)))
    expect(h.selection.ids).toEqual(['a'])
    act(() =>
      h.result.current.down(
        h.event(null, 0, 0, { target: h.surface.querySelector('input') }),
      ),
    )
    h.selection.editing = { id: 'k' } as never
    h.selection.entityIds = ['a']
    act(() => h.result.current.down(h.event('b')))
    act(() => h.result.current.move(h.event('b', 300, 300)))
    expect(h.selection.move).not.toHaveBeenCalled()
  })
  it('toque prolongado alterna seleção sem mover; arraste antes do prazo mantém o movimento disponível', () => {
    vi.useFakeTimers()
    const h = harness(['a'])
    act(() =>
      h.result.current.down(h.event('b', 100, 100, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.move(h.event('b', 101, 101, { pointerType: 'touch' })),
    )
    act(() => vi.advanceTimersByTime(500))
    act(() =>
      h.result.current.end(h.event('b', 100, 100, { pointerType: 'touch' })),
    )
    expect(h.selection.ids).toEqual(['a', 'b'])
    expect(h.selection.move).not.toHaveBeenCalled()
    act(() =>
      h.result.current.down(h.event('a', 100, 100, { pointerType: 'touch' })),
    )
    act(() => vi.advanceTimersByTime(500))
    act(() => h.result.current.end(h.event('a')))
    expect(h.selection.ids).toEqual(['b'])
    act(() =>
      h.result.current.down(h.event('a', 100, 100, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.move(h.event('a', 200, 200, { pointerType: 'touch' })),
    )
    act(() => h.result.current.end(h.event('a')))
    expect(h.selection.move).toHaveBeenCalled()
    act(() =>
      h.result.current.down(h.event('a', 100, 100, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.move(h.event('a', 200, 200, { pointerType: 'touch' })),
    )
    act(() => h.result.current.end(h.event('a')))
    act(() =>
      h.result.current.down(h.event('b', 100, 100, { pointerType: 'touch' })),
    )
    h.unmount()
    act(() => vi.advanceTimersByTime(500))
  })
  it('abre menu por duplo clique ou dois toques sem perder a seleção anterior, e fecha sem apagar', () => {
    vi.useFakeTimers()
    const h = harness()
    act(() => h.result.current.open(50, 50))
    expect(h.result.current.menu).not.toBeNull()
    act(() => h.result.current.closeMenu())
    expect(h.result.current.menu).toBeNull()
    act(() => h.result.current.down(h.event(null, 20, 20)))
    act(() => h.result.current.end(h.event(null, 20, 20)))
    act(() => h.result.current.doubleClick(20, 20))
    expect(h.selection.ids).toEqual(['a'])
    act(() =>
      h.result.current.down(h.event(null, 20, 20, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.end(h.event(null, 20, 20, { pointerType: 'touch' })),
    )
    act(() => vi.advanceTimersByTime(100))
    act(() =>
      h.result.current.down(h.event(null, 20, 20, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.end(h.event(null, 20, 20, { pointerType: 'touch' })),
    )
    expect(h.result.current.menu).not.toBeNull()
    act(() =>
      h.result.current.down(h.event('a', 20, 20, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.end(h.event('a', 20, 20, { pointerType: 'touch' })),
    )
    act(() => vi.advanceTimersByTime(100))
    act(() =>
      h.result.current.down(h.event('a', 20, 20, { pointerType: 'touch' })),
    )
    act(() =>
      h.result.current.end(h.event('a', 20, 20, { pointerType: 'touch' })),
    )
    h.selection.ids = []
    act(() => vi.advanceTimersByTime(1000))
    act(() => h.result.current.closeMenu())
    act(() => h.result.current.doubleClick(20, 20))
    expect(h.result.current.menu).toBeNull()
  })
})
