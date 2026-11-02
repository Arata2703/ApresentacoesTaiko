import styles from '../editor.module.css'

interface Props {
  song: string
}
export function PresentationSidebar(props: Props) {
  const { song } = props
  return (
    <aside className={styles.sidebar} aria-label="Páginas da apresentação">
      <div className={styles.sidebarHeading}>
        <span className={styles.eyebrow}>APRESENTAÇÃO</span>
        <span className={styles.pageCount}>01</span>
      </div>
      <div className={styles.pageItem} aria-current="page">
        <div className={styles.miniMap} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div>
          <span className={styles.pageNumber}>01 · MAPA DE PALCO</span>
          <strong>{song || 'Música sem título'}</strong>
        </div>
      </div>
      <div className={styles.sidebarNote}>
        <span className={styles.noteIcon} aria-hidden="true">
          ↗
        </span>
        <p>
          Um bom espetáculo
          <br />
          começa no planejamento.
        </p>
      </div>
      <div className={styles.scopeNote}>
        Novas músicas, transições e exportação chegam nas próximas etapas.
      </div>
    </aside>
  )
}
