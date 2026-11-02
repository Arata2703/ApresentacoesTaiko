import type { Presentation } from '../../domain/presentation/model'
import { bases } from '../../domain/presentation/catalog'
import type { StageInstrument } from '../../domain/stage'
export type InstrumentTransform = Partial<
  Pick<StageInstrument, 'x' | 'y' | 'rotation'>
>

export interface EditorInstrument extends StageInstrument {
  playerIds: readonly string[]
  baseLabel: string
}

export function projectMap(presentation: Presentation, mapId: string | null) {
  const map = presentation.maps.find((item) => item.id === mapId)
  if (!map) return null
  const instruments: EditorInstrument[] = map.instruments.map((item) => ({
    playerIds: item.playerIds,
    id: item.id,
    kind: item.kind,
    x: item.position.x,
    y: item.position.y,
    rotation: item.rotation,
    player: item.playerIds
      .map((id) => presentation.people.find((person) => person.id === id)!.name)
      .join('/'),
    baseLabel:
      item.baseId === null
        ? 'Sem base definida'
        : bases.find((base) => base.id === item.baseId)!.name,
  }))
  return {
    title: presentation.title,
    song: map.title,
    stage: map.stage,
    instruments,
  }
}

export function firstMapId(presentation: Presentation): string | null {
  return presentation.sequence.find((item) => item.kind === 'map')?.id ?? null
}
