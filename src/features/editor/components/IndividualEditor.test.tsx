import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../../../App'
import { useStageEditor } from '../useStageEditor'
import { catalog } from '../../../domain/stage'
import {
  bases,
  instrumentDefinition,
} from '../../../domain/presentation/catalog'
import {
  importPresentation,
  serializePresentation,
} from '../../../integrations/presentationFile'
import { createPresentation } from '../../../domain/presentation/presentation'

describe('editor individual M07', () => {
  it('desmarca ao clicar no palco vazio, preservando instrumentos, rótulos e controles do painel', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    const drum = screen.getByRole('button', { name: /Okedo, sem tocador/ })
    expect(drum).toHaveAttribute('aria-pressed', 'true')
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Base' }),
      'okedo-eitetsu',
    )
    expect(drum).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(
      screen.getByRole('region', { name: 'Palco de 10 por 6 metros' }),
    )
    expect(drum).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('heading', { name: 'Cada detalhe no seu lugar.' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('combobox', { name: 'Base' }),
    ).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar tocadores de Okedo' }),
    )
    expect(drum).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: 'Base' })).toHaveValue(
      'okedo-eitetsu',
    )
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar tocadores de Okedo' }),
    )
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Tocadores no instrumento' }),
      'Ana',
    )
    await userEvent.click(
      screen.getByRole('region', { name: 'Palco de 10 por 6 metros' }),
    )
    expect(
      screen.getByRole('button', { name: /Okedo, tocador Ana/ }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(
      screen.getByRole('button', { name: 'Integrantes (1)' }),
    ).toBeVisible()
  })
  it('oferece apenas bases compatíveis, permite retirar base e preserva atribuições', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    const base = screen.getByRole('combobox', { name: 'Base' })
    expect(base).toHaveValue('okedo-suwaridai')
    expect(
      screen.queryByRole('option', { name: 'Shime tachidai' }),
    ).not.toBeInTheDocument()
    await userEvent.selectOptions(base, 'okedo-eitetsu')
    expect(base).toHaveValue('okedo-eitetsu')
    await userEvent.selectOptions(base, '')
    expect(base).toHaveValue('')
    expect(screen.getByText(/Tamanho do desenho ilustrativo/)).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Shime' }),
    )
    expect(screen.getByRole('combobox', { name: 'Base' })).toHaveValue(
      'shime-suwaridai',
    )
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Base' }),
      'shime-tachidai',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Fue' }))
    expect(screen.getByRole('combobox', { name: 'Base' })).toHaveValue('')
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })
  it('valida medidas antes de aplicar e reposiciona instrumentos ao reduzir o palco', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    await userEvent.click(screen.getByText(/Medidas do palco/))
    const width = screen.getByLabelText('Largura do palco · m')
    const depth = screen.getByLabelText('Profundidade do palco · m')
    await userEvent.clear(width)
    await userEvent.click(
      screen.getByRole('button', { name: 'Aplicar medidas' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('maiores que zero')
    expect(
      screen.getByRole('region', { name: 'Palco de 10 por 6 metros' }),
    ).toBeVisible()
    await userEvent.type(width, '1')
    await userEvent.clear(depth)
    await userEvent.type(depth, '1.5')
    await userEvent.click(
      screen.getByRole('button', { name: 'Aplicar medidas' }),
    )
    expect(
      screen.getByRole('region', { name: 'Palco de 1 por 1.5 metros' }),
    ).toBeVisible()
    expect(screen.getByLabelText('Horizontal · m')).toHaveValue(1)
    expect(screen.getByLabelText('Profundidade · m')).toHaveValue(1.5)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('salva e reabre todos os tipos, bases, posição, rotação, palco e tocadores', () => {
    const { result } = renderHook(useStageEditor)
    act(() => result.current.changeBase(null))
    for (const type of catalog) {
      act(() => result.current.addInstrument(type.kind))
      expect(result.current.selected?.baseId).toBe(
        instrumentDefinition(type.kind).defaultBaseId,
      )
      const compatible = bases.filter((base) => base.kinds.includes(type.kind))
      for (const base of compatible)
        act(() => result.current.changeBase(base.id))
      act(() => result.current.changeSelected({ x: 3, y: 2, rotation: 90 }))
    }
    act(() =>
      result.current.commitPlayers(result.current.selectedId!, [
        { name: 'Ana' },
      ]),
    )
    act(() => result.current.resizeStage({ width: 12, depth: 8 }))
    const saved = result.current.presentation
    const reopened = importPresentation(serializePresentation(saved))
    expect(reopened.status).toBe('valid')
    if (reopened.status !== 'valid') throw new Error('Falha ao reabrir')
    act(() => result.current.openPresentation(reopened.presentation))
    expect(result.current.presentation).toEqual(saved)
    expect(result.current.instruments).toHaveLength(12)
    expect(result.current.instruments.at(-1)?.player).toBe('Ana')
    act(() =>
      result.current.openPresentation(createPresentation('empty', 'Vazia')),
    )
    act(() => {
      result.current.resizeStage({ width: 1, depth: 1 })
      result.current.changeBase(null)
    })
    expect(result.current.presentation.maps).toEqual([])
  })
})
