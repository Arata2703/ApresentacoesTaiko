import type { Presentation } from '../../../domain/presentation/model'
import styles from '../editor.module.css'
import sequenceStyles from './musicSequence.module.css'
import { MapSlides } from './MapSlides'
import type { DropSide } from '../slideDropTarget'

interface Props {
  peopleView: boolean
  onPeople: () => void
  presentation: Presentation
  activeMapId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (id: string, targetId: string, side: DropSide) => void
}
export function PresentationSidebar({
  presentation,
  activeMapId,
  onSelect,
  peopleView,
  onPeople,
  onAdd,
  onMove,
  onReorder,
}: Props) {
  const maps = presentation.sequence
    .filter((item) => item.kind === 'map')
    .map((item) => presentation.maps.find((map) => map.id === item.id)!)
  return (
    <aside
      data-map-list
      className={styles.sidebar}
      aria-label="Páginas da apresentação"
    >
      <button
        className={styles.pageItem}
        aria-pressed={peopleView}
        onClick={onPeople}
      >
        Integrantes ({presentation.people.length})
      </button>
      <div className={styles.sidebarHeading}>
        <span className={styles.eyebrow}>MAPAS</span>
        <span className={styles.pageCount}>{maps.length}</span>
      </div>
      <MapSlides
        maps={maps}
        selectedId={peopleView ? null : activeMapId}
        onSelect={onSelect}
        onMove={onMove}
        onReorder={onReorder}
      />
      <button className={sequenceStyles.add} onClick={onAdd}>
        + Adicionar música
      </button>
      {!maps.length && <p>Nenhum mapa nesta apresentação.</p>}
      <div className={styles.scopeNote}>
        A apresentação editável guarda todos os dados. O PDF contém somente o
        mapa selecionado. A edição de transições chega na próxima etapa.
      </div>
    </aside>
  )
}
