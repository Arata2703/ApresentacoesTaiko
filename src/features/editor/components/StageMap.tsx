import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { getInstrumentType, type InstrumentKind } from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import type {
  StageDimensions,
  Person,
} from '../../../domain/presentation/model'
import type { EditorInstrument } from '../editorProjection'
import { StagePlayerEditor } from '../../people/StagePlayerEditor'
import type { PlayerReference } from '../../people/playerDraft'
import { useInstrumentDrag } from '../useInstrumentDrag'
import styles from '../editor.module.css'
import playerStyles from '../../people/stagePlayerEditor.module.css'
import { caretOffsetAtPoint } from '../../people/caretOffset'

interface Props {
  stage: StageDimensions
  instruments: EditorInstrument[]
  people: readonly Person[]
  onCommitPlayers: (
    instrumentId: string,
    players: readonly PlayerReference[],
  ) => void
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (kind: InstrumentKind) => void
  onMove: (id: string, dx: number, dy: number) => void
}
export function StageMap({
  instruments,
  selectedId,
  onSelect,
  onAdd,
  onMove,
  stage,
  people,
  onCommitPlayers,
}: Props) {
  const surface = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialCaret, setInitialCaret] = useState<number | undefined>(
    undefined,
  )
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
  function edit(id: string, caret?: number) {
    setInitialCaret(caret)
    onSelect(id)
    setEditingId(id)
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
        ref={surface}
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
            <div
              key={item.id}
              className={`${styles.stageInstrument} ${selectedId === item.id ? styles.selected : ''}`}
              style={
                {
                  '--x': `${(item.x / stage.width) * 100}%`,
                  '--y': `${(item.y / stage.depth) * 100}%`,
                  '--rotation': `${item.rotation}deg`,
                } as CSSProperties
              }
            >
              <button
                className={styles.instrumentButton}
                onClick={() => {
                  setEditingId(null)
                  onSelect(item.id)
                }}
                onPointerDown={(event) =>
                  drag.start(event, item.id, surface.current!)
                }
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
              </button>
              {editingId === item.id && selectedId === item.id ? (
                <StagePlayerEditor
                  key={item.id}
                  people={people}
                  selectedIds={item.playerIds}
                  initialCaret={initialCaret}
                  onCommit={(players) => {
                    onCommitPlayers(item.id, players)
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar tocadores de ${type.name}${item.player ? `: ${item.player}` : ''}`}
                  title="Duplo clique para editar os tocadores"
                  className={`${styles.instrumentLabel} ${playerStyles.nameField}`}
                  onClick={() => onSelect(item.id)}
                  onDoubleClick={(event) =>
                    edit(
                      item.id,
                      caretOffsetAtPoint(
                        event.currentTarget,
                        event.clientX,
                        event.clientY,
                      ),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === 'F2') {
                      event.preventDefault()
                      edit(item.id)
                    }
                  }}
                >
                  {item.player || type.name}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className={styles.stageBottom}>
        <span>FUNDO DO PALCO</span>
        <span>{stage.width} m</span>
      </div>
      <p className={styles.stageHint}>
        {instruments.length
          ? 'Arraste ou use as setas para mover. Duplo clique no nome para editar os tocadores.'
          : 'A grade é uma referência de posição. As dimensões dos ícones são ilustrativas.'}
      </p>
    </section>
  )
}
