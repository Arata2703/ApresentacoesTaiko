import {
  importPresentation,
  serializePresentation,
} from '../../integrations/presentationFile'
import { expect, it } from 'vitest'
import {
  addCustomInstrument,
  validateIconPng,
  updateCustomInstrument,
  customInstrumentUsage,
  removeCustomInstrument,
} from './customInstruments'
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

it('atualiza nome e ícone em todas as ocorrências preservando formação e arquivo', () => {
  let source = addCustomInstrument(p, { ...custom, png: iconPng })
  source = addMap(source, 'other', 'Outra música', { width: 10, depth: 6 })
  source = addMapInstrument(source, 'm', 'one', 'shime', custom.id)
  source = addMapInstrument(source, 'other', 'two', 'shime', custom.id)
  source = addMapInstrument(source, 'other', 'builtin', 'okedo')
  source = setInstrumentBase(source, 'm', 'one', 'okedo-eitetsu')
  source = addCustomInstrument(source, {
    id: 'unused',
    name: 'Reserva',
    kind: 'shime',
  })
  const result = updateCustomInstrument(source, custom.id, {
    name: '  Tambor novo  ',
    kind: 'nagado',
  })
  expect(result.customInstruments![0]).toEqual({
    id: custom.id,
    name: 'Tambor novo',
    kind: 'nagado',
  })
  expect(result.customInstruments![1]).toEqual(source.customInstruments![1])
  result.maps.forEach((map, index) =>
    expect(map.instruments).toEqual(
      source.maps[index]!.instruments.map((item) =>
        item.customInstrumentId === custom.id
          ? { ...item, kind: 'nagado' }
          : item,
      ),
    ),
  )
  expect(source.customInstruments![0]!.png).toBe(iconPng)
  const pictured = updateCustomInstrument(result, custom.id, {
    name: 'Tambor com imagem',
    kind: 'okedo',
    png: iconPng,
  })
  expect(pictured.customInstruments![0]!.png).toBe(iconPng)
  expect(importPresentation(serializePresentation(pictured))).toMatchObject({
    status: 'valid',
    presentation: pictured,
  })
  expect(
    customInstrumentUsage(result, custom.id).map((map) => map.title),
  ).toEqual(['Música', 'Outra música'])
})

it('recusa edição inválida sem modificar o catálogo ou as ocorrências', () => {
  const source = addCustomInstrument(p, custom)
  expect(() => updateCustomInstrument(p, custom.id, custom)).toThrow(
    /inexistente/,
  )
  expect(() => updateCustomInstrument(source, 'missing', custom)).toThrow(
    /inexistente/,
  )
  for (const input of [
    { name: ' ', kind: 'shime' as const },
    { name: 'a'.repeat(81), kind: 'shime' as const },
    { name: 'Válido', kind: 'missing' as InstrumentKind },
    { name: 'Válido', kind: 'shime' as const, png: 'abc' },
  ])
    expect(() => updateCustomInstrument(source, custom.id, input)).toThrow()
  expect(source.customInstruments).toEqual([
    { ...custom, name: 'Tambor de ensaio' },
  ])
})

it('remove somente instrumentos sem ocorrências e preserva os demais dados', () => {
  let source = addCustomInstrument(p, custom)
  source = addCustomInstrument(source, {
    id: 'unused',
    name: 'Reserva',
    kind: 'shime',
  })
  source = addMapInstrument(source, 'm', 'one', 'shime', custom.id)
  expect(() => removeCustomInstrument(source, custom.id)).toThrow(/em uso/)
  expect(() => removeCustomInstrument(p, custom.id)).toThrow(/inexistente/)
  expect(() => customInstrumentUsage(p, custom.id)).toThrow(/inexistente/)
  const result = removeCustomInstrument(source, 'unused')
  expect(result.customInstruments).toEqual([source.customInstruments![0]])
  expect(result.maps).toBe(source.maps)
  expect(customInstrumentUsage(source, 'unused')).toEqual([])
  expect(source.customInstruments).toHaveLength(2)
})

it('normaliza a abreviação, preserva arquivos antigos e permite limpar o valor', () => {
  const original = addCustomInstrument(p, custom)
  expect(original.customInstruments![0]).not.toHaveProperty('abbreviation')
  const abbreviated = updateCustomInstrument(original, custom.id, {
    ...custom,
    abbreviation: '  Ens.  ',
  })
  expect(abbreviated.customInstruments![0]!.abbreviation).toBe('Ens.')
  expect(importPresentation(serializePresentation(abbreviated))).toMatchObject({
    status: 'valid',
    presentation: abbreviated,
  })
  for (const abbreviation of ['', '   ']) {
    const cleared = updateCustomInstrument(abbreviated, custom.id, {
      ...custom,
      abbreviation,
    })
    expect(cleared.customInstruments![0]).not.toHaveProperty('abbreviation')
  }
  expect(() =>
    addCustomInstrument(p, { ...custom, abbreviation: 'a'.repeat(81) }),
  ).toThrow(/nome/)
  const source = JSON.parse(serializePresentation(original))
  source.presentation.customInstruments[0].abbreviation = 12
  expect(importPresentation(JSON.stringify(source)).status).toBe('error')
})
