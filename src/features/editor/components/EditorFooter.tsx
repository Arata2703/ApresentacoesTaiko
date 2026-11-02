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
        Baixe a apresentação editável antes de sair. Recarregar a página limpa a
        sessão.
      </span>
    </footer>
  )
}
