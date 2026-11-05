import { useState } from 'react'
import styles from './musicSequence.module.css'

export function MusicActions({
  song,
  onDuplicate,
  onRemove,
}: {
  song: string
  onDuplicate: () => void
  onRemove: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className={styles.actions}>
      <button onClick={onDuplicate}>Duplicar mapa</button>
      <button onClick={() => setConfirming(true)}>Remover mapa</button>
      {confirming && (
        <div
          className={styles.confirm}
          role="alertdialog"
          aria-label={`Remover mapa ${song}`}
        >
          <p>
            Remover o mapa “{song}” e seus instrumentos? Os integrantes e os
            textos das transições serão preservados. Transições afetadas serão
            sinalizadas para revisão.
          </p>
          <button onClick={onRemove}>Confirmar remoção do mapa</button>
          <button onClick={() => setConfirming(false)}>Cancelar</button>
        </div>
      )}
    </div>
  )
}
