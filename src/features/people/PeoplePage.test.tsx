import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { download } from '../../integrations/download'
import {
  importPresentation,
  serializePresentation,
} from '../../integrations/presentationFile'
import { presentationFixture } from '../../test/presentationFixture'
import { assignInstrumentPlayers } from '../../domain/presentation/maps'
import { createPresentation } from '../../domain/presentation/presentation'

vi.mock('../../integrations/download', () => ({ download: vi.fn() }))
afterEach(() => vi.clearAllMocks())

async function people() {
  await userEvent.click(screen.getByRole('button', { name: /^Integrantes \(/ }))
}
async function add(name: string) {
  await userEvent.type(screen.getByLabelText('Nome do novo integrante'), name)
  await userEvent.click(
    screen.getByRole('button', { name: 'Adicionar integrante' }),
  )
}
async function open(source: string) {
  fireEvent.change(screen.getByLabelText('Abrir apresentação'), {
    target: {
      files: [{ size: source.length, text: () => Promise.resolve(source) }],
    },
  })
  await screen.findByRole('alertdialog')
  await userEvent.click(
    screen.getByRole('button', { name: 'Substituir e abrir' }),
  )
}
async function save() {
  await userEvent.click(
    screen.getByRole('button', { name: 'Baixar apresentação editável' }),
  )
  const blob = vi.mocked(download).mock.calls.at(-1)![0]
  const source = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsText(blob)
  })
  const result = importPresentation(source)
  if (result.status !== 'valid') throw new Error('Arquivo inválido')
  return { source, p: result.presentation }
}

