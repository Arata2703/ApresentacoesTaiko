import {
  getInstrumentType,
  type StageInstrument,
  type InstrumentChanges,
} from '../../../domain/stage'
import styles from '../editor.module.css'

interface Props {
  selected?: StageInstrument
  onChange: (changes: InstrumentChanges) => void
  onRemove: () => void
}
export function InstrumentProperties(props: Props) {
  const { selected, onChange, onRemove } = props
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
              onChange={(event) => onChange({ player: event.target.value })}
              maxLength={60}
            />
          </label>
          <div className={styles.field}>
            Base padrão
            <span className={styles.readOnly}>{selectedType.base}</span>
          </div>
          <div className={styles.positionFields}>
            <label className={styles.field}>
              Horizontal · m
              <input
                type="number"
                min="0.5"
                max="9.5"
                step="0.1"
                value={Number(selected.x.toFixed(1))}
                onChange={(event) =>
                  onChange({ x: event.target.valueAsNumber })
                }
              />
            </label>
            <label className={styles.field}>
              Profundidade · m
              <input
                type="number"
                min="0.6"
                max="5.4"
                step="0.1"
                value={Number(selected.y.toFixed(1))}
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
              max="345"
              step="15"
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
