import { ConfirmationPopup } from '../../../components/ConfirmationPopup'
import { useState } from 'react'
import type { StageDimensions } from '../../../domain/presentation/model'
import { dimensions } from '../../../domain/presentation/rules'
import { StageResizeConflict } from '../../../domain/presentation/maps'
import styles from './stageSettings.module.css'

export function StageSettings({
  stage,
  onApply,
}: {
  stage: StageDimensions
  onApply: (stage: StageDimensions, allowReposition?: boolean) => void
}) {
  const [width, setWidth] = useState(String(stage.width))
  const [depth, setDepth] = useState(String(stage.depth))
  const [error, setError] = useState('')
  const [pending, setPending] = useState<{
    stage: StageDimensions
    affected: StageResizeConflict['affected']
  } | null>(null)
  const dismiss = () => setPending(null)
  return (
    <details className={styles.settings}>
      <summary>
        Medidas do palco · {stage.width} × {stage.depth} m
      </summary>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const next = { width: Number(width), depth: Number(depth) }
          setError('')
          try {
            onApply(dimensions(next))
          } catch (failure) {
            if (failure instanceof StageResizeConflict)
              setPending({ stage: next, affected: failure.affected })
            else setError((failure as Error).message)
          }
        }}
      >
        <label>
          Largura do palco · m
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={width}
            onChange={(event) => setWidth(event.target.value)}
          />
        </label>
        <label>
          Profundidade do palco · m
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={depth}
            onChange={(event) => setDepth(event.target.value)}
          />
        </label>
        <button type="submit">Aplicar medidas</button>
        <p>
          As medidas valem para todos os mapas. Os instrumentos mantêm sua
          posição em relação ao centro do palco.
        </p>
        {error && <p role="alert">{error}</p>}
      </form>
      {pending && (
        <ConfirmationPopup
          title="Prosseguir com o redimensionamento?"
          dismissActionIndex={0}
          actions={[
            { label: 'Cancelar', onClick: dismiss },
            {
              label: 'Confirmar',
              onClick: () => {
                onApply(pending.stage, true)
                setPending(null)
              },
            },
          ]}
        >
          <p>
            Algumas músicas precisarão ter instrumentos reposicionados. Ao
            prosseguir, os instrumentos afetados irão para a borda mais próxima.
          </p>
          <ul>
            {pending.affected.map((map) => (
              <li key={map.id}>{map.title}</li>
            ))}
          </ul>
        </ConfirmationPopup>
      )}
    </details>
  )
}
