import styles from '../editor.module.css'

interface Props {
  title: string
  onTitleChange: (title: string) => void
}
export function PresentationHeader(props: Props) {
  const { title, onTitleChange } = props
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">
          打
        </span>
        <span>
          taiko<span className={styles.brandDivider}>/</span>palco
        </span>
      </div>
      <div className={styles.projectHeading}>
        <label className={styles.srOnly} htmlFor="presentation-title">
          Nome da apresentação
        </label>
        <input
          id="presentation-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={80}
        />
        <span className={styles.localLabel}>
          <span /> Sessão local · salvamento manual em arquivo
        </span>
      </div>
      <span className={styles.version}>PRIMEIRO FLUXO · M05</span>
    </header>
  )
}
