import styles from '../editor.module.css'

interface Props {
  message: string
}
export function EditorFooter(props: Props) {
  const { message } = props
  if (!message) return null
  return (
    <footer className={styles.footer}>
      <span role="status" aria-live="polite">
        {message}
      </span>
    </footer>
  )
}
