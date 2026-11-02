import type { Presentation, StageDimensions, Position } from './model'

export function named(value: string): string {
  const name = value.trim()
  if (!name || name.length > 80)
    throw new Error('Informe um nome de 1 a 80 caracteres.')
  return name
}

export function byId<T extends { readonly id: string }>(
  items: readonly T[],
  id: string,
): T {
  const item = items.find((entry) => entry.id === id)
  if (!item) throw new Error(`Referência inexistente: ${id}`)
  return item
}

export function assertNewId(presentation: Presentation, id: string) {
  const ids = [
    presentation.id,
    ...presentation.people.map((item) => item.id),
    ...presentation.maps.flatMap((map) => [
      map.id,
      ...map.instruments.map((item) => item.id),
    ]),
    ...presentation.transitions.map((item) => item.id),
    ...presentation.materials.map((item) => item.id),
  ]
  if (!id.trim() || id !== id.trim() || ids.includes(id))
    throw new Error('ID vazio, inválido ou já utilizado.')
}

export function dimensions(stage: StageDimensions): StageDimensions {
  if (
    !Number.isFinite(stage.width) ||
    !Number.isFinite(stage.depth) ||
    stage.width <= 0 ||
    stage.depth <= 0
  )
    throw new Error('As medidas do palco devem ser positivas e finitas.')
  return { ...stage }
}

export function position(point: Position, stage: StageDimensions): Position {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
    throw new Error('A posição deve ser finita.')
  return {
    x: Math.max(0, Math.min(stage.width, point.x)),
    y: Math.max(0, Math.min(stage.depth, point.y)),
  }
}

export function rotation(angle: number): number {
  if (!Number.isFinite(angle)) throw new Error('A rotação deve ser finita.')
  return ((angle % 360) + 360) % 360
}

export function peopleReferences(
  presentation: Presentation,
  ids: readonly string[],
): readonly string[] {
  for (const id of ids) byId(presentation.people, id)
  return [...new Set(ids)]
}
