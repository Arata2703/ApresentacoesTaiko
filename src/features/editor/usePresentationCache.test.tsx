import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useStageEditor } from './useStageEditor'
import { presentationFixture } from '../../test/presentationFixture'
import {
  presentationCacheKey,
  readPresentationCache,
  savePresentationCache,
} from '../../integrations/presentationCache'
import { createPresentation } from '../../domain/presentation/presentation'
import App from '../../App'

describe('salvamento automático', () => {
  it('restaura integrantes, músicas, instrumentos, sequência e mapa aberto ao remontar', async () => {
    const first = renderHook(useStageEditor)
    act(() => first.result.current.openPresentation(presentationFixture()))
    act(() => first.result.current.selectMap('a'))
    await waitFor(() => expect(readPresentationCache().data?.mapId).toBe('a'))
    const saved = first.result.current.presentation
    first.unmount()
    const restored = renderHook(useStageEditor)
    expect(restored.result.current.presentation).toEqual(saved)
    expect(restored.result.current.page?.song).toBe('Ibuki')
    restored.unmount()
    savePresentationCache(saved, 'missing')
    const fallback = renderHook(useStageEditor)
    expect(fallback.result.current.activeMapId).toBe('b')
    fallback.unmount()
    savePresentationCache(createPresentation('empty', 'Vazia'), null)
    const empty = renderHook(useStageEditor)
    expect(empty.result.current.page).toBeNull()
  })
  it('salva ao sair e mostra falha de quota sem perder a sessão', async () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.setTitle('Festival'))
    act(() => window.dispatchEvent(new Event('pagehide')))
    expect(readPresentationCache().data?.presentation.title).toBe('Festival')
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    act(() => result.current.addMusic())
    await waitFor(() =>
      expect(result.current.cache.message).toContain('Não foi possível salvar'),
    )
    expect(result.current.presentation.maps).toHaveLength(2)
    write.mockRestore()
    act(() => result.current.setSong('Yatai'))
    await waitFor(() => expect(result.current.cache.message).toBe(''))
  })
  it('não sobrescreve uma cópia danificada sem ação explícita', async () => {
    localStorage.setItem(presentationCacheKey, 'damaged')
    render(<App />)
    expect(screen.getByText(/Não foi possível restaurar/)).toBeVisible()
    expect(localStorage.getItem(presentationCacheKey)).toBe('damaged')
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Substituir cópia local pelos dados atuais',
      }),
    )
    await waitFor(() =>
      expect(
        screen.queryByText(/Não foi possível restaurar/),
      ).not.toBeInTheDocument(),
    )
    expect(readPresentationCache().data?.presentation.title).toBe(
      'Minha apresentação',
    )
  })
})
