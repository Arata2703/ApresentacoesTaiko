import {
  getInstrumentType,
  type InstrumentChanges,
} from '../../../domain/stage'
import styles from '../editor.module.css'
import type { EditorInstrument } from '../editorProjection'
import type { StageDimensions } from '../../../domain/presentation/model'

interface Props {
  selected?: EditorInstrument
  stage: StageDimensions
  onChange: (changes: InstrumentChanges) => void
  onRemove: () => void
}
export function InstrumentProperties(props: Props) {
  const { selected, onChange, onRemove, stage } = props
  const selectedType = selected && getInstrumentType(selected.kind)
  return (
    <aside className={styles.properties} aria-labelledby="properties-title">
      <p className={styles.eyebrow}>PROPRIEDADES</p>
      {selected && selectedType ? (
        <>
          <h2 id="properties-title">{selectedType.name}</h2>
          <p className={styles.propertyCaption}>Instrumento selecionado</p>
          <label className={styles.field}>
            Nome do tocador
            <input
              placeholder="Ex.: Ana"
              value={selected.player}
              readOnly={selected.playerCount > 1}
              onChange={(event) => onChange({ player: event.target.value })}
              maxLength={80}
            />
          </label>
          <p className={styles.propertyCaption}>
            {selected.playerCount > 1
              ? 'Vários tocadores preservados. A edição dessas atribuições chegará com o cadastro de integrantes.'
              : 'Renomear um tocador atualiza seu nome onde ele estiver atribuído.'}
          </p>
          <div className={styles.field}>
            Base
            <span className={styles.readOnly}>{selected.baseLabel}</span>
          </div>
          <div className={styles.positionFields}>
            <label className={styles.field}>
              Horizontal · m
              <input
                type="number"
                min="0"
                max={stage.width}
                step="0.1"
                value={selected.x}
                onChange={(event) =>
                  onChange({ x: event.target.valueAsNumber })
                }
              />
            </label>
            <label className={styles.field}>
              Profundidade · m
              <input
                type="number"
                min="0"
                max={stage.depth}
                step="0.1"
                value={selected.y}
                onChange={(event) =>
                  onChange({ y: event.target.valueAsNumber })
                }
              />
            </label>
          </div>
          <label className={styles.field}>
            Rotação <span className={styles.angle}>{selected.rotation}°</span>
            <input
              aria-label="Rotação"
              type="range"
              min="0"
              max="359"
              step="1"
              value={selected.rotation}
              onChange={(event) =>
                onChange({ rotation: event.target.valueAsNumber })
              }
            />
          </label>
          <button className={styles.removeButton} onClick={onRemove}>
            Remover instrumento
          </button>
        </>
      ) : (
        <>
          <h2 id="properties-title">
            Cada detalhe <br />
            no seu lugar.
          </h2>
          <div className={styles.selectionSketch} aria-hidden="true">
            <span />
            <i />
            <i />
            <i />
            <i />
          </div>
          <p className={styles.propertyCaption}>
            Selecione um instrumento no palco para definir o tocador, a posição
            e a rotação.
          </p>
        </>
      )}
    </aside>
  )
}
