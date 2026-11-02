import type { CSSProperties, KeyboardEvent } from 'react'
import {
  stageSize,
  getInstrumentType,
  type InstrumentKind,
  type StageInstrument,
} from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import styles from '../editor.module.css'

interface Props {
  instruments: StageInstrument[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (kind: InstrumentKind) => void
  onMove: (id: string, dx: number, dy: number) => void
}
export function StageMap(props: Props) {
  const { instruments, selectedId, onSelect, onAdd, onMove } = props
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
    <section className={styles.stageArea} aria-label="Palco de 10 por 6 metros">
      <div className={styles.stageToolbar}>
        <span>VISTA SUPERIOR</span>
        <span>
          {stageSize.width} × {stageSize.depth} m
        </span>
      </div>
      <div className={styles.audience}>
        <span />
        PLATEIA
        <span />
      </div>
      <div className={styles.stage}>
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
                  '--x': `${(item.x / stageSize.width) * 100}%`,
                  '--y': `${(item.y / stageSize.depth) * 100}%`,
                  '--rotation': `${item.rotation}deg`,
                } as CSSProperties
              }
              onClick={() => onSelect(item.id)}
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
        <span>10 m</span>
      </div>
      <p className={styles.stageHint}>
        {instruments.length
          ? 'Selecione um instrumento para editar. Use as setas do teclado para mover.'
          : 'A grade é uma referência de posição. As dimensões dos ícones são ilustrativas.'}
      </p>
    </section>
  )
}
