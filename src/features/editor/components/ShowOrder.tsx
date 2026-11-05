import type { Presentation } from '../../../domain/presentation/model'
import styles from './musicSequence.module.css'
import { useState } from 'react'

export function ShowOrder({
  presentation: p,
  onAddEntry,
}: {
  presentation: Presentation
  onAddEntry: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <details
      className={styles.order}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Ordem da apresentação · {p.sequence.length} itens</summary>
      {open && p.maps.length > 0 && (
        <button type="button" onClick={onAddEntry}>
          Adicionar transição de entrada
        </button>
      )}
      {open && (
        <ol>
          {p.sequence.map((item) => (
            <li key={item.id}>
              {item.kind === 'map' ? (
                p.maps.find((map) => map.id === item.id)!.title
              ) : (
                <>
                  Tsunagi:{' '}
                  {p.transitions.find((t) => t.id === item.id)!.tsunagiName ||
                    'Sem nome'}
                  {p.transitions.find((t) => t.id === item.id)!.needsReview && (
                    <span className={styles.review}> · Revisar transição</span>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      {!p.sequence.length && (
        <p>Nenhuma música ou transição nesta apresentação.</p>
      )}
    </details>
  )
}
