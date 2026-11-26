import {
  catalog,
  catalogInstrumentKind,
  type InstrumentKind,
  type InstrumentType,
} from '../stage'
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
  { id: 'shime-suwaridai', name: 'Shime suwaridai', kinds: ['shime'] },
  { id: 'shime-tachidai', name: 'Shime tachidai', kinds: ['shime'] },
  {
    id: 'nagado-suwaridai',
    name: 'Nagado suwaridai',
    kinds: ['nagado'],
  },
  {
    id: 'nagado-naname',
    name: 'Nagado naname',
    kinds: ['nagado'],
  },
]
// Historical assignments stay readable while these bases are absent from new choices.
export const allBaseDefinitions: readonly BaseDefinition[] = [
  ...bases,
  { id: 'okedo-tachi', name: 'Okedo Tachi', kinds: ['okedo'] },
  { id: 'nagado-tachi', name: 'Nagado tachi', kinds: ['nagado'] },
]
const defaultBases: Record<InstrumentType['kind'], BaseId | null> = {
  okedo: 'okedo-suwaridai',
  shime: 'shime-suwaridai',
  nagado: 'nagado-suwaridai',
  tekan: null,
  take: null,
  katsugi: null,
  youko: null,
  chyappa: null,
  fue: null,
  oodaiko: null,
  hiradaiko: null,
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
  const definition = instrumentDefinitions.find(
    (item) => item.kind === catalogInstrumentKind(kind),
  )
  if (!definition) throw new Error('Instrumento fora do catálogo do MVP.')
  return definition
}

export function assertCompatibleBase(kind: InstrumentKind, id: BaseId | null) {
  if (id === null) return
  const base = allBaseDefinitions.find((item) => item.id === id)
  if (!base || !base.kinds.includes(catalogInstrumentKind(kind)))
    throw new Error('Base incompatível com o instrumento.')
}

export function assertMapInstrumentBase(
  kind: InstrumentKind,
  id: BaseId | null,
  custom: boolean,
) {
  if (!custom) {
    assertCompatibleBase(kind, id)
  } else if (
    id !== null &&
    !allBaseDefinitions.some((base) => base.id === id)
  ) {
    throw new Error('Base desconhecida.')
  }
}
