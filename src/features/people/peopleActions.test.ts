import { describe, expect, it } from 'vitest'
import { peopleActions } from './peopleActions'
import { createPresentation } from '../../domain/presentation/presentation'
import {
  addMap,
  addMapInstrument,
  assignInstrumentPlayers,
} from '../../domain/presentation/maps'

describe('ações do cadastro', () => {
  it('valida nomes antes de atualizar e preserva identidade em renomeação/lista', () => {
    let p = createPresentation('show', 'Show')
    const actions = peopleActions((change) => {
      p = change(p)
    })
    const original = p
    expect(() => actions.add(' ')).toThrow('1 a 80')
    expect(p).toBe(original)
    actions.add(' Ana ')
    const id = p.people[0]!.id
    actions.add('Ana')
    expect(p.people[1]!.id).not.toBe(id)
    expect(() => actions.rename(id, '')).toThrow('1 a 80')
    actions.rename(id, 'Ana Silva')
    expect(p.rosterIds).toContain(id)
    expect(p.people[0]).toEqual({ id, name: 'Ana Silva' })
    actions.remove(p.people[1]!.id)
    expect(p.people).toHaveLength(1)
  })
  it('remove a pessoa e retira as atribuições preservando os instrumentos', () => {
    let p = addMap(createPresentation('show', 'Show'), 'map', 'Música', {
      width: 10,
      depth: 6,
    })
    const actions = peopleActions((change) => {
      p = change(p)
    })
    actions.add('Ana')
    const id = p.people[0]!.id
    p = assignInstrumentPlayers(
      addMapInstrument(p, 'map', 'drum', 'okedo'),
      'map',
      'drum',
      [id],
    )
    actions.remove(id)
    expect(p.people).toEqual([])
    expect(p.rosterIds).toEqual([])
    expect(p.maps[0]!.instruments[0]!.playerIds).toEqual([])
  })
})
