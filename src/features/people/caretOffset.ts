/** Resolve a posição no texto antes de substituir o rótulo pelo campo. */
export function caretOffsetAtPoint(element: HTMLElement, x: number, y: number) {
  const doc = element.ownerDocument
  const caret = doc.caretPositionFromPoint?.(x, y)
  const range = caret ? null : doc.caretRangeFromPoint?.(x, y)
  const node = caret?.offsetNode ?? range?.startContainer
  const offset = caret?.offset ?? range?.startOffset
  if (!node || offset === undefined || !element.contains(node)) return undefined
  const prefix = doc.createRange()
  prefix.selectNodeContents(element)
  prefix.setEnd(node, offset)
  return prefix.toString().length
}
