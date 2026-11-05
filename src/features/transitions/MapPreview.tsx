import type { CSSProperties } from 'react'
import { getInstrumentType } from '../../domain/stage'
import type { projectMap } from '../editor/editorProjection'
import { InstrumentSymbol } from '../editor/components/InstrumentSymbol'
import styles from './transitions.module.css'

export function MapPreview({
  map,
  label,
  empty,
  onOpen,
}: {
  map: ReturnType<typeof projectMap>
  label: string
  empty: string
  onOpen: () => void
}) {
  return (
    <section className={styles.preview} aria-label={label}>
      <h2>{label}</h2>
      {map ? (
        <>
          <h3>{map.song}</h3>
          <p className={styles.caption}>
            Plateia · {map.stage.width} × {map.stage.depth} m
          </p>
          <div
            className={styles.stage}
            style={{ aspectRatio: `${map.stage.width}/${map.stage.depth}` }}
          >
            {map.instruments.map((item) => (
              <div
                key={item.id}
                className={styles.instrument}
                style={
                  {
                    left: `${(100 * item.x) / map.stage.width}%`,
                    top: `${(100 * item.y) / map.stage.depth}%`,
                  } as CSSProperties
                }
              >
                <span style={{ transform: `rotate(${item.rotation}deg)` }}>
                  <InstrumentSymbol kind={item.kind} small />
                </span>
                <span>{item.player || getInstrumentType(item.kind).name}</span>
              </div>
            ))}
            {!map.instruments.length && (
              <p className={styles.empty}>Mapa sem instrumentos</p>
            )}
          </div>
          <p className={styles.caption}>
            Fundo do palco · referência automática
          </p>
          <button onClick={onOpen}>
            Editar {label.toLocaleLowerCase('pt-BR')}
          </button>
        </>
      ) : (
        <p className={styles.missing}>{empty}</p>
      )}
    </section>
  )
}
