export type InstrumentKind =
  | 'okedo'
  | 'shime'
  | 'tekan'
  | 'take'
  | 'katsugi'
  | 'youko'
  | 'chyappa'
  | 'fue'
  | 'oodaiko'
  | 'nagado-p'
  | 'nagado-m'
  | 'nagado-g'
export interface InstrumentType {
  kind: InstrumentKind
  name: string
  appearance: 'drum' | 'flat' | 'flute' | 'hand'
  base: string
}
export interface StageInstrument {
  id: string
  kind: InstrumentKind
  player: string
  x: number
  y: number
  rotation: number
}
export type InstrumentChanges = Partial<
  Pick<StageInstrument, 'player' | 'x' | 'y' | 'rotation'>
>
export const stageSize = { width: 10, depth: 6 }
export const catalog: InstrumentType[] = [
  { kind: 'okedo', name: 'Okedo', appearance: 'drum', base: 'Suwaridai' },
  { kind: 'shime', name: 'Shime', appearance: 'flat', base: 'Suwaridai' },
  {
    kind: 'tekan',
    name: 'Tekan',
    appearance: 'hand',
    base: 'Sem base definida',
  },
  {
    kind: 'take',
    name: 'Take',
    appearance: 'flute',
    base: 'Sem base definida',
  },
  {
    kind: 'katsugi',
    name: 'Katsugi',
    appearance: 'drum',
    base: 'Sem base definida',
  },
  {
    kind: 'youko',
    name: 'Youko',
    appearance: 'flat',
    base: 'Sem base definida',
  },
  {
    kind: 'chyappa',
    name: 'Chyappa',
    appearance: 'hand',
    base: 'Sem base definida',
  },
  { kind: 'fue', name: 'Fue', appearance: 'flute', base: 'Sem base definida' },
  {
    kind: 'oodaiko',
    name: 'Oodaiko',
    appearance: 'drum',
    base: 'Sem base definida',
  },
  { kind: 'nagado-p', name: 'Nagado P', appearance: 'drum', base: 'Suwaridai' },
  { kind: 'nagado-m', name: 'Nagado M', appearance: 'drum', base: 'Suwaridai' },
  { kind: 'nagado-g', name: 'Nagado G', appearance: 'drum', base: 'Suwaridai' },
]
export function getInstrumentType(kind: InstrumentKind): InstrumentType {
  return catalog.find((item) => item.kind === kind)!
}
export function updateInstrument(
  instruments: StageInstrument[],
  id: string,
  changes: InstrumentChanges,
): StageInstrument[] {
  return instruments.map((item) => {
    if (item.id !== id) return item
    const next = { ...item, ...changes }
    return {
      ...next,
      x: Number.isFinite(next.x)
        ? Math.max(0.5, Math.min(stageSize.width - 0.5, next.x))
        : item.x,
      y: Number.isFinite(next.y)
        ? Math.max(0.6, Math.min(stageSize.depth - 0.6, next.y))
        : item.y,
      rotation: Number.isFinite(next.rotation)
        ? ((next.rotation % 360) + 360) % 360
        : item.rotation,
    }
  })
}
export function createInstrument(
  kind: InstrumentKind,
  id: string,
  count: number,
): StageInstrument {
  return {
    id,
    kind,
    player: '',
    x: 2 + (count % 4) * 2,
    y: 2 + (Math.floor(count / 4) % 3),
    rotation: 0,
  }
}
