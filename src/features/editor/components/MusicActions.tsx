import { useState } from 'react'
import { ConfirmationPopup } from '../../../components/ConfirmationPopup'
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
        <ConfirmationPopup
          title={`Remover mapa ${song}`}
          dismissActionIndex={1}
          actions={[
            { label: 'Confirmar remoção do mapa', onClick: onRemove },
            { label: 'Cancelar', onClick: () => setConfirming(false) },
          ]}
        >
          {' '}
          <p>
            Remover o mapa “{song}” e seus instrumentos? Os integrantes e os
            textos das transições serão preservados. Transições afetadas serão
            sinalizadas para revisão.
          </p>
        </ConfirmationPopup>
      )}
    </div>
  )
}
