import { useEffect } from 'react'

/** Editing text and modal dialogs keep their own keyboard behavior. */
export function useSelectionKeyboard(
  count: number,
  onDelete: () => void,
  onSelectAll: () => void,
) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const selectAll =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a'
      if (
        !count ||
        event.defaultPrevented ||
        event.isComposing ||
        !(selectAll || ['Delete', 'Backspace'].includes(event.key))
      )
        return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'input:not([role="switch"]),textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"]',
        )
      )
        return
      if (document.querySelector('dialog[open],[aria-modal="true"]')) return
      event.preventDefault()
      if (selectAll) onSelectAll()
      else onDelete()
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [count, onDelete, onSelectAll])
}
