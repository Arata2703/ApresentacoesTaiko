import type { CSSProperties } from 'react'
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
                  <InstrumentSymbol kind={item.kind} png={item.png} small />
                </span>
                {!map.kumis.some((k) => k.instrumentIds.includes(item.id)) && (
                  <span>{item.player || item.name}</span>
                )}
              </div>
            ))}
            {map.kumis.map((k) => {
              const items = map.instruments.filter((i) =>
                k.instrumentIds.includes(i.id),
              )
              return (
                <div
                  key={k.id}
                  className={styles.instrument}
                  style={{
                    left: `${((Math.min(...items.map((i) => i.x)) + Math.max(...items.map((i) => i.x))) / 2 / map.stage.width) * 100}%`,
                    top: `${(Math.max(...items.map((i) => i.y)) / map.stage.depth) * 100}%`,
                    paddingTop: 24,
                  }}
                >
                  <span>{items[0]!.player}</span>
                </div>
              )
            })}
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
