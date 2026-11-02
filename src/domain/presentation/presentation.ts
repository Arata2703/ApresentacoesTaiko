import type { Presentation } from './model'
import { named } from './rules'

export function createPresentation(id: string, title: string): Presentation {
  if (!id.trim() || id !== id.trim()) throw new Error('Informe um ID válido.')
  return {
    id,
    title: named(title),
    people: [],
    rosterIds: [],
    maps: [],
    transitions: [],
    sequence: [],
    materials: [],
  }
}

export function renamePresentation(
  presentation: Presentation,
  title: string,
): Presentation {
  return { ...presentation, title: named(title) }
}
