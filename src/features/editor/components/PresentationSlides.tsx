import { useSlideDrag } from '../useSlideDrag'
import styles from '../editor.module.css'
import sequenceStyles from './musicSequence.module.css'
import type { DropSide } from '../slideDropTarget'

interface Props {
  slides: readonly {
    id: string
    label: string
    title: string
    description: string
    needsReview?: boolean
  }[]
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (id: string, targetId: string, side: DropSide) => void
  onReview: (id: string) => void
}
export function PresentationSlides({
  slides,
  selectedId,
  onSelect,
  onMove,
  onReorder,
  onReview,
}: Props) {
  const drag = useSlideDrag(onReorder, onSelect)
  const draggedId = drag.active?.id ?? null
  const targetId = drag.active?.targetId ?? null
  const targetIndex = slides.findIndex((slide) => slide.id === targetId)
  const gapIndex =
    targetIndex < 0 || targetId === draggedId
      ? -1
      : targetIndex + (drag.active?.side === 'after' ? 1 : 0)
  return (
    <>
      {slides.map((slide, index) => {
        const moving = drag.active?.id === slide.id ? drag.active : null
        return (
          <div
            key={slide.id}
            className={sequenceStyles.card}
            data-slide-id={slide.id}
            style={moving ? { height: moving.height } : undefined}
          >
            {(gapIndex === index ||
              (gapIndex === slides.length && index === slides.length - 1)) && (
              <span
                role="separator"
                aria-label="Posição de inserção"
                className={`${sequenceStyles.dropMarker} ${gapIndex === slides.length ? sequenceStyles.dropAfter : sequenceStyles.dropBefore}`}
              />
            )}
            <div
              className={moving ? sequenceStyles.movingCard : undefined}
              style={
                moving
                  ? { left: moving.left, top: moving.top, width: moving.width }
                  : undefined
              }
            >
              <button
                className={`${styles.pageItem} ${sequenceStyles.slide}`}
                onClick={(event) => drag.click(event, slide.id)}
                onPointerDown={(event) => drag.start(event, slide.id)}
                onPointerMove={drag.move}
                onPointerUp={drag.end}
                onPointerCancel={drag.cancel}
                onLostPointerCapture={drag.cancel}
                aria-pressed={selectedId === slide.id}
                aria-label={slide.label}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') drag.cancel()
                  if (
                    event.altKey &&
                    (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                  ) {
                    event.preventDefault()
                    onMove(slide.id, event.key === 'ArrowUp' ? -1 : 1)
                  }
                }}
              >
                <span className={styles.pageNumber}>
                  {index + 1} · {slide.description}{' '}
                  <span className={sequenceStyles.grip} aria-hidden="true">
                    ⠿
                  </span>
                </span>
                <strong>{slide.title}</strong>
              </button>
              {slide.needsReview && (
                <button
                  type="button"
                  className={sequenceStyles.reviewAction}
                  aria-label={`Marcar ${slide.title} como revisada`}
                  onClick={() => onReview(slide.id)}
                >
                  Revisar
                </button>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
