import type { Person } from '../../domain/presentation/model'

export type PlayerSuggestion = { id: string; name: string; label: string }

export function normalizePlayerName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

export function playerSuggestions(
  people: readonly Person[],
  query: string,
): PlayerSuggestion[] {
  const search = normalizePlayerName(query.trim())
  return people
    .map((person, index) => ({ person, index }))
    .filter(({ person }) => normalizePlayerName(person.name).includes(search))
    .slice(0, 8)
    .map(({ person, index }) => ({
      id: person.id,
      name: person.name,
      label: `${person.name} · pessoa ${index + 1}`,
    }))
}
