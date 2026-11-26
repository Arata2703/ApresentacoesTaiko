import type {
  MusicMap,
  Presentation,
  Position,
} from '../../domain/presentation/model'
import { pruneKumis } from '../../domain/presentation/kumi'

export function membersOf(map: MusicMap, id: string): readonly string[] {
  return map.kumis?.find((k) => k.id === id)?.instrumentIds ?? [id]
}
export function translateMembers(
  p: Presentation,
  mapId: string,
  ids: readonly string[],
  delta: Position,
): Presentation {
  return {
    ...p,
    maps: p.maps.map((map) =>
      map.id !== mapId
        ? map
        : {
            ...map,
            instruments: map.instruments.map((item) =>
              ids.includes(item.id)
                ? {
                    ...item,
                    position: {
                      x: Number((item.position.x + delta.x).toFixed(6)),
                      y: Number((item.position.y + delta.y).toFixed(6)),
                    },
                  }
                : item,
            ),
          },
    ),
  }
}
export function deleteMembers(
  p: Presentation,
  mapId: string,
  ids: readonly string[],
): Presentation {
  return {
    ...p,
    maps: p.maps.map((map) =>
      map.id !== mapId
        ? map
        : pruneKumis({
            ...map,
            instruments: map.instruments.filter(
              (item) => !ids.includes(item.id),
            ),
          }),
    ),
  }
}
export function duplicateEntities(
  p: Presentation,
  mapId: string,
  ids: readonly string[],
  newId: () => string,
  delta: Position,
  targetMapId = mapId,
) {
  const source = p.maps.find((map) => map.id === mapId)!,
    target = p.maps.find((map) => map.id === targetMapId)!
  const instruments = [...target.instruments],
    kumis = [...(target.kumis ?? [])],
    selection: string[] = []
  for (const id of ids) {
    const memberIds = membersOf(source, id),
      remap = new Map(memberIds.map((id) => [id, newId()]))
    const group = source.kumis?.find((k) => k.id === id)
    instruments.push(
      ...source.instruments
        .filter((item) => memberIds.includes(item.id))
        .map((item) => ({
          ...item,
          id: remap.get(item.id)!,
          position: {
            x: item.position.x + delta.x,
            y: item.position.y + delta.y,
          },
        })),
    )
    if (group) {
      const copy = {
        ...group,
        id: newId(),
        instrumentIds: group.instrumentIds.map((id) => remap.get(id)!),
      }
      kumis.push(copy)
      selection.push(copy.id)
    } else {
      const copyId = remap.get(id)!
      selection.push(copyId)
      const parent = target.kumis?.find((k) => k.instrumentIds.includes(id))
      if (parent && mapId === targetMapId) {
        const index = kumis.findIndex((k) => k.id === parent.id)
        kumis[index] = {
          ...kumis[index]!,
          instrumentIds: [...kumis[index]!.instrumentIds, copyId],
        }
      }
    }
  }
  return {
    presentation: {
      ...p,
      maps: p.maps.map((map) =>
        map.id === targetMapId ? { ...map, instruments, kumis } : map,
      ),
    },
    ids: selection,
  }
}
