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
        Alterações apenas nesta sessão. Recarregar a página limpa o mapa.
      </span>
    </footer>
  )
}
