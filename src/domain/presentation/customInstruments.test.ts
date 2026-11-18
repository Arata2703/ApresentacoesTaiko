import { expect, it } from 'vitest'
import { addCustomInstrument, validateIconPng } from './customInstruments'
import { addMap, addMapInstrument, setInstrumentBase } from './maps'
import { createPresentation } from './presentation'
import { iconPng } from '../../test/iconPng'
import type { BaseId } from './model'
import type { InstrumentKind } from '../stage'

const p = addMap(createPresentation('p', 'Ensaio'), 'm', 'Música', {
  width: 10,
  depth: 6,
})
const custom = {
  id: 'custom',
  name: '  Tambor de ensaio ',
  kind: 'shime' as const,
}

it('cadastra ícones independentes e coloca instrumentos próprios sem base', () => {
  const withFirst = addCustomInstrument(p, custom)
  const withBoth = addCustomInstrument(withFirst, {
    ...custom,
    id: 'picture',
    png: iconPng,
  })
  const onStage = addMapInstrument(
    withBoth,
    'm',
    'instance',
    'shime',
    custom.id,
  )
  expect(onStage.customInstruments).toEqual([
    { ...custom, name: 'Tambor de ensaio' },
    { ...custom, id: 'picture', name: 'Tambor de ensaio', png: iconPng },
  ])
  expect(onStage.maps[0]!.instruments[0]).toMatchObject({
    customInstrumentId: custom.id,
    baseId: null,
  })
  expect(
    setInstrumentBase(onStage, 'm', 'instance', 'okedo-suwaridai').maps[0]!
      .instruments[0]!.baseId,
  ).toBe('okedo-suwaridai')
  expect(
    setInstrumentBase(onStage, 'm', 'instance', null).maps[0]!.instruments[0]!
      .baseId,
  ).toBeNull()
  expect(p.customInstruments).toBeUndefined()
})

it('rejeita referências, ícones e bases inválidos no catálogo próprio', () => {
  const next = addCustomInstrument(p, custom)
  expect(() => addCustomInstrument(next, custom)).toThrow(/já utilizado/)
  expect(() =>
    addCustomInstrument(p, {
      ...custom,
      kind: 'desconhecido' as InstrumentKind,
    }),
  ).toThrow(/Ícone desconhecido/)
  expect(() => addCustomInstrument(p, { ...custom, name: ' ' })).toThrow(/nome/)
  expect(() =>
    addMapInstrument(next, 'm', 'instance', 'okedo', custom.id),
  ).toThrow(/incompatível/)
  expect(() =>
    addMapInstrument(p, 'm', 'instance', 'shime', custom.id),
  ).toThrow(/inexistente/)
  const onStage = addMapInstrument(next, 'm', 'instance', 'shime', custom.id)
  expect(() =>
    setInstrumentBase(onStage, 'm', 'instance', 'desconhecida' as BaseId),
  ).toThrow(/Base desconhecida/)
})

it.each(['a'.repeat(100_004), 'abc', 'abcd'])(
  'recusa dados de ícone inválidos (%#)',
  (png) => {
    expect(() => validateIconPng(png)).toThrow(/Ícone inválido/)
  },
)