describe('integrantes pela interface', () => {
  it('edita o nome com duplo clique e salva com Enter', async () => {
    render(<App />)
    await people()
    await add('Ana')
    await userEvent.dblClick(
      screen.getByRole('button', {
        name: 'Editar nome de Ana (pessoa 1)',
      }),
    )
    const input = screen.getByLabelText('Novo nome de Ana (pessoa 1)')
    await userEvent.clear(input)
    await userEvent.type(input, 'Ana Silva')
    await userEvent.dblClick(input)
    expect(input).toHaveValue('Ana Silva')
    await userEvent.keyboard('{Enter}')
    expect(
      screen.getByRole('row', { name: 'Pessoa 1: Ana Silva' }),
    ).toBeVisible()
  })
  it('edita pelo teclado, salva ao sair do campo e cancela um nome alterado com Esc', async () => {
    render(<App />)
    await people()
    await add('Ana')
    await userEvent.click(
      screen.getByRole('button', { name: 'Editar nome de Ana (pessoa 1)' }),
    )
    await userEvent.keyboard('x')
    expect(
      screen.queryByLabelText('Novo nome de Ana (pessoa 1)'),
    ).not.toBeInTheDocument()
    await userEvent.keyboard('{F2}')
    await userEvent.type(
      screen.getByLabelText('Novo nome de Ana (pessoa 1)'),
      ' Silva',
    )
    await userEvent.click(screen.getByLabelText('Nome do novo integrante'))
    expect(
      screen.getByRole('button', {
        name: 'Editar nome de Ana Silva (pessoa 1)',
      }),
    ).toHaveTextContent('Ana Silva')
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Editar nome de Ana Silva (pessoa 1)',
      }),
    )
    await userEvent.keyboard('{Enter}')
    await userEvent.clear(
      screen.getByLabelText('Novo nome de Ana Silva (pessoa 1)'),
    )
    await userEvent.type(
      screen.getByLabelText('Novo nome de Ana Silva (pessoa 1)'),
      'Outro nome',
    )
    await userEvent.keyboard('{Escape}')
    expect(
      screen.getByRole('button', {
        name: 'Editar nome de Ana Silva (pessoa 1)',
      }),
    ).toHaveTextContent('Ana Silva')
    expect((await save()).p.people[0]!.name).toBe('Ana Silva')
  })
  it('permite voltar à área de mapas quando o arquivo ainda não tem nenhum mapa', async () => {
    render(<App />)
    await open(serializePresentation(createPresentation('empty', 'Vazia')))
    await people()
    await add('Ana')
    await userEvent.click(
      screen.getByRole('button', { name: 'Voltar aos mapas' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Criar primeiro mapa' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).toBeVisible()
  })
  it('cria homônimos distintos, valida nomes, cancela renomeação e exclui cadastro sem uso', async () => {
    render(<App />)
    await people()
    expect(screen.getByText(/Nenhum integrante/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    ).toBeEnabled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar integrante' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('1 a 80')
    await add('Ana')
    await add('Ana')
    expect(screen.getByText('2 integrantes')).toBeVisible()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar nome de Ana (pessoa 1)' }),
    )
    const input = screen.getByLabelText('Novo nome de Ana (pessoa 1)')
    await userEvent.clear(input)
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('1 a 80')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const before = await save()
    expect(before.p.people[0]!.id).not.toBe(before.p.people[1]!.id)
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Remover Ana (pessoa 2)',
      }),
    )
    const confirmation = screen.getByRole('alertdialog')
    expect(confirmation).not.toHaveTextContent('atribuições')
    await userEvent.click(
      within(confirmation).getByRole('button', { name: 'Confirmar' }),
    )
    expect(screen.getByText('1 integrante')).toBeVisible()
    expect((await save()).p.people).toEqual([before.p.people[0]])
  })
  it('atribui várias pessoas por identidade e reabre sem perder as escolhas', async () => {
    render(<App />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar Okedo' }),
    )
    expect(screen.getByText(/Cadastre os integrantes/)).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Gerenciar integrantes' }),
    )
    await add('Ana')
    await add('Ana')
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Primeira música' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, sem tocador/ }),
    )
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    )
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 2' }),
    )
    expect(
      screen.getByRole('button', { name: /Okedo, tocador Ana\/Ana/ }),
    ).toBeVisible()
    const multiple = await save()
    await open(multiple.source)
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, tocador Ana\/Ana/ }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 2' }),
    ).toBeChecked()
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 2' }),
    ).toBeChecked()
    const saved = await save()
    expect(saved.p.maps[0]!.instruments[0]!.playerIds).toEqual([
      saved.p.people[1]!.id,
    ])
    await open(saved.source)
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, tocador Ana/ }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 1' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Ana · pessoa 2' }),
    ).toBeChecked()
  })
  it('renomeia uma pessoa usada em vários mapas sem duplicar identidade ou alterar as demais atribuições', async () => {
    render(<App />)
    const p = assignInstrumentPlayers(presentationFixture(), 'b', 'flute', [
      'ana',
    ])
    await open(serializePresentation(p))
    await people()
    await userEvent.dblClick(
      screen.getByRole('button', { name: 'Editar nome de Ana (pessoa 1)' }),
    )
    const input = screen.getByLabelText('Novo nome de Ana (pessoa 1)')
    await userEvent.clear(input)
    await userEvent.type(input, 'Ana Silva')
    await userEvent.keyboard('{Enter}')
    const saved = await save()
    expect(saved.p.people).toEqual([
      { id: 'ana', name: 'Ana Silva' },
      p.people[1],
    ])
    expect(saved.p.maps).toEqual(p.maps)
    expect(saved.p.transitions).toEqual(p.transitions)
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Yatai' }),
    )
    expect(
      screen.getByRole('button', { name: /Fue, tocador Ana Silva/ }),
    ).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir mapa Ibuki' }),
    )
    expect(
      screen.getByRole('button', { name: /Okedo, tocador Ana Silva\/João/ }),
    ).toBeVisible()
  })
  it('inclui todos os cadastrados e confirma remoção de pessoa atribuída', async () => {
    render(<App />)
    const p = assignInstrumentPlayers(presentationFixture(), 'a', 'drum', [
      'joao',
    ])
    await open(serializePresentation(p))
    await people()
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect((await save()).p.rosterIds).toEqual(['ana', 'joao'])
    const joao = screen.getByRole('row', { name: 'Pessoa 2: João' })
    await userEvent.click(
      within(joao).getByRole('button', { name: 'Remover João (pessoa 2)' }),
    )
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'retira suas atribuições',
    )
    expect(screen.getByRole('alertdialog')).toHaveTextContent(p.maps[0]!.title)
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Tsunagis: Ponte')
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Cancelar',
      }),
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(
      within(joao).getByRole('button', { name: 'Remover João (pessoa 2)' }),
    )
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Confirmar',
      }),
    )
    const saved = await save()
    expect(saved.p.rosterIds).toEqual(['ana'])
    expect(saved.p.people).toEqual([p.people[0]])
    expect(saved.p.maps[0]?.instruments[0]?.playerIds).toEqual([])
    expect(
      saved.p.transitions.find((item) => item.id === 'middle')!.participantIds,
    ).toEqual([])
    await open(saved.source)
    await people()
    expect(screen.getByRole('row', { name: 'Pessoa 1: Ana' })).toBeVisible()
    expect(screen.queryByRole('row', { name: /João/ })).not.toBeInTheDocument()
  })
})
