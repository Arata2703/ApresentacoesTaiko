import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStageEditor } from './useStageEditor'
import { createPresentation } from '../../domain/presentation/presentation'
import { presentationFixture } from '../../test/presentationFixture'
import {
  importPresentation,
  serializePresentation,
} from '../../integrations/presentationFile'

describe('gerenciamento de músicas', () => {
  it('insere o mapa arrastado na posição de destino e preserva as transições', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.openPresentation(presentationFixture()))
    act(() => {
      result.current.reorderSlide('missing', 'a')
      result.current.reorderSlide('a', 'missing')
      result.current.reorderSlide('a', 'a')
    })
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      ['entry', 'b', 'middle', 'a', 'exit'],
    )
    act(() => result.current.reorderSlide('b', 'a'))
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      ['entry', 'middle', 'a', 'b', 'exit'],
    )
    expect(
      result.current.presentation.transitions.find((t) => t.id === 'middle')!
        .needsReview,
    ).toBe(true)
    act(() => result.current.reorderSlide('b', 'a', 'before'))
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      ['entry', 'middle', 'b', 'a', 'exit'],
    )
  })
  it('adiciona, duplica, reordena, remove e reabre mantendo identidades e dados', () => {
    const { result } = renderHook(useStageEditor)
    const original = result.current.activeMapId!
    act(() => result.current.addInstrument('okedo'))
    act(() =>
      result.current.commitPlayers(result.current.selectedId!, [
        { name: 'Ana' },
      ]),
    )
    act(() => result.current.duplicateMusic())
    const copy = result.current.activeMapId!
    expect(copy).not.toBe(original)
    expect(result.current.instruments[0]!.player).toBe('Ana')
    expect(result.current.instruments[0]!.id).not.toBe(
      result.current.presentation.maps[0]!.instruments[0]!.id,
    )
    act(() => result.current.addMusic())
    const added = result.current.activeMapId!
    act(() => result.current.moveSlide(added, -1))
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      [original, added, copy],
    )
    act(() => result.current.moveSlide(added, 1))
    act(() => result.current.removeMusic())
    expect(result.current.activeMapId).toBe(copy)
    act(() => result.current.selectMap(original))
    act(() => result.current.removeMusic())
    expect(result.current.activeMapId).toBe(copy)
    const saved = importPresentation(
      serializePresentation(result.current.presentation),
    )
    if (saved.status !== 'valid') throw new Error('Falha ao reabrir')
    act(() => result.current.openPresentation(saved.presentation))
    expect(result.current.activeMapId).toBe(copy)
    act(() => result.current.removeMusic())
    expect(result.current.page).toBeNull()
    act(() => {
      result.current.removeMusic()
      result.current.duplicateMusic()
      result.current.moveSlide('missing', 1)
    })
    act(() => result.current.addMusic())
    expect(result.current.page?.song).toBe('Música 1')
  })
  it('protege extremos, mantém textos e sinaliza transições quando os mapas mudam', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.openPresentation(presentationFixture()))
    act(() => {
      result.current.moveSlide('entry', -1)
      result.current.moveSlide('exit', 1)
      result.current.moveSlide('missing', -1)
    })
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      ['entry', 'b', 'middle', 'a', 'exit'],
    )
    act(() => result.current.moveSlide('middle', 1))
    expect(result.current.presentation.sequence.map((item) => item.id)).toEqual(
      ['entry', 'b', 'a', 'middle', 'exit'],
    )
    expect(
      result.current.presentation.transitions.find((t) => t.id === 'middle'),
    ).toMatchObject({
      needsReview: true,
      instructions: 'Mover okedo.\nLevar bases para o fundo.',
    })
    act(() => result.current.removeMusic())
    expect(result.current.presentation.transitions).toHaveLength(3)
    act(() =>
      result.current.openPresentation(createPresentation('empty', 'Vazia')),
    )
    act(() => result.current.addMusic())
    act(() => result.current.duplicateMusic())
    expect(result.current.instruments).toEqual([])
  })
})
