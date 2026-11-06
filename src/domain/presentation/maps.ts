import type { InstrumentKind } from '../stage'
import { assertCompatibleBase, instrumentDefinition } from './catalog'
import type {
  BaseId,
  MapInstrument,
  MusicMap,
  Presentation,
  StageDimensions,
} from './model'
import {
  assertNewId,
  byId,
  dimensions,
  named,
  peopleReferences,
  position,
  rotation,
} from './rules'
import { reconcileSequence } from './sequence'

function replaceMap(p: Presentation, map: MusicMap): Presentation {
  return { ...p, maps: p.maps.map((item) => (item.id === map.id ? map : item)) }
}

export function addMap(
  p: Presentation,
  id: string,
  title: string,
  stage: StageDimensions,
  afterSlideId?: string,
): Presentation {
  assertNewId(p, id)
  const anchor =
    afterSlideId === undefined ? null : byId(p.sequence, afterSlideId)
  const index =
    anchor === null ? p.sequence.length : p.sequence.indexOf(anchor) + 1
  return reconcileSequence(p, {
    ...p,
    maps: [
      ...p.maps,
      { id, title: named(title), stage: dimensions(stage), instruments: [] },
    ],
    sequence: [
      ...p.sequence.slice(0, index),
      { kind: 'map', id },
      ...p.sequence.slice(index),
    ],
  })
}

export function renameMap(
  p: Presentation,
  id: string,
  title: string,
): Presentation {
  return replaceMap(p, { ...byId(p.maps, id), title: named(title) })
}

export class StageResizeConflict extends Error {
  constructor(
    readonly affected: readonly {
      id: string
      title: string
    }[],
  ) {
    super(
      `Instrumentos ficariam fora do palco em: ${affected.map((map) => map.title).join(', ')}. As medidas foram mantidas.`,
    )
  }
}

export function resizeStage(
  p: Presentation,
  stage: StageDimensions,
  allowReposition = false,
): Presentation {
  const nextStage = dimensions(stage)
  const affected: { id: string; title: string }[] = []
  const maps = p.maps.map((map) => {
    const dx = (nextStage.width - map.stage.width) / 2
    const dy = (nextStage.depth - map.stage.depth) / 2
    let needsReposition = false
    const instruments = map.instruments.map((item) => {
      const point = { x: item.position.x + dx, y: item.position.y + dy }
      const fitted = position(point, nextStage)
      if (point.x !== fitted.x || point.y !== fitted.y) needsReposition = true
      return { ...item, position: fitted }
    })
    if (needsReposition) affected.push({ id: map.id, title: map.title })
    return { ...map, stage: nextStage, instruments }
  })
  if (affected.length && !allowReposition)
    throw new StageResizeConflict(affected)
  return { ...p, maps }
}

export function removeMap(p: Presentation, id: string): Presentation {
  byId(p.maps, id)
  return reconcileSequence(p, {
    ...p,
    maps: p.maps.filter((map) => map.id !== id),
    sequence: p.sequence.filter((item) => item.id !== id),
  })
}

export function addMapInstrument(
  p: Presentation,
  mapId: string,
  id: string,
  kind: InstrumentKind,
): Presentation {
  const map = byId(p.maps, mapId)
  assertNewId(p, id)
  const definition = instrumentDefinition(kind)
  const item: MapInstrument = {
    id,
    kind,
    baseId: definition.defaultBaseId,
    playerIds: [],
    position: { x: map.stage.width / 2, y: map.stage.depth / 2 },
    rotation: 0,
  }
  return replaceMap(p, { ...map, instruments: [...map.instruments, item] })
}

export function updateMapInstrument(
  p: Presentation,
  mapId: string,
  id: string,
  changes: Partial<Pick<MapInstrument, 'position' | 'rotation'>>,
): Presentation {
  const map = byId(p.maps, mapId)
  const item = byId(map.instruments, id)
  const next = {
    ...item,
    position: position(changes.position ?? item.position, map.stage),
    rotation: rotation(changes.rotation ?? item.rotation),
  }
  return replaceMap(p, {
    ...map,
    instruments: map.instruments.map((entry) =>
      entry.id === id ? next : entry,
    ),
  })
}

export function setInstrumentBase(
  p: Presentation,
  mapId: string,
  id: string,
  baseId: BaseId | null,
): Presentation {
  const map = byId(p.maps, mapId)
  const item = byId(map.instruments, id)
  assertCompatibleBase(item.kind, baseId)
  return replaceMap(p, {
    ...map,
    instruments: map.instruments.map((entry) =>
      entry.id === id ? { ...entry, baseId } : entry,
    ),
  })
}

export function assignInstrumentPlayers(
  p: Presentation,
  mapId: string,
  id: string,
  ids: readonly string[],
): Presentation {
  const map = byId(p.maps, mapId)
  byId(map.instruments, id)
  const playerIds = peopleReferences(p, ids)
  return replaceMap(p, {
    ...map,
    instruments: map.instruments.map((item) =>
      item.id === id ? { ...item, playerIds } : item,
    ),
  })
}

export function removeMapInstrument(
  p: Presentation,
  mapId: string,
  id: string,
): Presentation {
  const map = byId(p.maps, mapId)
  byId(map.instruments, id)
  return replaceMap(p, {
    ...map,
    instruments: map.instruments.filter((item) => item.id !== id),
  })
}
