import type { Person } from '../../domain/presentation/model'
import { named } from '../../domain/presentation/rules'
import { normalizePlayerName } from './playerSuggestions'

export type PlayerReference = { id: string } | { name: string }

export function resolvePlayerDraft(
  text: string,
  people: readonly Person[],
  originalIds: readonly string[],
  choices: Readonly<Record<number, string>>,
): PlayerReference[] {
  if (!text.trim()) return []
  return text.split('/').map((token, index) => {
    const name = named(token)
    const normalized = normalizePlayerName(name)
    const known = people.find(
      (person) => person.id === (choices[index] ?? originalIds[index]),
    )
    if (known && normalizePlayerName(known.name) === normalized)
      return { id: known.id }
    const matches = people.filter(
      (person) => normalizePlayerName(person.name) === normalized,
    )
    if (matches.length > 1)
      throw new Error(
        'Há integrantes com o mesmo nome. Escolha a pessoa nas sugestões.',
      )
    return matches.length === 1 ? { id: matches[0]!.id } : { name }
  })
}
