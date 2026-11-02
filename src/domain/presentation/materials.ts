import type { Presentation } from './model'
import { assertNewId, byId, named } from './rules'

function material(name: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0)
    throw new Error('A quantidade deve ser um inteiro positivo.')
  return { name: named(name), quantity }
}

export function addMaterial(
  p: Presentation,
  id: string,
  name: string,
  quantity: number,
): Presentation {
  assertNewId(p, id)
  return {
    ...p,
    materials: [...p.materials, { id, ...material(name, quantity) }],
  }
}

export function updateMaterial(
  p: Presentation,
  id: string,
  name: string,
  quantity: number,
): Presentation {
  byId(p.materials, id)
  const changes = material(name, quantity)
  return {
    ...p,
    materials: p.materials.map((item) =>
      item.id === id ? { ...item, ...changes } : item,
    ),
  }
}

export function removeMaterial(p: Presentation, id: string): Presentation {
  byId(p.materials, id)
  return { ...p, materials: p.materials.filter((item) => item.id !== id) }
}
