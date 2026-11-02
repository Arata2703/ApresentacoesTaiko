import type { CSSProperties, KeyboardEvent } from 'react'
import {
  getInstrumentType,
  type InstrumentKind,
  type StageInstrument,
} from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import type { StageDimensions } from '../../../domain/presentation/model'
import { useInstrumentDrag } from '../useInstrumentDrag'
import styles from '../editor.module.css'

interface Props {
  stage: StageDimensions
  instruments: StageInstrument[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (kind: InstrumentKind) => void
  onMove: (id: string, dx: number, dy: number) => void
}
export function StageMap(props: Props) {
  const { instruments, selectedId, onSelect, onAdd, onMove, stage } = props
  const drag = useInstrumentDrag(onMove, stage)
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.1, 0],
      ArrowRight: [0.1, 0],
      ArrowUp: [0, -0.1],
      ArrowDown: [0, 0.1],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    onMove(id, ...move)
  }
  return (
    <section
      className={styles.stageArea}
      aria-label={`Palco de ${stage.width} por ${stage.depth} metros`}
    >
      <div className={styles.stageToolbar}>
        <span>VISTA SUPERIOR</span>
        <span>
          {stage.width} × {stage.depth} m
        </span>
      </div>
      <div className={styles.audience}>
        <span />
        PLATEIA
        <span />
      </div>
      <div
        className={styles.stage}
        style={{ aspectRatio: `${stage.width} / ${stage.depth}` }}
      >
        <div className={styles.stageBoundary} />
        {instruments.length === 0 && (
          <div className={styles.emptyStage}>
            <span className={styles.emptyMark} aria-hidden="true">
              +
            </span>
            <h2>O palco é seu.</h2>
            <p>
              Adicione o primeiro instrumento
              <br />e comece a desenhar sua formação.
            </p>
            <button onClick={() => onAdd('okedo')}>
              Adicionar um okedo <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
        {instruments.map((item) => {
          const type = getInstrumentType(item.kind)
          return (
            <button
              key={item.id}
              className={`${styles.stageInstrument} ${selectedId === item.id ? styles.selected : ''}`}
              style={
                {
                  '--x': `${(item.x / stage.width) * 100}%`,
                  '--y': `${(item.y / stage.depth) * 100}%`,
                  '--rotation': `${item.rotation}deg`,
                } as CSSProperties
              }
              onClick={() => onSelect(item.id)}
              onPointerDown={(event) => drag.start(event, item.id)}
              onPointerMove={drag.move}
              onPointerUp={drag.end}
              onPointerCancel={drag.end}
              onLostPointerCapture={drag.end}
              onKeyDown={(event) => handleKeyDown(event, item.id)}
              aria-pressed={selectedId === item.id}
              aria-label={`${type.name}${item.player ? `, tocador ${item.player}` : ', sem tocador'}. Use as setas para mover.`}
            >
              <span className={styles.rotating}>
                <InstrumentSymbol kind={item.kind} />
              </span>
              <span className={styles.instrumentLabel}>
                {item.player || type.name}
              </span>
            </button>
          )
        })}
      </div>
      <div className={styles.stageBottom}>
        <span>FUNDO DO PALCO</span>
        <span>{stage.width} m</span>
      </div>
      <p className={styles.stageHint}>
        {instruments.length
          ? 'Arraste ou use as setas para mover. Ajuste a rotação no painel lateral.'
          : 'A grade é uma referência de posição. As dimensões dos ícones são ilustrativas.'}
      </p>
    </section>
  )
}
