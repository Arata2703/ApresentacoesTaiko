import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStageEditor } from '../editor/useStageEditor'
import { useTransitions } from './useTransitions'
import { readPresentationCache } from '../../integrations/presentationCache'

describe('operações de transição na interface', () => {
  it('cria nas posições opcionais, revisa e remove preservando os dados', async () => {
    const { result } = renderHook(() => {
      const editor = useStageEditor()
      return {
        editor,
        transitions: useTransitions(
          editor.presentation,
          editor.updatePresentation,
        ),
      }
    })
    act(() => {
      result.current.transitions.change('Ignorar', '')
      result.current.transitions.review()
      result.current.transitions.remove()
      result.current.transitions.create('missing')
    })
    expect(result.current.editor.presentation.transitions).toEqual([])
    const first = result.current.editor.activeMapId!
    act(() => result.current.editor.addMusic())
    const second = result.current.editor.activeMapId!
    act(() => result.current.transitions.create(null))
    const entry = result.current.transitions.selected!.id
    act(() => result.current.transitions.create(first))
    const middle = result.current.transitions.selected!.id
    act(() =>
      result.current.transitions.change(
        'Ponte',
        'Mover bases.\nAguardar sinal.',
      ),
    )
    act(() => result.current.transitions.create(second))
    const exit = result.current.transitions.selected!.id
    expect(
      result.current.editor.presentation.sequence.map((item) => item.id),
    ).toEqual([entry, first, middle, second, exit])
    act(() => result.current.editor.moveSlide(first, 1))
    act(() => result.current.transitions.open(middle))
    expect(result.current.transitions.selected).toMatchObject({
      instructions: 'Mover bases.\nAguardar sinal.',
      needsReview: true,
    })
    act(() => result.current.transitions.review())
    expect(result.current.transitions.selected!.needsReview).toBe(false)
    await waitFor(() =>
      expect(
        readPresentationCache().data?.presentation.transitions.find(
          (t) => t.id === middle,
        )?.tsunagiName,
      ).toBe('Ponte'),
    )
    act(() => result.current.transitions.remove())
    expect(result.current.transitions.selected).toBeUndefined()
    expect(result.current.editor.presentation.maps).toHaveLength(2)
    act(() => result.current.transitions.open('missing'))
    expect(result.current.transitions.selected).toBeUndefined()
    act(() => result.current.transitions.close())
  })
  it('salva formatação direta e a preserva ao renomear e restaurar a cópia local', async () => {
    const { result, unmount } = renderHook(() => {
      const editor = useStageEditor()
      return {
        editor,
        transitions: useTransitions(
          editor.presentation,
          editor.updatePresentation,
        ),
      }
    })
    act(() => result.current.transitions.create(null))
    act(() =>
      result.current.transitions.change(
        'Ponte',
        '<p><strong>Mover</strong></p>',
        'html',
      ),
    )
    act(() =>
      result.current.transitions.change(
        'Novo nome',
        '<p><strong>Mover</strong></p>',
      ),
    )
    await waitFor(() =>
      expect(
        readPresentationCache().data?.presentation.transitions[0],
      ).toMatchObject({
        instructionsFormat: 'html',
        instructions: '<p><strong>Mover</strong></p>',
        tsunagiName: 'Novo nome',
      }),
    )
    unmount()
    const restored = renderHook(() => useStageEditor())
    expect(restored.result.current.presentation.transitions[0]).toMatchObject({
      instructionsFormat: 'html',
      instructions: '<p><strong>Mover</strong></p>',
    })
  })
})
