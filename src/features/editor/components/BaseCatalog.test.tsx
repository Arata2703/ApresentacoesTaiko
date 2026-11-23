import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import App from '../../../App'
import { presentationFixture } from '../../../test/presentationFixture'
import {
  addMapInstrument,
  setInstrumentBase,
} from '../../../domain/presentation/maps'
import { addCustomInstrument } from '../../../domain/presentation/customInstruments'
import { savePresentationCache } from '../../../integrations/presentationCache'
import {
  serializePresentation,
  importPresentation,
} from '../../../integrations/presentationFile'
import { projectMap } from '../editorProjection'

it('oferece Naname para Nagado e retira Tachi das novas escolhas de Okedo e Nagado', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'Adicionar Okedo' }))
  const okedo = screen.getByRole('combobox', { name: 'Base' })
  expect(
    within(okedo).queryByRole('option', { name: /Tachi/ }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Adicionar Nagado' }))
  const nagado = screen.getByRole('combobox', { name: 'Base' })
  expect(
    within(nagado).queryByRole('option', { name: /tachi/i }),
  ).not.toBeInTheDocument()
  expect(nagado).toHaveValue('nagado-suwaridai')
  await user.selectOptions(nagado, 'nagado-naname')
  expect(nagado).toHaveValue('nagado-naname')
})

it.each([
  ['okedo', 'okedo-tachi', 'Okedo Tachi'],
  ['nagado', 'nagado-tachi', 'Nagado tachi'],
] as const)(
  'reabre %s com Tachi sem transformar a atribuição e retira a opção após a troca',
  async (kind, base, label) => {
    let p = addMapInstrument(presentationFixture(), 'a', 'legacy', kind)
    p = setInstrumentBase(p, 'a', 'legacy', base)
    const original = p.maps[0]!.instruments.find(
      (item) => item.id === 'legacy',
    )!
    const reopened = importPresentation(serializePresentation(p))
    expect(reopened).toMatchObject({ status: 'valid', presentation: p })
    expect(
      projectMap(p, 'a')!.instruments.find((item) => item.id === 'legacy')!
        .baseLabel,
    ).toBe(label)
    expect(savePresentationCache(p, 'a')).toBe('')
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      screen.getByRole('button', {
        name: new RegExp(
          '^' + (kind === 'okedo' ? 'Okedo' : 'Nagado') + ', sem tocador',
        ),
      }),
    )
    const select = screen.getByRole('combobox', { name: 'Base' })
    expect(select).toHaveValue(base)
    expect(within(select).getByRole('option', { name: label })).toBeVisible()
    await user.selectOptions(
      select,
      kind === 'okedo' ? 'okedo-suwaridai' : 'nagado-naname',
    )
    expect(
      within(select).queryByRole('option', { name: label }),
    ).not.toBeInTheDocument()
    expect(p.maps[0]!.instruments.find((item) => item.id === 'legacy')).toEqual(
      original,
    )
  },
)

it('oferece o catálogo revisado a instrumentos personalizados', async () => {
  let p = addCustomInstrument(presentationFixture(), {
    id: 'custom',
    name: 'Tambor próprio',
    kind: 'okedo',
  })
  p = addMapInstrument(p, 'a', 'placement', 'okedo', 'custom')
  expect(savePresentationCache(p, 'a')).toBe('')
  const user = userEvent.setup()
  render(<App />)
  await user.click(
    screen.getByRole('button', { name: /^Tambor próprio, sem tocador/ }),
  )
  const select = screen.getByRole('combobox', { name: 'Base' })
  expect(
    within(select).queryByRole('option', { name: /tachi$/i }),
  ).not.toBeInTheDocument()
  expect(
    within(select).getByRole('option', { name: 'Shime tachidai' }),
  ).toBeVisible()
  await user.selectOptions(select, 'nagado-naname')
  expect(select).toHaveValue('nagado-naname')
})
