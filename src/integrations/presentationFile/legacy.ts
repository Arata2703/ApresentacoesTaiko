import type { Presentation } from '../../domain/presentation/model'
import { instrumentDefinition } from '../../domain/presentation/catalog'
import { parseMap } from '../mapFile'

export function migrateMap(source: string): Presentation {
  const legacy = parseMap(source)
  const people = legacy.instruments.flatMap((item, index) =>
    item.player.trim()
      ? [{ id: `legacy:person:${index}`, name: item.player.trim() }]
      : [],
  )
  return {
    id: 'legacy:presentation',
    title: legacy.title.trim() || 'Apresentação sem título',
    people,
    rosterIds: [],
    maps: [
      {
        id: 'legacy:map',
        title: legacy.song.trim() || 'Música sem título',
        stage: { width: 10, depth: 6 },
        instruments: legacy.instruments.map((item, index) => ({
          id: `legacy:instrument:${index}`,
          kind: item.kind,
          baseId: instrumentDefinition(item.kind).defaultBaseId,
          playerIds: item.player.trim() ? [`legacy:person:${index}`] : [],
          position: { x: item.x, y: item.y },
          rotation: item.rotation,
        })),
      },
    ],
    transitions: [],
    sequence: [{ kind: 'map', id: 'legacy:map' }],
    materials: [],
  }
}
