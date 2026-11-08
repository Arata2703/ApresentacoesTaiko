import type {
  Presentation,
  SequenceItem,
} from '../../../domain/presentation/model'
import styles from './showOrder.module.css'

interface Props {
  presentation: Presentation
  onAddEntry: () => void
  onBack: () => void
  onOpen: (item: SequenceItem) => void
}

export function ShowOrder({
  presentation: p,
  onAddEntry,
  onBack,
  onOpen,
}: Props) {
  return (
    <section className={styles.page} aria-labelledby="show-order-title">
      <div className={styles.heading}>
        <h1 id="show-order-title">Ordem da apresentação</h1>
        <button type="button" onClick={onBack}>
          Voltar aos mapas
        </button>
      </div>
      {p.maps.length > 0 && (
        <button className={styles.entry} type="button" onClick={onAddEntry}>
          Adicionar transição de entrada
        </button>
      )}
      <ol className={styles.flow} aria-label="Sequência da apresentação">
        {p.sequence.map((item, index) => {
          const transition =
            item.kind === 'transition'
              ? p.transitions.find((transition) => transition.id === item.id)!
              : null
          const title = transition
            ? transition.tsunagiName || 'Sem nome'
            : p.maps.find((map) => map.id === item.id)!.title ||
              'Música sem título'
          return (
            <li key={item.id}>
              <button
                className={transition ? styles.transition : styles.map}
                type="button"
                aria-label={`Abrir ${transition ? 'tsunagi' : 'música'} ${index + 1}: ${title}`}
                onClick={() => onOpen(item)}
              >
                <span className={styles.kind}>
                  {index + 1} · {transition ? 'TSUNAGI' : 'MAPA DE PALCO'}
                </span>
                <strong>{title}</strong>
                {transition?.needsReview && (
                  <span className={styles.review}>Revisar transição</span>
                )}
              </button>
              {index < p.sequence.length - 1 && (
                <svg
                  className={styles.arrow}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4 12h16m-6-6 6 6-6 6" />
                </svg>
              )}
            </li>
          )
        })}
      </ol>
      {!p.sequence.length && (
        <p>Nenhuma música ou transição nesta apresentação.</p>
      )}
    </section>
  )
}
