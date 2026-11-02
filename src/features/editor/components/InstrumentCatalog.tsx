import { catalog, type InstrumentKind } from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import styles from '../editor.module.css'

interface Props {
  onAdd: (kind: InstrumentKind) => void
}
export function InstrumentCatalog(props: Props) {
  const { onAdd } = props
  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <div className={styles.catalogHeading}>
        <h2 id="catalog-title">Instrumentos</h2>
        <p>Clique para adicionar</p>
      </div>
      <div className={styles.catalogItems}>
        {catalog.map((item) => (
          <button
            key={item.kind}
            className={styles.catalogItem}
            onClick={() => onAdd(item.kind)}
            aria-label={`Adicionar ${item.name}`}
          >
            <InstrumentSymbol kind={item.kind} small />
            <span>{item.name}</span>
            <span className={styles.addSign} aria-hidden="true">
              +
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
