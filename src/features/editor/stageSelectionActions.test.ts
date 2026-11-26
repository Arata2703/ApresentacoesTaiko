import { describe, it, expect } from 'vitest'
import { presentationFixture } from '../../test/presentationFixture'
import { createKumi } from '../../domain/presentation/kumi'
import { addMapInstrument } from '../../domain/presentation/maps'
import {
  deleteMembers,
  duplicateEntities,
  membersOf,
  translateMembers,
} from './stageSelectionActions'
describe('operações da seleção', () => {
  it('move e remove componentes preservando os demais mapas e limpa grupos vazios', () => {
    const p = createKumi(
      addMapInstrument(presentationFixture(), 'a', 's', 'shime'),
      'a',
      'k',
      ['drum', 's'],
    )
    expect(membersOf(p.maps[0]!, 'k')).toEqual(['drum', 's'])
    expect(membersOf(p.maps[1]!, 'flute')).toEqual(['flute'])
    const moved = translateMembers(p, 'a', ['drum', 's'], { x: 1, y: 1 })
    expect(moved.maps[0]!.instruments[0]!.position.x).toBe(4.25)
    expect(moved.maps[1]).toBe(p.maps[1])
    expect(deleteMembers(moved, 'a', ['drum', 's']).maps[0]!.kumis).toEqual([])
  })
  it('duplica instrumentos e Kumi com novas identidades, mantendo atribuições e posições relativas', () => {
    const p = createKumi(
      addMapInstrument(presentationFixture(), 'a', 's', 'shime'),
      'a',
      'k',
      ['drum', 's'],
    )
    let id = 0
    const nextId = () => `new${++id}`
    const copy = duplicateEntities(p, 'a', ['k'], nextId, { x: 1, y: 1 })
    expect(copy.ids).toEqual(['new3'])
    expect(copy.presentation.maps[0]!.kumis![1]!.instrumentIds).toEqual([
      'new1',
      'new2',
    ])
    const solo = duplicateEntities(copy.presentation, 'b', ['flute'], nextId, {
      x: 0,
      y: 0,
    })
    expect(solo.presentation.maps[1]!.instruments).toHaveLength(2)
    const inside = duplicateEntities(p, 'a', ['drum'], nextId, { x: 0, y: 0 })
    expect(inside.presentation.maps[0]!.kumis![0]!.instrumentIds).toHaveLength(
      3,
    )
    const cross = duplicateEntities(p, 'a', ['k'], nextId, { x: 0, y: 0 }, 'b')
    const both = duplicateEntities(p, 'a', ['drum', 's'], nextId, {
      x: 0,
      y: 0,
    })
    expect(both.presentation.maps[0]!.kumis![0]!.instrumentIds).toHaveLength(4)
    expect(cross.presentation.maps[1]!.kumis).toHaveLength(1)
    const ungrouped = duplicateEntities(
      p,
      'a',
      ['drum'],
      nextId,
      { x: 0, y: 0 },
      'b',
    )
    expect(ungrouped.presentation.maps[1]!.kumis).toEqual([])
  })
})
