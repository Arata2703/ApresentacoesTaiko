import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../../../App'
import { iconPng } from '../../../test/iconPng'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('cadastra pelo topo da lista, reutiliza ícone e permite escolher a base depois', async () => {
  const user = userEvent.setup()
  render(<App />)
  const catalog = screen.getByRole('region', { name: 'Instrumentos' })
  const toggle = within(catalog).getAllByRole('button')[0]!
  expect(toggle).toHaveAccessibleName('Novo instrumento')
  await user.click(toggle)
  await user.click(toggle)
  expect(
    screen.queryByRole('textbox', { name: 'Nome' }),
  ).not.toBeInTheDocument()
  await user.click(toggle)
  await user.type(within(catalog).getByLabelText('Nome'), ' ')
  await user.click(
    within(catalog).getByRole('button', { name: 'Cadastrar instrumento' }),
  )
  expect(within(catalog).getByRole('alert')).toHaveTextContent(
    'Informe um nome',
  )
  await user.clear(within(catalog).getByLabelText('Nome'))
  await user.type(within(catalog).getByLabelText('Nome'), 'Tambor da escola')
  await user.type(
    within(catalog).getByLabelText('Abreviação (opcional)'),
    'Escola',
  )
  await user.selectOptions(
    within(catalog).getByLabelText('Ícone', { exact: true }),
    'shime',
  )
  await user.click(
    within(catalog).getByRole('button', { name: 'Cadastrar instrumento' }),
  )
  const add = within(catalog).getByRole('button', {
    name: 'Adicionar Tambor da escola',
  })
  expect(add.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringContaining('shime'),
  )
  await user.click(add)
  const base = screen.getByRole('combobox', { name: 'Base' })
  expect(base).toHaveValue('')
  await user.selectOptions(base, 'okedo-suwaridai')
  expect(base).toHaveValue('okedo-suwaridai')
})

it('mostra a prévia do SVG, salva o ícone próprio e o recupera ao reabrir', async () => {
  const user = userEvent.setup({ applyAccept: false })
  const createUrl = vi.fn(() => 'blob:instrument-test')
  const revokeUrl = vi.fn()
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = createUrl
      static revokeObjectURL = revokeUrl
    },
  )
  const decode = vi
    .fn()
    .mockRejectedValueOnce(new Error('imagem quebrada'))
    .mockResolvedValue(undefined)
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 32
      naturalHeight = 64
      decode = decode
    },
  )
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
    `data:image/png;base64,${iconPng}`,
  )

  const app = render(<App />)
  await user.click(screen.getByRole('button', { name: 'Novo instrumento' }))
  await user.type(screen.getByLabelText('Nome', { exact: true }), 'Meu tambor')
  const file = screen.getByLabelText('Ícone em SVG ou PNG')
  const openFilePicker = vi.spyOn(file, 'click')
  const source = screen.getByLabelText('Ícone', { exact: true })
  expect(within(source).getAllByRole('option')[0]).toHaveTextContent(
    'Enviar imagem',
  )
  await user.selectOptions(source, 'upload')
  expect(openFilePicker).toHaveBeenCalledTimes(1)
  expect(file).not.toBeVisible()
  expect(source).toHaveValue('okedo')
  await user.selectOptions(source, 'upload')
  expect(openFilePicker).toHaveBeenCalledTimes(2)
  const submit = screen.getByRole('button', { name: 'Cadastrar instrumento' })
  expect(submit).toBeEnabled()
  await user.upload(
    file,
    new File(['inválido'], 'quebrado.svg', { type: 'image/svg+xml' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível abrir esta imagem',
  )
  await user.click(screen.getByRole('button', { name: 'Trocar imagem' }))
  expect(openFilePicker).toHaveBeenCalledTimes(3)
  await user.upload(file, new File(['txt'], 'icone.txt'))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Escolha um arquivo SVG ou PNG',
  )
  await user.upload(file, new File([new Uint8Array(1_000_001)], 'grande.png'))
  expect(await screen.findByRole('alert')).toHaveTextContent('até 1 MB')
  await user.upload(file, new File(['png'], 'icone.png', { type: 'image/png' }))
  expect(
    await screen.findByRole('img', { name: 'Prévia do ícone' }),
  ).toBeVisible()
  let finishDecode!: () => void
  decode.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finishDecode = resolve
      }),
  )
  await user.upload(file, new File(['<svg/>'], 'pendente.svg'))
  expect(submit).toBeDisabled()
  await user.selectOptions(source, 'shime')
  await act(async () => finishDecode())
  expect(
    screen.getByRole('img', { name: 'Prévia do ícone' }).querySelector('img'),
  ).not.toHaveAttribute('src', `data:image/png;base64,${iconPng}`)
  await user.selectOptions(source, 'upload')
  await user.upload(
    screen.getByLabelText('Ícone em SVG ou PNG'),
    new File(['<svg/>'], 'icone.svg', { type: 'image/svg+xml' }),
  )
  expect(
    await screen.findByRole('img', { name: 'Prévia do ícone' }),
  ).toBeVisible()
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 32, 0, 64, 128)
  expect(revokeUrl).toHaveBeenCalledWith('blob:instrument-test')
  await user.click(submit)
  await user.click(screen.getByRole('button', { name: 'Adicionar Meu tambor' }))
  app.unmount()
  render(<App />)
  const item = screen.getByRole('button', { name: /Meu tambor, sem tocador/ })
  expect(
    item.closest('[data-stage-instrument]')!.querySelector('img'),
  ).toHaveAttribute('src', `data:image/png;base64,${iconPng}`)
  await user.click(screen.getByRole('button', { name: 'Novo instrumento' }))
  await user.selectOptions(
    screen.getByLabelText('Ícone', { exact: true }),
    screen.getByRole('option', { name: 'Meu tambor' }),
  )
  expect(
    screen.getByRole('img', { name: 'Prévia do ícone' }).querySelector('img'),
  ).toHaveAttribute('src', `data:image/png;base64,${iconPng}`)
})
