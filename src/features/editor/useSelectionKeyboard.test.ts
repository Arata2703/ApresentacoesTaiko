import { act, renderHook } from '@testing-library/react'
import { it, expect, vi } from 'vitest'
import { useSelectionKeyboard } from './useSelectionKeyboard'

it.each([
  'input',
  'textarea',
  'select',
  'contenteditable',
  'textbox',
  'combobox',
])(
  'preserva a edição de %s ao pressionar atalhos de seleção ou exclusão',
  (kind) => {
    const node = document.createElement(
      ['input', 'textarea', 'select'].includes(kind) ? kind : 'div',
    )
    if (kind === 'contenteditable') node.setAttribute('contenteditable', 'true')
    if (kind === 'textbox' || kind === 'combobox')
      node.setAttribute('role', kind)
    document.body.append(node)
    const remove = vi.fn()
    const selectAll = vi.fn()
    const hook = renderHook(() => useSelectionKeyboard(1, remove, selectAll))
    for (const key of ['Delete', 'Backspace', 'a']) {
      const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ctrlKey: key === 'a',
      })
      act(() => node.dispatchEvent(event))
      expect(event.defaultPrevented).toBe(false)
    }
    expect(remove).not.toHaveBeenCalled()
    expect(selectAll).not.toHaveBeenCalled()
    hook.unmount()
    node.remove()
  },
)
it('respeita modais, composição de texto, eventos já tratados e ausência de seleção', () => {
  const remove = vi.fn()
  const selectAll = vi.fn()
  const hook = renderHook(
    ({ count }) => useSelectionKeyboard(count, remove, selectAll),
    {
      initialProps: { count: 1 },
    },
  )
  const dispatch = (key: string, options: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    })
    act(() => document.dispatchEvent(event))
    return event
  }
  dispatch('a')
  dispatch('Delete', { isComposing: true })
  const prevented = new KeyboardEvent('keydown', {
    key: 'Delete',
    bubbles: true,
    cancelable: true,
  })
  prevented.preventDefault()
  act(() => document.dispatchEvent(prevented))
  const dialog = document.createElement('dialog')
  dialog.open = true
  document.body.append(dialog)
  dispatch('Backspace')
  dialog.remove()
  hook.rerender({ count: 0 })
  dispatch('Delete')
  expect(remove).not.toHaveBeenCalled()
  expect(dispatch('a', { ctrlKey: true }).defaultPrevented).toBe(false)
  expect(selectAll).not.toHaveBeenCalled()
  hook.rerender({ count: 2 })
  expect(dispatch('Backspace').defaultPrevented).toBe(true)
  expect(remove).toHaveBeenCalledOnce()
  expect(dispatch('a', { ctrlKey: true }).defaultPrevented).toBe(true)
  expect(dispatch('A', { metaKey: true }).defaultPrevented).toBe(true)
  expect(selectAll).toHaveBeenCalledTimes(2)
  hook.unmount()
  dispatch('Delete')
  expect(remove).toHaveBeenCalledOnce()
  dispatch('a', { ctrlKey: true })
  expect(selectAll).toHaveBeenCalledTimes(2)
})
