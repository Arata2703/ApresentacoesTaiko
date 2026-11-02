import { describe, expect, it, vi } from 'vitest'
import { caretOffsetAtPoint } from './caretOffset'

describe('posição do cursor no rótulo', () => {
  it('resolve o deslocamento do clique e aceita a API alternativa', () => {
    const label = document.createElement('span')
    label.textContent = 'Rafael/Kaory'
    const node = label.firstChild!
    const modern = vi.fn(() => ({ offsetNode: node, offset: 3 }))
    Object.defineProperty(document, 'caretPositionFromPoint', {
      configurable: true,
      value: modern,
    })
    expect(caretOffsetAtPoint(label, 20, 30)).toBe(3)
    expect(modern).toHaveBeenCalledWith(20, 30)
    Object.defineProperty(document, 'caretPositionFromPoint', {
      configurable: true,
      value: undefined,
    })
    const range = document.createRange()
    range.setStart(node, 7)
    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: () => range,
    })
    expect(caretOffsetAtPoint(label, 20, 30)).toBe(7)
    range.setStart(document.createTextNode('outro'), 0)
    expect(caretOffsetAtPoint(label, 20, 30)).toBeUndefined()
    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: () => null,
    })
    expect(caretOffsetAtPoint(label, 20, 30)).toBeUndefined()
    Object.defineProperty(document, 'caretRangeFromPoint', {
      configurable: true,
      value: undefined,
    })
    expect(caretOffsetAtPoint(label, 20, 30)).toBeUndefined()
  })
})
