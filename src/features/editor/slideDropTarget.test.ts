import { describe, expect, it, vi } from 'vitest'
import { slideDropTarget } from './slideDropTarget'

describe('espaço de inserção dos slides', () => {
  it('usa metades e o espaço mais próximo entre slides', () => {
    const list = document.createElement('aside')
    list.dataset.slideList = ''
    const slides = ['5', '6', '7'].map((id, index) => {
      const el = document.createElement('button')
      el.dataset.slideId = id
      list.append(el)
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 100 + 100 * index,
        height: 80,
        left: 20,
        right: 200,
      } as DOMRect)
      return el
    })
    expect(slideDropTarget(slides[0]!, 100, 205)).toEqual({
      id: '6',
      side: 'before',
    })
    expect(slideDropTarget(slides[0]!, 100, 275)).toEqual({
      id: '6',
      side: 'after',
    })
    expect(slideDropTarget(slides[0]!, 100, 190)).toEqual({
      id: '5',
      side: 'after',
    })
    expect(slideDropTarget(slides[0]!, 100, 20)).toEqual({
      id: '5',
      side: 'before',
    })
    expect(slideDropTarget(slides[0]!, 100, 500)).toEqual({
      id: '7',
      side: 'after',
    })
    expect(slideDropTarget(slides[0]!, 500, 205)).toBeNull()
    expect(slideDropTarget(slides[0]!, -50, 205)).toBeNull()
    vi.spyOn(slides[0]!, 'getBoundingClientRect').mockReturnValue({
      height: 0,
      left: 20,
      right: 200,
    } as DOMRect)
    expect(slideDropTarget(slides[1]!, 100, 105)).toEqual({
      id: '6',
      side: 'before',
    })
  })
})
