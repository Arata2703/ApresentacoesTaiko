import type { Person } from '../../domain/presentation/model'

export type PlayerSuggestion =
  | { kind: 'person'; id: string; label: string }
  | { kind: 'create'; name: string; label: string }

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
  const name = query.trim()
  const search = normalizePlayerName(name)
  const results: PlayerSuggestion[] = people
    .map((person, index) => ({ person, index }))
    .filter(({ person }) => normalizePlayerName(person.name).includes(search))
    .slice(0, 8)
    .map(({ person, index }) => ({
      kind: 'person',
      id: person.id,
      label: `${person.name} · pessoa ${index + 1}`,
    }))
  if (
    name &&
    name.length <= 80 &&
    !people.some((person) => normalizePlayerName(person.name) === search)
  ) {
    results.push({
      kind: 'create',
      name,
      label: `Adicionar “${name}” aos integrantes`,
    })
  }
  return results
}
