import { catalog, type InstrumentKind } from '../stage'
import type { BaseId } from './model'

export interface BaseDefinition {
  readonly id: BaseId
  readonly name: string
  readonly kinds: readonly InstrumentKind[]
}
interface InstrumentDefinition {
  readonly kind: InstrumentKind
  readonly name: string
  readonly appearance: 'drum' | 'flat' | 'flute' | 'hand'
  readonly defaultBaseId: BaseId | null
  readonly dimensions: null
}
export const bases: readonly BaseDefinition[] = [
  { id: 'okedo-suwaridai', name: 'Okedo suwaridai', kinds: ['okedo'] },
  { id: 'okedo-naname', name: 'Okedo naname', kinds: ['okedo'] },
  { id: 'okedo-eitetsu', name: 'Okedo Eitetsu', kinds: ['okedo'] },
  { id: 'okedo-tachi', name: 'Okedo Tachi', kinds: ['okedo'] },
  { id: 'shime-suwaridai', name: 'Shime suwaridai', kinds: ['shime'] },
  { id: 'shime-tachidai', name: 'Shime tachidai', kinds: ['shime'] },
  {
    id: 'nagado-suwaridai',
    name: 'Nagado suwaridai',
    kinds: ['nagado-p', 'nagado-m', 'nagado-g'],
  },
  {
    id: 'nagado-tachi',
    name: 'Nagado tachi',
    kinds: ['nagado-p', 'nagado-m', 'nagado-g'],
  },
]
const defaultBases: Record<InstrumentKind, BaseId | null> = {
  okedo: 'okedo-suwaridai',
  shime: 'shime-suwaridai',
  'nagado-p': 'nagado-suwaridai',
  'nagado-m': 'nagado-suwaridai',
  'nagado-g': 'nagado-suwaridai',
  tekan: null,
  take: null,
  katsugi: null,
  youko: null,
  chyappa: null,
  fue: null,
  oodaiko: null,
}
export const instrumentDefinitions: readonly InstrumentDefinition[] =
  catalog.map(({ kind, name, appearance }) => ({
    kind,
    name,
    appearance,
    defaultBaseId: defaultBases[kind],
    // Actual instrument dimensions have not been supplied yet.
    dimensions: null,
  }))

export function instrumentDefinition(kind: InstrumentKind) {
  const definition = instrumentDefinitions.find((item) => item.kind === kind)
  if (!definition) throw new Error('Instrumento fora do catálogo do MVP.')
  return definition
}

export function assertCompatibleBase(kind: InstrumentKind, id: BaseId | null) {
  if (id === null) return
  const base = bases.find((item) => item.id === id)
  if (!base || !base.kinds.includes(kind))
    throw new Error('Base incompatível com o instrumento.')
}
