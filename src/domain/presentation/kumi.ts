import type { Kumi, MusicMap, Presentation } from './model'
import { assertNewId, byId, named, peopleReferences } from './rules'

export function kumiFor(map: MusicMap, id: string): Kumi | undefined {
  return map.kumis?.find(
    (item) => item.id === id || item.instrumentIds.includes(id),
  )
}

export function createKumi(
  p: Presentation,
  mapId: string,
  id: string,
  ids: readonly string[],
): Presentation {
  assertNewId(p, id)
  const map = byId(p.maps, mapId)
  const instruments = [...new Set(ids)].map((item) =>
    byId(map.instruments, item),
  )
  if (
    instruments.length < 2 ||
    instruments.some((item) => kumiFor(map, item.id))
  )
    throw new Error(
      'Selecione pelo menos dois instrumentos sem Kumi. Não é permitido aninhar conjuntos.',
    )
  const playerIds = [...new Set(instruments.flatMap((item) => item.playerIds))]
  const kumi: Kumi = {
    id,
    name: '',
    instrumentIds: instruments.map((item) => item.id),
    playerIds,
  }
  return {
    ...p,
    maps: p.maps.map((entry) =>
      entry.id !== mapId
        ? entry
        : {
            ...map,
            kumis: [...(map.kumis ?? []), kumi],
            instruments: map.instruments.map((item) =>
              ids.includes(item.id) ? { ...item, playerIds } : item,
            ),
          },
    ),
  }
}

export function changeKumi(
  p: Presentation,
  mapId: string,
  id: string,
  changes: { name?: string; playerIds?: readonly string[] },
): Presentation {
  const map = byId(p.maps, mapId),
    current = byId(map.kumis ?? [], id)
  const name =
    changes.name === undefined
      ? current.name
      : changes.name.trim()
        ? named(changes.name)
        : ''
  const playerIds =
    changes.playerIds === undefined
      ? current.playerIds
      : peopleReferences(p, changes.playerIds)
  return {
    ...p,
    maps: p.maps.map((entry) =>
      entry.id !== mapId
        ? entry
        : {
            ...map,
            kumis: map.kumis!.map((item) =>
              item.id === id ? { ...item, name, playerIds } : item,
            ),
            instruments: map.instruments.map((item) =>
              current.instrumentIds.includes(item.id)
                ? { ...item, playerIds }
                : item,
            ),
          },
    ),
  }
}

export function ungroupKumi(
  p: Presentation,
  mapId: string,
  ids: readonly string[],
): Presentation {
  const map = byId(p.maps, mapId)
  ids.forEach((id) => byId(map.kumis ?? [], id))
  return {
    ...p,
    maps: p.maps.map((entry) =>
      entry.id === mapId
        ? { ...map, kumis: map.kumis!.filter((item) => !ids.includes(item.id)) }
        : entry,
    ),
  }
}

/** Components keep the effective group assignment for inventories and older consumers. */
export function pruneKumis(map: MusicMap): MusicMap {
  if (!map.kumis) return map
  const ids = new Set(map.instruments.map((item) => item.id))
  return {
    ...map,
    kumis: map.kumis
      .map((item) => ({
        ...item,
        instrumentIds: item.instrumentIds.filter((id) => ids.has(id)),
      }))
      .filter((item) => item.instrumentIds.length > 0),
  }
}
