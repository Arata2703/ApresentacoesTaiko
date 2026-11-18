import type { InstrumentKind } from '../../../domain/stage'
import { instrumentIconPath } from '../../../visuals/instrumentIcon'
import { instrumentPngUrl } from '../../../domain/presentation/customInstruments'
import styles from '../editor.module.css'

const iconUrls = import.meta.glob<string>('./instruments/*.svg', {
  base: '../../../visuals',
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

export function InstrumentSymbol({
  kind,
  small = false,
  png,
}: {
  kind: InstrumentKind
  small?: boolean
  png?: string
}) {
  const url = png ? instrumentPngUrl(png) : iconUrls[instrumentIconPath(kind)]
  const size = small
    ? styles.smallSymbol
    : kind === 'oodaiko'
      ? styles.largeDrum
      : ''
  if (!url) {
    return (
      <span
        aria-hidden="true"
        className={`${styles.symbol} ${styles.flute} ${size}`}
      >
        <span />
      </span>
    )
  }
  return (
    <img
      alt=""
      aria-hidden="true"
      className={`${styles.symbol} ${size}`}
      src={url}
      draggable={false}
    />
  )
}
