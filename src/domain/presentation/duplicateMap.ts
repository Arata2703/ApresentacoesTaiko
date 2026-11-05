import type { Presentation } from './model'
import { byId } from './rules'
import {
  addMap,
  addMapInstrument,
  assignInstrumentPlayers,
  setInstrumentBase,
  updateMapInstrument,
} from './maps'
import { reorderSequence } from './sequence'

export function duplicateMap(
  p: Presentation,
  sourceId: string,
  id: string,
  instrumentIds: readonly string[],
): Presentation {
  const source = byId(p.maps, sourceId)
  if (instrumentIds.length !== source.instruments.length)
    throw new Error('Informe uma nova identidade para cada instrumento.')
  let next = addMap(p, id, `${source.title.slice(0, 72)} (cópia)`, source.stage)
  source.instruments.forEach((item, index) => {
    const newId = instrumentIds[index]!
    next = addMapInstrument(next, id, newId, item.kind)
    next = setInstrumentBase(next, id, newId, item.baseId)
    next = assignInstrumentPlayers(next, id, newId, item.playerIds)
    next = updateMapInstrument(next, id, newId, {
      position: item.position,
      rotation: item.rotation,
    })
  })
  const ids = p.sequence.map((item) => item.id)
  ids.splice(ids.indexOf(sourceId) + 1, 0, id)
  return reorderSequence(next, ids)
}
