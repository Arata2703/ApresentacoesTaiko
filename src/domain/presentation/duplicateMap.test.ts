import {
  addCustomInstrument,
  updateCustomInstrument,
} from './customInstruments'
import { addMapInstrument, setInstrumentBase } from './maps'
import { iconPng } from '../../test/iconPng'
import { describe, expect, it } from 'vitest'
import { duplicateMap } from './duplicateMap'
import { presentationFixture } from '../../test/presentationFixture'
import { freeze } from '../../test/freeze'
import { updateMapInstrument } from './maps'

describe('duplicação de mapa', () => {
  it('copia formação com novas identidades e preserva pessoas sem compartilhar edição', () => {
    const source = freeze(presentationFixture())
    const result = duplicateMap(source, 'a', 'copy', ['copy-drum'])
    const copy = result.maps.find((map) => map.id === 'copy')!
    expect(copy.title).toBe('Ibuki (cópia)')
    expect(copy.instruments[0]).toEqual({
      ...source.maps[0]!.instruments[0],
      id: 'copy-drum',
    })
    expect(result.sequence.map((item) => item.id)).toEqual([
      'entry',
      'b',
      'middle',
      'a',
      'copy',
      'exit',
    ])
    const changed = updateMapInstrument(result, 'copy', 'copy-drum', {
      position: { x: 9, y: 7 },
    })
    expect(changed.maps.find((map) => map.id === 'a')).toEqual(source.maps[0])
    expect(result.people).toEqual(source.people)
    expect(source.maps).toHaveLength(2)
    expect(() => duplicateMap(source, 'a', 'copy', [])).toThrow('identidade')
    expect(() => duplicateMap(source, 'a', 'a', ['new'])).toThrow('ID')
    expect(() => duplicateMap(source, 'a', 'new', ['drum'])).toThrow('ID')
    expect(() => duplicateMap(source, 'missing', 'new', [])).toThrow(
      'inexistente',
    )
  })
})

it('preserva o vínculo personalizado ao duplicar e acompanha a edição do catálogo', () => {
  let p = addCustomInstrument(presentationFixture(), {
    id: 'custom',
    name: 'Tambor',
    kind: 'shime',
    png: iconPng,
  })
  p = addMapInstrument(p, 'a', 'custom-one', 'shime', 'custom')
  p = setInstrumentBase(p, 'a', 'custom-one', 'okedo-eitetsu')
  p = duplicateMap(p, 'a', 'copy', ['builtin-copy', 'custom-copy'])
  const copy = p.maps.find((map) => map.id === 'copy')!.instruments[1]!
  expect(copy).toEqual({ ...p.maps[0]!.instruments[1], id: 'custom-copy' })
  const edited = updateCustomInstrument(p, 'custom', {
    name: 'Revisado',
    kind: 'nagado',
  })
  expect(edited.maps.find((map) => map.id === 'copy')!.instruments[1]).toEqual({
    ...copy,
    kind: 'nagado',
  })
})
