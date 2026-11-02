import { describe, expect, it } from 'vitest'
import { createPresentation } from './presentation'
import { addMap, removeMap, renameMap } from './maps'
import { addPerson } from './people'
import {
  addTransition,
  assignTransitionParticipants,
  removeTransition,
  reorderSequence,
  reviewTransition,
  transitionMaps,
  updateTransition,
} from './sequence'
import { freeze } from '../../test/freeze'

function example() {
  let p = addMap(createPresentation('show', 'Festival'), 'a', 'Ibuki', {
    width: 10,
    depth: 6,
  })
  p = addMap(p, 'b', 'Yatai', { width: 10, depth: 6 })
  p = addTransition(p, 'middle', 1, 'Tsunagi', 'Mover os tambores')
  p = addTransition(p, 'entry', 0, '', 'Entrar')
  p = addTransition(p, 'exit', p.sequence.length, '', 'Sair')
  return freeze(p)
}

describe('sequência e transições textuais', () => {
  it('resolve automaticamente os mapas da entrada, meio e saída e reflete renomeações', () => {
    const p = example()
    expect(transitionMaps(p, 'entry')).toEqual({
      previous: null,
      next: p.maps[0],
    })
    expect(transitionMaps(p, 'middle')).toEqual({
      previous: p.maps[0],
      next: p.maps[1],
    })
    expect(transitionMaps(p, 'exit')).toEqual({
      previous: p.maps[1],
      next: null,
    })
    const next = renameMap(p, 'a', 'Ibuki revisada')
    expect(transitionMaps(next, 'middle').previous!.title).toBe(
      'Ibuki revisada',
    )
    expect(next.transitions).toBe(p.transitions)
  })
  it('aceita transição sem mapas e transições consecutivas usando os mapas mais próximos', () => {
    const empty = addTransition(
      createPresentation('show', 'Show'),
      't',
      0,
      '',
      '',
    )
    expect(transitionMaps(empty, 't')).toEqual({ previous: null, next: null })
    const p = addTransition(example(), 'another', 3, 'Pausa', 'Preparar')
    expect(transitionMaps(p, 'another')).toEqual(transitionMaps(p, 'middle'))
  })
  it('reordena sem duplicar ou perder entidades, preserva texto e sinaliza mudança de contexto', () => {
    const p = example()
    const next = reorderSequence(p, ['entry', 'b', 'middle', 'a', 'exit'])
    expect(next.sequence.map((item) => item.id)).toEqual([
      'entry',
      'b',
      'middle',
      'a',
      'exit',
    ])
    expect(next.maps).toBe(p.maps)
    expect(transitionMaps(next, 'middle')).toEqual({
      previous: p.maps[1],
      next: p.maps[0],
    })
    expect(next.transitions.map((item) => item.needsReview)).toEqual([
      true,
      true,
      true,
    ])
    expect(next.transitions[0]!.instructions).toBe('Mover os tambores')
    expect(p.transitions.every((item) => !item.needsReview)).toBe(true)
    const reviewed = reviewTransition(next, 'middle')
    expect(reviewed.transitions.map((item) => item.needsReview)).toEqual([
      false,
      true,
      true,
    ])
    expect(
      reorderSequence(
        reviewed,
        reviewed.sequence.map((item) => item.id),
      ).transitions,
    ).toEqual(reviewed.transitions)
  })
  it('preserva transições quando remove mapas e não deixa referência órfã', () => {
    const p = example()
    const first = removeMap(p, 'a')
    expect(first.maps.map((item) => item.id)).toEqual(['b'])
    expect(first.sequence.some((item) => item.id === 'a')).toBe(false)
    expect(transitionMaps(first, 'middle')).toEqual({
      previous: null,
      next: first.maps[0],
    })
    expect(first.transitions[0]).toEqual({
      ...p.transitions[0],
      needsReview: true,
    })
    expect(first.transitions[2]).toBe(p.transitions[2])
    const empty = removeMap(first, 'b')
    for (const transition of empty.transitions) {
      expect(transitionMaps(empty, transition.id)).toEqual({
        previous: null,
        next: null,
      })
    }
    expect(empty.transitions.map((item) => item.instructions)).toEqual(
      p.transitions.map((item) => item.instructions),
    )
    expect(() => removeMap(empty, 'missing')).toThrow('Referência inexistente')
  })
  it('revisa a antiga saída quando um novo mapa é acrescentado depois dela', () => {
    const p = example()
    const next = addMap(p, 'c', 'Música nova', { width: 12, depth: 8 })
    expect(transitionMaps(next, 'exit').next!.id).toBe('c')
    expect(next.transitions[2]!.needsReview).toBe(true)
    expect(next.transitions[0]).toBe(p.transitions[0])
  })
  it('edita nome e texto, atribui apoiadores e remove a transição sem alterar mapas', () => {
    const p = addPerson(example(), 'apoio', 'João', false)
    const edited = updateTransition(
      p,
      'middle',
      '  Ponte  ',
      'Levar bases para o fundo',
    )
    expect(edited.transitions[0]!.tsunagiName).toBe('Ponte')
    expect(edited.transitions[1]).toBe(p.transitions[1])
    const assigned = assignTransitionParticipants(edited, 'middle', [
      'apoio',
      'apoio',
    ])
    expect(assigned.transitions[0]!.participantIds).toEqual(['apoio'])
    expect(assigned.transitions[1]).toBe(p.transitions[1])
    expect(
      assignTransitionParticipants(assigned, 'middle', []).transitions[0]!
        .participantIds,
    ).toEqual([])
    const removed = removeTransition(assigned, 'middle')
    expect(removed.transitions.map((item) => item.id)).toEqual([
      'entry',
      'exit',
    ])
    expect(removed.sequence.map((item) => item.id)).toEqual([
      'entry',
      'a',
      'b',
      'exit',
    ])
    expect(removed.maps).toBe(p.maps)
    expect(() => updateTransition(p, 'middle', 'a'.repeat(81), '')).toThrow(
      'até 80',
    )
  })
  it.each([
    ['a'],
    ['entry', 'a', 'middle', 'b', 'b'],
    ['entry', 'a', 'middle', 'b', 'missing'],
  ])(
    'recusa reordenação incompleta, duplicada ou desconhecida %j',
    (...ids) => {
      expect(() => reorderSequence(example(), ids)).toThrow()
    },
  )
  it.each([-1, 6, 1.5, NaN])('recusa posição inválida %s', (index) => {
    expect(() => addTransition(example(), 'new', index, '', '')).toThrow(
      'Posição inválida',
    )
  })
  it('recusa transição desconhecida ou ausente da sequência', () => {
    const p = example()
    expect(() => transitionMaps(p, 'missing')).toThrow('Referência inexistente')
    expect(() => reviewTransition(p, 'missing')).toThrow(
      'Referência inexistente',
    )
    expect(() => removeTransition(p, 'missing')).toThrow(
      'Referência inexistente',
    )
    expect(() => updateTransition(p, 'missing', '', '')).toThrow(
      'Referência inexistente',
    )
    expect(() => transitionMaps({ ...p, sequence: [] }, 'middle')).toThrow(
      'ausente da sequência',
    )
  })
})
