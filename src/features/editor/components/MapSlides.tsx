import { useId } from 'react'
import { useSlideDrag } from '../useSlideDrag'
import type { MusicMap } from '../../../domain/presentation/model'
import styles from '../editor.module.css'
import sequenceStyles from './musicSequence.module.css'
import type { DropSide } from '../slideDropTarget'

interface Props {
  maps: readonly MusicMap[]
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (id: string, targetId: string, side: DropSide) => void
}
export function MapSlides({
  maps,
  selectedId,
  onSelect,
  onMove,
  onReorder,
}: Props) {
  const hintId = useId()
  const drag = useSlideDrag(onReorder, onSelect)
  const draggedId = drag.active?.id ?? null
  const targetId = drag.active?.targetId ?? null
  const targetIndex = maps.findIndex((map) => map.id === targetId)
  const gapIndex =
    targetIndex < 0 || targetId === draggedId
      ? -1
      : targetIndex + (drag.active?.side === 'after' ? 1 : 0)
  return (
    <>
      <p id={hintId} className={sequenceStyles.dragHint}>
        Arraste para reorganizar. Pelo teclado: Alt + ↑/↓.
      </p>
      {maps.map((map, index) => (
        <button
          key={map.id}
          className={`${styles.pageItem} ${sequenceStyles.slide} ${draggedId === map.id ? sequenceStyles.dragging : ''}`}
          data-map-slide={map.id}
          onClick={(event) => drag.click(event, map.id)}
          onPointerDown={(event) => drag.start(event, map.id)}
          onPointerMove={drag.move}
          onPointerUp={drag.end}
          onPointerCancel={drag.cancel}
          onLostPointerCapture={drag.cancel}
          aria-pressed={selectedId === map.id}
          aria-label={`Abrir mapa ${map.title}`}
          aria-describedby={hintId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') drag.cancel()
            if (
              event.altKey &&
              (event.key === 'ArrowUp' || event.key === 'ArrowDown')
            ) {
              event.preventDefault()
              onMove(map.id, event.key === 'ArrowUp' ? -1 : 1)
            }
          }}
        >
          {(gapIndex === index ||
            (gapIndex === maps.length && index === maps.length - 1)) && (
            <span
              role="separator"
              aria-label="Posição de inserção"
              className={`${sequenceStyles.dropMarker} ${gapIndex === maps.length ? sequenceStyles.dropAfter : sequenceStyles.dropBefore}`}
            />
          )}
          <span className={styles.pageNumber}>
            {index + 1} · MAPA DE PALCO{' '}
            <span className={sequenceStyles.grip} aria-hidden="true">
              ⠿
            </span>
          </span>
          <strong>{map.title}</strong>
        </button>
      ))}
    </>
  )
}
