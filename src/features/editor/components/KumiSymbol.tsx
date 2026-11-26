import { ControlIcon } from '../../../visuals/ControlIcon'
import type {
  Kumi,
  MusicMap,
  Presentation,
} from '../../../domain/presentation/model'
import { customInstrumentFor } from '../../../domain/presentation/customInstruments'
import { InstrumentSymbol } from './InstrumentSymbol'
import css from '../stageSelection.module.css'

export function KumiSymbol({
  kumi,
  map,
  presentation,
}: {
  kumi: Kumi
  map: MusicMap
  presentation: Presentation
}) {
  const items = map.instruments.filter((item) =>
    kumi.instrumentIds.includes(item.id),
  )
  return (
    <span
      className={css.kumiSymbol}
      role="img"
      aria-label={
        items.length > 4
          ? `Símbolo padrão de Kumi com ${items.length} instrumentos`
          : 'Miniatura dos instrumentos do Kumi'
      }
    >
      {items.length > 4 ? (
        <span className={css.kumiFallback}>
          <ControlIcon name="group" />
        </span>
      ) : (
        items.map((item) => (
          <span
            key={item.id}
            style={{ transform: `rotate(${item.rotation}deg)` }}
          >
            <InstrumentSymbol
              kind={item.kind}
              png={customInstrumentFor(presentation, item)?.png}
              small
            />
          </span>
        ))
      )}
    </span>
  )
}
