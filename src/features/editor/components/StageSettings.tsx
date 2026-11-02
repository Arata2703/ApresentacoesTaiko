import { useState } from 'react'
import type { StageDimensions } from '../../../domain/presentation/model'
import { dimensions } from '../../../domain/presentation/rules'
import styles from './stageSettings.module.css'

export function StageSettings({
  stage,
  onApply,
}: {
  stage: StageDimensions
  onApply: (stage: StageDimensions) => void
}) {
  const [width, setWidth] = useState(String(stage.width))
  const [depth, setDepth] = useState(String(stage.depth))
  const [error, setError] = useState('')
  return (
    <details className={styles.settings}>
      <summary>
        Medidas do palco · {stage.width} × {stage.depth} m
      </summary>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          try {
            onApply(dimensions({ width: Number(width), depth: Number(depth) }))
            setError('')
          } catch {
            setError('Informe largura e profundidade maiores que zero.')
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
          Ao reduzir o palco, instrumentos fora dos limites são trazidos para a
          borda. A plateia fica no topo.
        </p>
        {error && <p role="alert">{error}</p>}
      </form>
    </details>
  )
}
