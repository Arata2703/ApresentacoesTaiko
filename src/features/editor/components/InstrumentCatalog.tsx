import { catalog, type InstrumentKind } from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import type { CustomInstrument } from '../../../domain/presentation/model'
import { NewInstrumentForm } from './NewInstrumentForm'
import styles from '../editor.module.css'

interface Props {
  onAdd: (kind: InstrumentKind, customInstrumentId?: string) => void
  custom: readonly CustomInstrument[]
  onCreate: (input: Omit<CustomInstrument, 'id'>) => void
}
export function InstrumentCatalog(props: Props) {
  const { onAdd, custom, onCreate } = props
  const items = [
    ...catalog,
    ...custom.map((item) => ({ ...item, customInstrumentId: item.id })),
  ]
  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <div className={styles.catalogHeading}>
        <h2 id="catalog-title">Instrumentos</h2>
        <p>Clique para adicionar</p>
      </div>
      <NewInstrumentForm custom={custom} onCreate={onCreate} />
      <div className={styles.catalogItems}>
        {items.map((item) => (
          <button
            key={
              'customInstrumentId' in item ? item.customInstrumentId : item.kind
            }
            className={styles.catalogItem}
            data-button-style="instrument"
            onClick={() =>
              onAdd(
                item.kind,
                'customInstrumentId' in item
                  ? item.customInstrumentId
                  : undefined,
              )
            }
            aria-label={`Adicionar ${item.name}`}
          >
            <InstrumentSymbol
              kind={item.kind}
              png={'png' in item ? item.png : undefined}
              small
            />
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
