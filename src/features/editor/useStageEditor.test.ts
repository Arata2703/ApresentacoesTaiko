import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStageEditor } from './useStageEditor'
import { createPresentation } from '../../domain/presentation/presentation'
import { presentationFixture } from '../../test/presentationFixture'
import { assignInstrumentPlayers } from '../../domain/presentation/maps'
import { addPerson, renamePerson } from '../../domain/presentation/people'

describe('estado do editor', () => {
  it('confirma nomes diretamente em um instrumento sem duplicar novas identidades repetidas', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.commitPlayers('missing', [{ name: 'Ignorar' }]))
    expect(result.current.presentation.people).toEqual([])
    act(() => result.current.addInstrument('okedo'))
    const id = result.current.selectedId!
    act(() =>
      result.current.commitPlayers(id, [{ name: 'Ana' }, { name: 'Ana' }]),
    )
    expect(result.current.presentation.people).toHaveLength(1)
    const personId = result.current.presentation.people[0]!.id
    act(() =>
      result.current.commitPlayers(id, [{ id: personId }, { name: 'Bia' }]),
    )
    expect(result.current.selected!.player).toBe('Ana/Bia')
    expect(result.current.presentation.rosterIds).toHaveLength(2)
    expect(() => result.current.commitPlayers(id, [{ name: ' ' }])).toThrow(
      '1 a 80',
    )
  })
  it('abre apresentação vazia sem inventar mapas e cria somente o primeiro sob ação explícita', () => {
    const { result } = renderHook(useStageEditor)
    act(() =>
      result.current.openPresentation(createPresentation('empty', 'Vazia')),
    )
    expect(result.current.page).toBeNull()
    act(() => {
      result.current.setSong('Ignorado')
      result.current.changeSelected({ x: 1 })
      result.current.moveInstrument('missing', 1, 1)
      result.current.selectMap('missing')
      result.current.removeSelected()
    })
    expect(result.current.presentation.maps).toEqual([])
    act(() => result.current.createFirstMap())
    act(() => result.current.createFirstMap())
    expect(result.current.presentation.maps).toHaveLength(1)
    expect(result.current.page?.song).toBe('Primeira música')
  })
  it('renomeia a identidade compartilhada e limpar um campo retira somente aquela atribuição', () => {
    let p = presentationFixture()
    p = assignInstrumentPlayers(p, 'a', 'drum', ['ana'])
    p = assignInstrumentPlayers(p, 'b', 'flute', ['ana'])
    const { result } = renderHook(useStageEditor)
    act(() => result.current.openPresentation(p))
    act(() => result.current.selectInstrument('flute'))
    act(() =>
      result.current.updatePresentation((p) =>
        renamePerson(p, 'ana', 'Ana Silva'),
      ),
    )
    expect(
      result.current.presentation.people.find((person) => person.id === 'ana')!
        .name,
    ).toBe('Ana Silva')
    act(() => result.current.assignPlayers([]))
    expect(
      result.current.presentation.maps[1]!.instruments[0]!.playerIds,
    ).toEqual([])
    expect(
      result.current.presentation.maps[0]!.instruments[0]!.playerIds,
    ).toEqual(['ana'])
    expect(result.current.presentation.people).toHaveLength(2)
  })
  it('protege atribuições múltiplas e ignora campos numéricos não finitos', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.openPresentation(presentationFixture()))
    act(() => result.current.selectMap('a'))
    act(() => result.current.selectInstrument('drum'))
    act(() =>
      result.current.changeSelected({
        x: NaN,
        y: Infinity,
        rotation: NaN,
      }),
    )
    expect(result.current.selected).toMatchObject({
      player: 'Ana/João',
      x: 3.25,
      y: 1.5,
      rotation: 315,
    })
    expect(
      result.current.presentation.maps[0]!.instruments[0]!.playerIds,
    ).toEqual(['ana', 'joao'])
  })
  it('ignora edição e remoção sem seleção', () => {
    const { result } = renderHook(useStageEditor)
    act(() => {
      result.current.changeSelected({ x: 1 })
      result.current.assignPlayers([])
      result.current.removeSelected()
    })
    expect(result.current.instruments).toEqual([])
    expect(result.current.selected).toBeUndefined()
  })

  it('mantém instrumentos independentes e altera apenas o selecionado', () => {
    const { result } = renderHook(useStageEditor)
    act(() =>
      result.current.updatePresentation((p) =>
        addPerson(addPerson(p, 'ana', 'Ana'), 'bia', 'Bia'),
      ),
    )
    act(() => result.current.addInstrument('okedo'))
    const firstId = result.current.selectedId!
    act(() => result.current.addInstrument('shime'))
    const secondId = result.current.selectedId!
    expect(secondId).not.toBe(firstId)
    act(() => result.current.assignPlayers(['bia']))
    act(() => result.current.selectInstrument(firstId))
    act(() => result.current.assignPlayers(['ana']))
    act(() => result.current.changeSelected({ rotation: 90 }))
    expect(result.current.instruments.map((item) => item.player)).toEqual([
      'Ana',
      'Bia',
    ])
    act(() => result.current.removeSelected())
    expect(result.current.instruments.map((item) => item.id)).toEqual([
      secondId,
    ])
    expect(result.current.selectedId).toBeNull()
    expect(result.current.message).toBe('Okedo removido.')
  })

  it('acumula movimentos rápidos usando o estado mais recente', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.addInstrument('okedo'))
    const id = result.current.selectedId!
    act(() => {
      result.current.moveInstrument(id, 0.1, 0)
      result.current.moveInstrument(id, 0.1, 0)
      result.current.moveInstrument(id, 0, 0.1)
    })
    expect(result.current.selected?.x).toBeCloseTo(2.2)
    expect(result.current.selected?.y).toBeCloseTo(2.1)
  })

  it('não perde instrumentos ao receber movimento de identificador ausente', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.addInstrument('okedo'))
    const before = result.current.presentation
    act(() => result.current.moveInstrument('removido', 1, 1))
    expect(result.current.presentation).toBe(before)
    expect(result.current.selected?.id).toBe(before.maps[0]!.instruments[0]!.id)
  })
})
