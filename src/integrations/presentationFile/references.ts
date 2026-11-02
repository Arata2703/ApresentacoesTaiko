import type { Presentation } from '../../domain/presentation/model'

export function validateReferences(p: Presentation) {
  const ids = [
    p.id,
    ...p.people.map((item) => item.id),
    ...p.maps.flatMap((map) => [
      map.id,
      ...map.instruments.map((item) => item.id),
    ]),
    ...p.transitions.map((item) => item.id),
    ...p.materials.map((item) => item.id),
  ]
  if (new Set(ids).size !== ids.length)
    throw new Error('Há IDs repetidos entre entidades da apresentação.')
  const people = new Set(p.people.map((item) => item.id))
  const assignments = [
    ...p.rosterIds,
    ...p.maps.flatMap((map) =>
      map.instruments.flatMap((item) => item.playerIds),
    ),
    ...p.transitions.flatMap((item) => item.participantIds),
  ]
  if (assignments.some((id) => !people.has(id)))
    throw new Error('Uma atribuição aponta para pessoa inexistente.')
  const maps = new Set(p.maps.map((map) => map.id))
  const transitions = new Set(p.transitions.map((item) => item.id))
  const seen = new Set<string>()
  for (const item of p.sequence) {
    const exists =
      item.kind === 'map' ? maps.has(item.id) : transitions.has(item.id)
    if (!exists || seen.has(item.id))
      throw new Error(
        'Sequência contém item inexistente, repetido ou com tipo incorreto.',
      )
    seen.add(item.id)
  }
  if (seen.size !== maps.size + transitions.size)
    throw new Error('Há mapas ou transições ausentes da sequência.')
}
