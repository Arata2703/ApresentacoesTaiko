import type { Presentation } from '../../../domain/presentation/model'
import styles from '../editor.module.css'

interface Props {
  peopleView: boolean
  onPeople: () => void
  presentation: Presentation
  activeMapId: string | null
  onSelect: (id: string) => void
}
export function PresentationSidebar({
  presentation,
  activeMapId,
  onSelect,
  peopleView,
  onPeople,
}: Props) {
  const maps = presentation.sequence
    .filter((item) => item.kind === 'map')
    .map((item) => presentation.maps.find((map) => map.id === item.id)!)
  return (
    <aside className={styles.sidebar} aria-label="Páginas da apresentação">
      <button
        className={styles.pageItem}
        aria-pressed={peopleView}
        onClick={onPeople}
      >
        Integrantes ({presentation.rosterIds.length})
      </button>
      <div className={styles.sidebarHeading}>
        <span className={styles.eyebrow}>MAPAS</span>
        <span className={styles.pageCount}>{maps.length}</span>
      </div>
      {maps.map((map, index) => (
        <button
          key={map.id}
          className={styles.pageItem}
          onClick={() => onSelect(map.id)}
          aria-pressed={!peopleView && activeMapId === map.id}
          aria-label={`Abrir mapa ${map.title}`}
        >
          <span className={styles.pageNumber}>{index + 1} · MAPA DE PALCO</span>
          <strong>{map.title}</strong>
        </button>
      ))}
      {!maps.length && <p>Nenhum mapa nesta apresentação.</p>}
      <div className={styles.scopeNote}>
        A apresentação editável guarda todos os dados. O PDF contém somente o
        mapa selecionado. Criação de várias músicas e edição de transições
        chegam nas próximas etapas.
      </div>
    </aside>
  )
}
