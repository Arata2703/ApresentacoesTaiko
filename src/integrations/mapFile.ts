import { catalog, type StageInstrument } from '../domain/stage'

/** Deliberately limited to the M02 spike, not the future presentation format. */
export interface MapDraft {
  title: string
  song: string
  instruments: StageInstrument[]
}

export function serializeMap(map: MapDraft): string {
  return JSON.stringify(
    {
      format: 'taiko-map',
      version: 1,
      title: map.title,
      song: map.song,
      instruments: map.instruments,
    },
    null,
    2,
  )
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 80
}

function between(value: unknown, min: number, max: number) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  )
}

export function parseMap(source: string): MapDraft {
  if (source.length > 1_000_000)
    throw new Error('Arquivo muito grande para esta demonstração.')
  const data: unknown = JSON.parse(source)
  if (
    !record(data) ||
    data.format !== 'taiko-map' ||
    data.version !== 1 ||
    !text(data.title) ||
    !text(data.song) ||
    !Array.isArray(data.instruments) ||
    data.instruments.length > 500
  )
    throw new Error('Arquivo de mapa inválido ou versão não suportada.')
  const ids = new Set<string>()
  const instruments = data.instruments.map((item: unknown): StageInstrument => {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      !catalog.some((type) => type.kind === item.kind) ||
      !text(item.player) ||
      !between(item.x, 0.5, 9.5) ||
      !between(item.y, 0.6, 5.4) ||
      !between(item.rotation, 0, 359.999999)
    )
      throw new Error(
        'Instrumento inválido no arquivo. O mapa atual foi preservado.',
      )
    ids.add(item.id)
    return {
      id: item.id,
      kind: item.kind as StageInstrument['kind'],
      player: item.player as string,
      x: item.x as number,
      y: item.y as number,
      rotation: item.rotation as number,
    }
  })
  return { title: data.title, song: data.song, instruments }
}
