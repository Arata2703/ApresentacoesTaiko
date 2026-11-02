import { getInstrumentType, type InstrumentKind } from '../../../domain/stage'
import styles from '../editor.module.css'

export function InstrumentSymbol({
  kind,
  small = false,
}: {
  kind: InstrumentKind
  small?: boolean
}) {
  const type = getInstrumentType(kind)
  return (
    <span
      aria-hidden="true"
      className={`${styles.symbol} ${styles[type.appearance]} ${small ? styles.smallSymbol : ''} ${kind === 'oodaiko' ? styles.largeDrum : ''}`}
    >
      <span />
    </span>
  )
}
