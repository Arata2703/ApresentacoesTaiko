import type { Presentation } from '../../../domain/presentation/model'
import styles from '../editor.module.css'
import sequenceStyles from './musicSequence.module.css'
import { PresentationSlides } from './PresentationSlides'
import type { DropSide } from '../slideDropTarget'

interface Props {
  view: 'slides' | 'people' | 'materials'
  onMaterials: () => void
  onPeople: () => void
  presentation: Presentation
  activeMapId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onAddTransition: () => void
  onMove: (id: string, direction: -1 | 1) => void
  onReorder: (id: string, targetId: string, side: DropSide) => void
  activeTransitionId: string | null
  onTransition: (id: string) => void
  onReview: (id: string) => void
}
export function PresentationSidebar({
  presentation,
  activeMapId,
  onSelect,
  view,
  onMaterials,
  onPeople,
  onAdd,
  onAddTransition,
  onMove,
  onReorder,
  activeTransitionId,
  onTransition,
  onReview,
}: Props) {
  const slides = presentation.sequence.map((item, index) => {
    if (item.kind === 'map') {
      const map = presentation.maps.find((map) => map.id === item.id)!
      return {
        id: item.id,
        title: map.title,
        label: `Abrir mapa ${map.title}`,
        description: 'MAPA DE PALCO',
      }
    }
    const transition = presentation.transitions.find(
      (transition) => transition.id === item.id,
    )!
    const title = transition.tsunagiName || 'Sem nome'
    return {
      id: item.id,
      title,
      label: `Abrir transição ${index + 1}: ${title}`,
      description: 'TRANSIÇÃO',
      needsReview: transition.needsReview,
    }
  })
  const slideIds = new Map(
    presentation.sequence.map((item) => [item.id, item.kind]),
  )
  return (
    <aside
      data-slide-list
      className={styles.sidebar}
      aria-label="Páginas da apresentação"
    >
      <button
        className={styles.pageItem}
        aria-pressed={view === 'people'}
        onClick={onPeople}
      >
        Integrantes ({presentation.people.length})
      </button>
      <button
        className={styles.pageItem}
        aria-pressed={view === 'materials'}
        onClick={onMaterials}
      >
        Materiais manuais
      </button>
      <div className={styles.sidebarHeading}>
        <span className={styles.eyebrow}>SLIDES</span>
        <span className={styles.pageCount}>{slides.length}</span>
      </div>
      <div
        className={sequenceStyles.insert}
        role="group"
        aria-label="Adicionar slides"
      >
        <button
          type="button"
          aria-label="Adicionar mapa"
          title="Adicionar mapa"
          onClick={onAdd}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5H4v14h16v-7M15 5h6m-3-3v6M7 15l3-3 3 3 2-2" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Adicionar transição"
          title="Adicionar transição"
          onClick={onAddTransition}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5H4v14h16v-7M15 5h6m-3-3v6M7 13h10m-3-3 3 3-3 3" />
          </svg>
        </button>
      </div>
      <PresentationSlides
        slides={slides}
        selectedId={
          view !== 'slides' ? null : (activeTransitionId ?? activeMapId)
        }
        onSelect={(id) =>
          slideIds.get(id) === 'map' ? onSelect(id) : onTransition(id)
        }
        onMove={onMove}
        onReorder={onReorder}
        onReview={onReview}
      />
      {!slides.length && <p>Nenhum slide nesta apresentação.</p>}
      <div className={styles.scopeNote}>
        A apresentação editável guarda todos os dados. O PDF contém somente o
        mapa selecionado. As transições são salvas no arquivo editável.
      </div>
    </aside>
  )
}
