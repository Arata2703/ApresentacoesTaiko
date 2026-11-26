import { useState } from 'react'
import { catalog, type InstrumentKind } from '../../../domain/stage'
import { CatalogInstrumentItem } from './CatalogInstrumentItem'
import type {
  CustomInstrument,
  Presentation,
} from '../../../domain/presentation/model'
import { InstrumentForm } from './InstrumentForm'
import { CustomInstrumentRemoval } from './CustomInstrumentRemoval'
import { NewInstrumentForm } from './NewInstrumentForm'
import styles from '../editor.module.css'

interface Props {
  onAdd: (kind: InstrumentKind, customInstrumentId?: string) => void
  custom: readonly CustomInstrument[]
  presentation: Presentation
  onEdit: (id: string, input: Omit<CustomInstrument, 'id'>) => void
  onRemove: (id: string) => void
  onCreate: (input: Omit<CustomInstrument, 'id'>) => void
}
export function InstrumentCatalog(props: Props) {
  const { onAdd, custom, onCreate } = props
  const [editing, setEditing] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
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
          <div
            key={
              'customInstrumentId' in item ? item.customInstrumentId : item.kind
            }
          >
            <CatalogInstrumentItem
              name={item.name}
              abbreviation={item.abbreviation}
              kind={item.kind}
              png={'png' in item ? item.png : undefined}
              onAdd={() =>
                onAdd(
                  item.kind,
                  'customInstrumentId' in item
                    ? item.customInstrumentId
                    : undefined,
                )
              }
              actions={
                'customInstrumentId' in item
                  ? {
                      onEdit: () =>
                        setEditing(editing === item.id ? null : item.id),
                      onRemove: () => setRemoving(item.id),
                    }
                  : undefined
              }
            />
            {'customInstrumentId' in item && editing === item.id && (
              <InstrumentForm
                key={item.id}
                custom={custom}
                initial={item}
                onCancel={() => setEditing(null)}
                onSave={(input) => {
                  props.onEdit(item.id, input)
                  setEditing(null)
                }}
              />
            )}
          </div>
        ))}
      </div>
      {removing && (
        <CustomInstrumentRemoval
          presentation={props.presentation}
          id={removing}
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            props.onRemove(removing)
            setRemoving(null)
          }}
        />
      )}
    </section>
  )
}
