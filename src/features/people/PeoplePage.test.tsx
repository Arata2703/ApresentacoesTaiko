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
    expect(screen.getByText(/Nenhuma pessoa cadastrada/)).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Exportar PDF deste mapa' }),
    ).toBeDisabled()
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar integrante' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('1 a 80')
    await add('Ana')
    await add('Ana')
    expect(screen.getByText('2 na lista · 2 no cadastro')).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Ana (pessoa 1)' }),
    )
    const input = screen.getByLabelText('Novo nome de Ana (pessoa 1)')
    await userEvent.clear(input)
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nome de Ana (pessoa 1)' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('1 a 80')
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Cancelar renomeação de Ana (pessoa 1)',
      }),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const before = await save()
    expect(before.p.people[0]!.id).not.toBe(before.p.people[1]!.id)
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Excluir cadastro de Ana (pessoa 2)',
      }),
    )
    expect(screen.getByText('1 na lista · 1 no cadastro')).toBeVisible()
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
      screen.getByRole('button', { name: /Okedo, tocador Ana, Ana/ }),
    ).toBeVisible()
    const multiple = await save()
    await open(multiple.source)
    await userEvent.click(
      screen.getByRole('button', { name: /Okedo, tocador Ana, Ana/ }),
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
    await userEvent.click(
      screen.getByRole('button', { name: 'Renomear Ana (pessoa 1)' }),
    )
    const input = screen.getByLabelText('Novo nome de Ana (pessoa 1)')
    await userEvent.clear(input)
    await userEvent.type(input, 'Ana Silva')
    await userEvent.click(
      screen.getByRole('button', { name: 'Salvar nome de Ana (pessoa 1)' }),
    )
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
      screen.getByRole('button', { name: /Okedo, tocador Ana Silva, João/ }),
    ).toBeVisible()
  })
  it('retira da lista sem apagar atribuições e protege exclusão de uso em mapa ou somente transição', async () => {
    render(<App />)
    const p = assignInstrumentPlayers(presentationFixture(), 'a', 'drum', [
      'ana',
    ])
    await open(serializePresentation(p))
    await people()
    const ana = screen.getByRole('article', { name: 'Pessoa 1: Ana' })
    const joao = screen.getByRole('article', { name: 'Pessoa 2: João' })
    expect(
      within(ana).getByRole('button', { name: /Excluir cadastro/ }),
    ).toBeDisabled()
    expect(
      within(joao).getByRole('button', { name: /Excluir cadastro/ }),
    ).toBeDisabled()
    expect(
      within(joao).getByText(/Pessoa atribuída a instrumento ou transição/),
    ).toBeVisible()
    await userEvent.click(within(ana).getByRole('checkbox'))
    await userEvent.click(within(joao).getByRole('checkbox'))
    const saved = await save()
    expect(saved.p.rosterIds).toEqual(['joao'])
    expect(saved.p.people).toEqual(p.people)
    expect(saved.p.maps).toEqual(p.maps)
    expect(saved.p.transitions).toEqual(p.transitions)
    await open(saved.source)
    await people()
    expect(
      screen.getByRole('checkbox', { name: /Na lista de integrantes · João/ }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: /Na lista de integrantes · Ana/ }),
    ).not.toBeChecked()
  })
})
