export type DropSide = 'before' | 'after'

export function slideDropTarget(
  element: HTMLElement,
  x: number,
  y: number,
): { id: string; side: DropSide } | null {
  const slides = element
    .closest('[data-slide-list]')!
    .querySelectorAll<HTMLElement>('[data-slide-id]')
  let nearest: { id: string; side: DropSide } | null = null
  let distance = Infinity
  for (const slide of slides) {
    const rect = slide.getBoundingClientRect()
    if (!rect.height || x < rect.left - 20 || x > rect.right + 20) continue
    const middle = rect.top + rect.height / 2
    const delta = Math.abs(y - middle)
    if (delta < distance) {
      distance = delta
      nearest = {
        id: slide.dataset.slideId!,
        side: y < middle ? 'before' : 'after',
      }
    }
  }
  return nearest
}
