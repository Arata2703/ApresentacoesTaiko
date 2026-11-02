import { describe, expect, it } from 'vitest'
import { createPresentation, renamePresentation } from './presentation'
import {
  addPerson,
  removePerson,
  renamePerson,
  setRosterMembership,
} from './people'
import { addMap, addMapInstrument, assignInstrumentPlayers } from './maps'
import { addTransition, assignTransitionParticipants } from './sequence'
import { addMaterial, removeMaterial, updateMaterial } from './materials'
import type { Presentation } from './model'
import { freeze } from '../../test/freeze'

function example(): Presentation {
  let p = createPresentation('show', 'Mostra Japão')
  p = addPerson(p, 'ana', 'Ana')
  p = addPerson(p, 'bia', 'Bia', false)
  p = addMap(p, 'song', 'Ibuki', { width: 10, depth: 6 })
  p = addMapInstrument(p, 'song', 'drum', 'okedo')
  p = addTransition(p, 'entry', 0, '', 'Entrada')
  return p
}

describe('apresentação e identidade', () => {
  it('cria estruturas independentes e renomeia sem mudar o ID', () => {
    const original = freeze(createPresentation('show', '  Mostra Japão  '))
    expect(original).toEqual({
      id: 'show',
      title: 'Mostra Japão',
      people: [],
      rosterIds: [],
      maps: [],
      transitions: [],
      sequence: [],
      materials: [],
    })
    expect(renamePresentation(original, ' Festival ')).toEqual({
      ...original,
      title: 'Festival',
    })
    expect(original.title).toBe('Mostra Japão')
    expect(createPresentation('other', 'Outra').maps).not.toBe(original.maps)
  })
  it.each(['', ' ', ' show', 'show '])('recusa ID inválido %j', (id) => {
    expect(() => createPresentation(id, 'Show')).toThrow('ID válido')
  })
  it.each(['', '   ', 'a'.repeat(81)])('recusa nome inválido %j', (name) => {
    expect(() => createPresentation('show', name)).toThrow('1 a 80')
  })
  it.each([
    '',
    ' ana',
    'ana ',
    'show',
    'ana',
    'song',
    'drum',
    'entry',
    'material',
  ])('recusa colisões em todas as entidades e IDs inválidos %j', (id) => {
    const p = freeze(addMaterial(example(), 'material', 'Banner', 1))
    expect(() => addPerson(p, id, 'Pessoa')).toThrow('ID vazio')
    expect(p.people).toHaveLength(2)
  })
})

describe('pessoas e lista de integrantes', () => {
  it('permite homônimos, múltiplas atribuições e renomear sem perder a identidade', () => {
    let p = addPerson(example(), 'ana2', 'Ana')
    p = assignInstrumentPlayers(p, 'song', 'drum', ['ana', 'ana2', 'ana'])
    p = assignTransitionParticipants(p, 'entry', ['ana', 'bia', 'bia'])
    const original = freeze(p)
    const renamed = renamePerson(original, 'ana', 'Ana Silva')
    expect(renamed.people.map((person) => person.name)).toEqual([
      'Ana Silva',
      'Bia',
      'Ana',
    ])
    expect(renamed.maps[0]!.instruments[0]!.playerIds).toEqual(['ana', 'ana2'])
    expect(renamed.transitions[0]!.participantIds).toEqual(['ana', 'bia'])
    expect(original.people[0]!.name).toBe('Ana')
  })
  it('retira pessoa da lista sem apagar identidade ou atribuições', () => {
    const p = freeze(
      assignInstrumentPlayers(example(), 'song', 'drum', ['ana']),
    )
    const unlisted = setRosterMembership(p, 'ana', false)
    expect(unlisted.rosterIds).toEqual([])
    expect(unlisted.people).toBe(p.people)
    expect(unlisted.maps[0]!.instruments[0]!.playerIds).toEqual(['ana'])
    const listed = setRosterMembership(
      setRosterMembership(unlisted, 'bia', true),
      'bia',
      true,
    )
    expect(listed.rosterIds).toEqual(['bia'])
    expect(p.rosterIds).toEqual(['ana'])
  })
  it('só apaga identidades sem uso e limpa a lista correspondente', () => {
    const p = freeze(example())
    const removed = removePerson(p, 'ana')
    expect(removed.people.map((person) => person.id)).toEqual(['bia'])
    expect(removed.rosterIds).toEqual([])
    expect(p.people).toHaveLength(2)
    expect(() =>
      removePerson(assignInstrumentPlayers(p, 'song', 'drum', ['ana']), 'ana'),
    ).toThrow('Pessoa em uso')
    expect(() =>
      removePerson(assignTransitionParticipants(p, 'entry', ['bia']), 'bia'),
    ).toThrow('Pessoa em uso')
  })
  it('recusa pessoas ausentes em cadastro, lista e atribuições', () => {
    const p = freeze(example())
    expect(() => renamePerson(p, 'missing', 'Nome')).toThrow(
      'Referência inexistente',
    )
    expect(() => removePerson(p, 'missing')).toThrow('Referência inexistente')
    expect(() => setRosterMembership(p, 'missing', true)).toThrow(
      'Referência inexistente',
    )
    expect(() =>
      assignInstrumentPlayers(p, 'song', 'drum', ['missing']),
    ).toThrow('Referência inexistente')
    expect(() => assignTransitionParticipants(p, 'entry', ['missing'])).toThrow(
      'Referência inexistente',
    )
  })
})

describe('materiais manuais', () => {
  it('adiciona, renomeia, altera quantidade e remove pelo ID sem alterar os outros', () => {
    let p = addMaterial(example(), 'banner', ' Banner ', 1)
    p = freeze(addMaterial(p, 'bachi', 'Caixa de bachi', 2))
    const changed = updateMaterial(p, 'banner', 'Banner grande', 3)
    expect(changed.materials).toEqual([
      { id: 'banner', name: 'Banner grande', quantity: 3 },
      { id: 'bachi', name: 'Caixa de bachi', quantity: 2 },
    ])
    expect(removeMaterial(changed, 'banner').materials).toEqual([
      p.materials[1],
    ])
    expect(p.materials[0]!.quantity).toBe(1)
    expect(() => updateMaterial(p, 'missing', 'Nome', 1)).toThrow(
      'Referência inexistente',
    )
    expect(() => removeMaterial(p, 'missing')).toThrow('Referência inexistente')
  })
  it.each([0, -1, 1.5, NaN, Infinity])(
    'recusa quantidade inválida %s',
    (quantity) => {
      expect(() => addMaterial(example(), 'item', 'Banner', quantity)).toThrow(
        'inteiro positivo',
      )
    },
  )
})
