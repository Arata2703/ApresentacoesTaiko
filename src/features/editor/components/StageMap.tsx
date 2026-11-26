import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import type { InstrumentKind } from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import type {
  StageDimensions,
  Person,
} from '../../../domain/presentation/model'
import type { EditorInstrument } from '../editorProjection'
import { StagePlayerEditor } from '../../people/StagePlayerEditor'
import type { PlayerReference } from '../../people/playerDraft'
import type { StageSelection } from '../useStageSelection'
import { useStageGestures } from '../useStageGestures'
import selectionStyles from '../stageSelection.module.css'
import styles from '../editor.module.css'
import playerStyles from '../../people/stagePlayerEditor.module.css'
import { caretOffsetAtPoint } from '../../people/caretOffset'
import { useSelectionKeyboard } from '../useSelectionKeyboard'

interface Props {
  stage: StageDimensions
  instruments: EditorInstrument[]
  people: readonly Person[]
  onCommitPlayers: (
    instrumentId: string,
    players: readonly PlayerReference[],
  ) => void
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (kind: InstrumentKind) => void
  selection: StageSelection
  surface: RefObject<HTMLDivElement | null>
  onImageLoad: (image: HTMLImageElement) => void
  surfaceSize: { width: number; height: number }
  showNames: boolean
}
export function StageMap({
  instruments,
  selectedId,
  onSelect,
  onAdd,
  stage,
  people,
  onCommitPlayers,
  selection,
  surface,
  onImageLoad,
  surfaceSize,
  showNames,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialCaret, setInitialCaret] = useState<number | undefined>(
    undefined,
  )
  const gestures = useStageGestures(surface, stage, selection)
  useSelectionKeyboard(
    selection.ids.length,
    () => {
      gestures.closeMenu()
      setEditingId(null)
      selection.remove()
    },
    () => selection.select(selection.entityIds),
  )
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
    selection.move(selection.ids.includes(id) ? selection.ids : [id], ...move)
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
      onClick={(event) => {
        if (!(event.target as Element).closest('[data-stage-surface]')) {
          setEditingId(null)
          selection.select([])
        }
      }}
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
        data-stage-surface
        style={{ aspectRatio: `${stage.width} / ${stage.depth}` }}
        onLoadCapture={(event) => {
          if (event.target instanceof HTMLImageElement)
            onImageLoad(event.target)
        }}
        onPointerDown={gestures.down}
        onPointerMove={gestures.move}
        onPointerUp={gestures.end}
        onPointerCancel={gestures.end}
        onContextMenu={(event) => {
          event.preventDefault()
          if (
            'pointerType' in event.nativeEvent &&
            event.nativeEvent.pointerType === 'touch'
          )
            return
          gestures.open(event.clientX, event.clientY)
        }}
        onDoubleClick={(event) => {
          if (
            !(event.target as Element).closest(
              '[data-stage-label], [role="menu"]',
            )
          )
            gestures.doubleClick(event.clientX, event.clientY)
        }}
        onKeyDown={(event) => {
          if (
            (event.target as Element).closest(
              'input,[data-stage-label],[role="menu"]',
            )
          )
            return
          if (event.key === 'Escape') {
            gestures.closeMenu()
            selection.select([])
          }
          if (
            event.key === 'ContextMenu' ||
            (event.shiftKey && event.key === 'F10')
          ) {
            event.preventDefault()
            const rect = surface.current!.getBoundingClientRect()
            gestures.open(rect.left + 10, rect.top + 10)
          }
        }}
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
            <button
              className="empty-stage-action"
              onClick={() => onAdd('okedo')}
            >
              Adicionar um okedo <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
        {selection.groups.map((kumi) => {
          const box = selection.box(kumi.id)
          return (
            <div
              key={kumi.id}
              data-entity-id={kumi.id}
              data-kumi-id={kumi.id}
              className={`${selectionStyles.kumi} ${selection.ids.includes(kumi.id) ? selectionStyles.selectedKumi : ''} ${selection.editing?.id === kumi.id ? selectionStyles.editingKumi : ''}`}
              style={{
                left: `${(box.left / stage.width) * 100}%`,
                top: `${(box.top / stage.depth) * 100}%`,
                width: `${((box.right - box.left) / stage.width) * 100}%`,
                height: `${((box.bottom - box.top) / stage.depth) * 100}%`,
              }}
            >
              <button
                data-button-style="instrument"
                className={selectionStyles.groupTarget}
                aria-label={`Selecionar ${kumi.name || 'Kumi'}`}
                aria-pressed={selection.ids.includes(kumi.id)}
                onClick={(event) => {
                  if (event.detail === 0) selection.select([kumi.id])
                }}
                onKeyDown={(event) => handleKeyDown(event, kumi.id)}
              />
              {showNames && (
                <div data-stage-label className={selectionStyles.groupLabel}>
                  {editingId === kumi.id ? (
                    <StagePlayerEditor
                      people={people}
                      selectedIds={kumi.playerIds}
                      onCommit={(players) => {
                        onCommitPlayers(kumi.id, players)
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <button
                      data-button-style="instrument"
                      className={playerStyles.nameField}
                      aria-label={`Editar tocadores do ${kumi.name || 'Kumi'}`}
                      onClick={() => setEditingId(kumi.id)}
                    >
                      {kumi.playerIds
                        .map((id) => people.find((p) => p.id === id)!.name)
                        .join('/') || 'Definir tocador'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {instruments.map((item) => {
          const key = selection.keyFor(item.id)
          const hit = selection.box(item.id)
          const { width, height } = surfaceSize
          const grouped = selection.groups.some((k) =>
            k.instrumentIds.includes(item.id),
          )
          return (
            <div
              key={item.id}
              data-stage-instrument
              data-instrument-id={item.id}
              data-rotation={item.rotation}
              data-entity-id={key}
              className={`${styles.stageInstrument} ${
                selection.ids.includes(key) ? styles.selected : ''
              } ${selection.editing && !selection.entityIds.includes(item.id) ? selectionStyles.muted : ''}`}
              style={
                {
                  '--x': `${(item.x / stage.width) * 100}%`,
                  '--y': `${(item.y / stage.depth) * 100}%`,
                  '--rotation': `${item.rotation}deg`,
                } as CSSProperties
              }
            >
              <button
                data-button-style="instrument"
                className={styles.instrumentButton}
                style={{
                  left: `calc(50% + ${((hit.left - item.x) / stage.width) * width}px)`,
                  top: `calc(50% + ${((hit.top - item.y) / stage.depth) * height}px)`,
                  width: `${((hit.right - hit.left) / stage.width) * width}px`,
                  height: `${((hit.bottom - hit.top) / stage.depth) * height}px`,
                }}
                onClick={(event) => {
                  if (event.detail > 0) return
                  setEditingId(null)
                  const append =
                    event.shiftKey || event.ctrlKey || event.metaKey
                  selection.select(
                    append
                      ? selection.ids.includes(key)
                        ? selection.ids.filter((id) => id !== key)
                        : [...selection.ids, key]
                      : [key],
                  )
                }}
                onKeyDown={(event) => handleKeyDown(event, key)}
                aria-pressed={selection.ids.includes(key)}
                aria-label={`${item.name}${
                  item.player ? `, tocador ${item.player}` : ', sem tocador'
                }. Use as setas para mover.`}
              ></button>
              <span className={styles.rotating}>
                <InstrumentSymbol kind={item.kind} png={item.png} />
              </span>
              {showNames &&
                !grouped &&
                (editingId === item.id && selectedId === item.id ? (
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
                    data-stage-label
                    tabIndex={0}
                    aria-label={`Editar tocadores de ${item.name}${
                      item.player ? `: ${item.player}` : ''
                    }`}
                    title="Clique para editar. Duplo clique para selecionar o texto."
                    className={`${styles.instrumentLabel} ${playerStyles.nameField}`}
                    onClick={(event) =>
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
                    {item.player || item.name}
                  </span>
                ))}
            </div>
          )
        })}
        {gestures.rectangle && (
          <div
            className={selectionStyles.marquee}
            style={{
              left: `${(gestures.rectangle.left / stage.width) * 100}%`,
              top: `${(gestures.rectangle.top / stage.depth) * 100}%`,
              width: `${((gestures.rectangle.right - gestures.rectangle.left) / stage.width) * 100}%`,
              height: `${((gestures.rectangle.bottom - gestures.rectangle.top) / stage.depth) * 100}%`,
            }}
          />
        )}
        {gestures.menu && (
          <div
            role="menu"
            aria-label="Ações da seleção"
            className={selectionStyles.menu}
            style={{ left: gestures.menu.x, top: gestures.menu.y }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') gestures.closeMenu()
            }}
          >
            {selection.ids.some((id) =>
              selection.groups.some((k) => k.id === id),
            ) &&
              !selection.editing && (
                <button
                  role="menuitem"
                  onClick={() => {
                    selection.ungroup()
                    gestures.closeMenu()
                  }}
                >
                  Desagrupar
                </button>
              )}
            <button
              role="menuitem"
              onClick={() => {
                selection.duplicate()
                gestures.closeMenu()
              }}
            >
              Duplicar
            </button>
            <button
              role="menuitem"
              onClick={() => {
                selection.remove()
                gestures.closeMenu()
              }}
            >
              Apagar
            </button>
          </div>
        )}
      </div>
      <div className={styles.stageBottom}>
        <span>FUNDO DO PALCO</span>
        <span>{stage.width} m</span>
      </div>
      {instruments.length > 0 && (
        <p className={styles.stageHint}>
          Arraste ou use as setas para mover. Clique no nome para editar os
          tocadores.
        </p>
      )}
    </section>
  )
}
