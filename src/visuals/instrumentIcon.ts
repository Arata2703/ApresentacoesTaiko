import { catalogInstrumentKind, type InstrumentKind } from '../domain/stage'

export function instrumentIconPath(kind: InstrumentKind): string {
  const canonical = catalogInstrumentKind(kind)
  return `./instruments/${canonical === 'fue' ? 'shinobue' : canonical}.svg`
}
