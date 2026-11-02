import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStageEditor } from './useStageEditor'

describe('estado do editor', () => {
  it('ignora edição e remoção sem seleção', () => {
    const { result } = renderHook(useStageEditor)
    act(() => {
      result.current.changeSelected({ player: 'Ana' })
      result.current.removeSelected()
    })
    expect(result.current.instruments).toEqual([])
    expect(result.current.selected).toBeUndefined()
  })

  it('mantém instrumentos independentes e altera apenas o selecionado', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.addInstrument('okedo'))
    const firstId = result.current.selectedId!
    act(() => result.current.addInstrument('shime'))
    const secondId = result.current.selectedId!
    expect(secondId).not.toBe(firstId)
    act(() => result.current.changeSelected({ player: 'Bia' }))
    act(() => result.current.selectInstrument(firstId))
    act(() => result.current.changeSelected({ player: 'Ana', rotation: 90 }))
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
    const before = result.current.instruments
    act(() => result.current.moveInstrument('removido', 1, 1))
    expect(result.current.instruments).toBe(before)
    expect(result.current.selected).toBeUndefined()
  })
})
