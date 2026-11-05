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
