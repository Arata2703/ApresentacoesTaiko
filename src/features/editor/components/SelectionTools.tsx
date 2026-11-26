import type { StageSelection } from '../useStageSelection'
import type { Align } from '../selectionGeometry'
import css from '../stageSelection.module.css'
import { ControlIcon, type ControlIconName } from '../../../visuals/ControlIcon'

const alignments: readonly [Align, string, ControlIconName][] = [
  ['left', 'À esquerda', 'align-start-vertical'],
  ['centerX', 'Centro horizontal', 'align-center-vertical'],
  ['right', 'À direita', 'align-end-vertical'],
  ['top', 'Ao topo', 'align-start-horizontal'],
  ['centerY', 'Centro vertical', 'align-center-horizontal'],
  ['bottom', 'À base', 'align-end-horizontal'],
]
export function SelectionTools({
  selection,
  showNames,
  onToggleNames,
}: {
  selection: StageSelection
  showNames: boolean
  onToggleNames: () => void
}) {
  return (
    <div className={css.tools}>
      <p aria-live="polite">
        {selection.editing ? 'Editando Kumi · ' : ''}
        {selection.ids.length} selecionado(s)
      </p>
      <label className={css.namesSwitch}>
        <input
          type="checkbox"
          role="switch"
          checked={showNames}
          onChange={onToggleNames}
        />
        Mostrar nomes
      </label>
      {selection.canForm && (
        <button onClick={selection.form}>Formar Kumi</button>
      )}
      {selection.selectedGroup && !selection.editing && (
        <button onClick={() => selection.edit(selection.selectedGroup!.id)}>
          Editar Kumi
        </button>
      )}
      {selection.editing && (
        <button onClick={() => selection.edit(null)}>Concluir edição</button>
      )}
      <fieldset>
        <legend>Alinhar</legend>
        {alignments.map(([action, label, icon]) => (
          <button
            key={action}
            aria-label={label}
            title={label}
            disabled={!selection.ids.length}
            onClick={() => selection.align(action)}
          >
            <ControlIcon name={icon} />
          </button>
        ))}
      </fieldset>
      <fieldset>
        <legend>Espaçar</legend>
        <button
          aria-label="Espaçar horizontalmente"
          title="Igualar distâncias entre centros (mínimo 3)"
          disabled={selection.ids.length < 3}
          onClick={() => selection.space('x')}
        >
          <ControlIcon name="align-horizontal-distribute-center" />
        </button>
        <button
          aria-label="Espaçar verticalmente"
          title="Igualar distâncias entre centros (mínimo 3)"
          disabled={selection.ids.length < 3}
          onClick={() => selection.space('y')}
        >
          <ControlIcon name="align-vertical-distribute-center" />
        </button>
      </fieldset>
      <fieldset>
        <legend>Espelhar</legend>
        <button
          aria-label="Espelhar esquerda e direita"
          title="Espelhar esquerda e direita"
          disabled={!selection.ids.length}
          onClick={() => selection.mirror('x')}
        >
          <ControlIcon name="flip-horizontal-2" />
        </button>
        <button
          aria-label="Espelhar frente e fundo"
          title="Espelhar frente e fundo"
          disabled={!selection.ids.length}
          onClick={() => selection.mirror('y')}
        >
          <ControlIcon name="flip-vertical-2" />
        </button>
      </fieldset>
    </div>
  )
}
