import { useState } from 'react'
import { catalog, type InstrumentKind } from '../../../domain/stage'
import { CatalogInstrumentItem } from './CatalogInstrumentItem'
import type {
  CustomInstrument,
  Presentation,
  Kumi,
  MusicMap,
} from '../../../domain/presentation/model'
import { InstrumentForm } from './InstrumentForm'
import { CustomInstrumentRemoval } from './CustomInstrumentRemoval'
import { NewInstrumentForm } from './NewInstrumentForm'
import styles from '../editor.module.css'
import { KumiSymbol } from './KumiSymbol'

interface Props {
  onAdd: (kind: InstrumentKind, customInstrumentId?: string) => void
  custom: readonly CustomInstrument[]
  presentation: Presentation
  onEdit: (id: string, input: Omit<CustomInstrument, 'id'>) => void
  onRemove: (id: string) => void
  onCreate: (input: Omit<CustomInstrument, 'id'>) => void
  onAddKumi?: (id: string, mapId: string) => void
}
export function InstrumentCatalog(props: Props) {
  const { onAdd, custom, onCreate } = props
  const [editing, setEditing] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const items = [
    ...catalog,
    ...custom.map((item) => ({ ...item, customInstrumentId: item.id })),
  ]
  const namedKumis = new Map<string, { kumi: Kumi; map: MusicMap }>()
  for (const map of props.presentation.maps)
    for (const kumi of map.kumis ?? []) {
      const key = kumi.name.trim().toLocaleLowerCase('pt-BR')
      if (key && !namedKumis.has(key)) namedKumis.set(key, { kumi, map })
    }
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
        {[...namedKumis.values()].map(({ kumi, map }) => (
          <CatalogInstrumentItem
            key={kumi.id}
            name={kumi.name}
            kind="okedo"
            onAdd={() => props.onAddKumi?.(kumi.id, map.id)}
            symbol={
              <KumiSymbol
                kumi={kumi}
                map={map}
                presentation={props.presentation}
              />
            }
          />
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
