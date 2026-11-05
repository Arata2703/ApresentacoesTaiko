import styles from '../editor.module.css'

interface Props {
  message: string
}
export function EditorFooter(props: Props) {
  const { message } = props
  return (
    <footer className={styles.footer}>
      <span role="status" aria-live="polite">
        {message}
      </span>
      <span>
        A cópia local fica neste navegador. Baixe o arquivo editável como
        backup.
      </span>
    </footer>
  )
}
