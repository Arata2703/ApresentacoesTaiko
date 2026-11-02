import type { Presentation } from './model'
import { assertNewId, byId, named } from './rules'

export function addPerson(
  p: Presentation,
  id: string,
  name: string,
  inRoster = true,
): Presentation {
  assertNewId(p, id)
  return {
    ...p,
    people: [...p.people, { id, name: named(name) }],
    rosterIds: inRoster ? [...p.rosterIds, id] : p.rosterIds,
  }
}

export function renamePerson(
  p: Presentation,
  id: string,
  name: string,
): Presentation {
  byId(p.people, id)
  const nextName = named(name)
  return {
    ...p,
    people: p.people.map((person) =>
      person.id === id ? { ...person, name: nextName } : person,
    ),
  }
}

export function setRosterMembership(
  p: Presentation,
  id: string,
  included: boolean,
): Presentation {
  byId(p.people, id)
  return {
    ...p,
    rosterIds: included
      ? [...new Set([...p.rosterIds, id])]
      : p.rosterIds.filter((personId) => personId !== id),
  }
}

export function personIsAssigned(p: Presentation, id: string): boolean {
  return (
    p.maps.some((map) =>
      map.instruments.some((item) => item.playerIds.includes(id)),
    ) || p.transitions.some((item) => item.participantIds.includes(id))
  )
}

export function removePerson(p: Presentation, id: string): Presentation {
  byId(p.people, id)
  if (personIsAssigned(p, id))
    throw new Error(
      'Pessoa em uso. Remova as atribuições ou apenas retire-a da lista de integrantes.',
    )
  return {
    ...p,
    people: p.people.filter((person) => person.id !== id),
    rosterIds: p.rosterIds.filter((personId) => personId !== id),
  }
}
