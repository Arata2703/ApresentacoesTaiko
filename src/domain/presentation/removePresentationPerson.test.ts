import { expect, it } from 'vitest'
import { removePresentationPerson } from './people'
import { presentationFixture } from '../../test/presentationFixture'
import { freeze } from '../../test/freeze'

it('remove por ID, limpa vínculos em mapas/transições e preserva os demais dados', () => {
  const original = presentationFixture()
  const p = freeze({
    ...original,
    transitions: original.transitions.map((item) => ({
      ...item,
      needsReview: false,
    })),
  })
  const result = removePresentationPerson(p, 'joao')
  expect(result.people.map((item) => item.id)).toEqual(['ana'])
  expect(result.maps[0]!.instruments[0]!.playerIds).toEqual(['ana'])
  expect(result.maps[0]!.instruments[0]!.position).toEqual(
    p.maps[0]!.instruments[0]!.position,
  )
  expect(result.transitions[1]!.participantIds).toEqual([])
  expect(result.transitions[1]!.needsReview).toBe(true)
  expect(result.transitions[0]!.needsReview).toBe(false)
  expect(result.transitions[1]!.instructions).toBe(
    p.transitions[1]!.instructions,
  )
  expect(result.materials).toBe(p.materials)
  expect(p.people).toHaveLength(2)
  expect(removePresentationPerson(p, 'ana').rosterIds).toEqual([])
  expect(() => removePresentationPerson(p, 'missing')).toThrow(
    'Referência inexistente',
  )
})
