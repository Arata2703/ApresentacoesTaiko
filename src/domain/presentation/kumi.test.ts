import { describe, it, expect } from 'vitest'
import { presentationFixture } from '../../test/presentationFixture'
import {
  resizeStage,
  updateMapInstrument,
  StageResizeConflict,
  addMapInstrument,
  assignInstrumentPlayers,
  removeMapInstrument,
} from './maps'
import {
  changeKumi,
  createKumi,
  kumiFor,
  pruneKumis,
  ungroupKumi,
} from './kumi'
import { duplicateMap } from './duplicateMap'
import { removePresentationPerson } from './people'
import { assertNewId } from './rules'

function fixture() {
  return addMapInstrument(presentationFixture(), 'a', 'shime', 'shime')
}
describe('Kumi', () => {
  it('redimensiona sem deformar Kumi e preserva o projeto quando o conjunto não cabe', () => {
    let p = fixture()
    p = updateMapInstrument(p, 'a', 'drum', { position: { x: 0.5, y: 2.5 } })
    p = updateMapInstrument(p, 'a', 'shime', { position: { x: 3.5, y: 4.5 } })
    p = createKumi(p, 'a', 'k', ['drum', 'shime'])
    expect(() => resizeStage(p, { width: 4, depth: 4 })).toThrow(
      StageResizeConflict,
    )
    const next = resizeStage(p, { width: 4, depth: 4 }, true)
    const [a, b] = next.maps[0]!.instruments
    expect(b!.position.x - a!.position.x).toBe(3)
    expect(b!.position.y - a!.position.y).toBe(2)
    expect(() => resizeStage(p, { width: 2, depth: 4 }, true)).toThrow(
      'não cabe',
    )
    expect(() => resizeStage(p, { width: 4, depth: 1 }, true)).toThrow(
      'não cabe',
    )
    expect(
      resizeStage(p, { width: 12, depth: 8 }, true).maps[0]!.instruments[0]!
        .position,
    ).toEqual(p.maps[0]!.instruments[0]!.position)
  })
  it('agrupa sem aninhar e unifica os tocadores, preservando posições e instrumentos', () => {
    const p = fixture(),
      next = createKumi(p, 'a', 'k', ['drum', 'shime', 'shime']),
      map = next.maps[0]!
    expect(map.kumis![0]).toEqual({
      id: 'k',
      name: '',
      instrumentIds: ['drum', 'shime'],
      playerIds: ['ana', 'joao'],
    })
    expect(map.instruments.map((i) => i.position)).toEqual(
      p.maps[0]!.instruments.map((i) => i.position),
    )
    expect(
      map.instruments.every((i) => i.playerIds.join() === 'ana,joao'),
    ).toBe(true)
    expect(kumiFor(map, 'k')?.id).toBe('k')
    expect(kumiFor(map, 'drum')?.id).toBe('k')
    expect(kumiFor(map, 'absent')).toBeUndefined()
    expect(() => createKumi(next, 'a', 'k2', ['drum', 'shime'])).toThrow(
      'aninhar',
    )
    expect(() => createKumi(p, 'a', 'one', ['drum'])).toThrow('dois')
    expect(() => createKumi(p, 'a', 'bad', ['missing', 'shime'])).toThrow(
      'inexistente',
    )
    expect(() => assertNewId(next, 'k')).toThrow()
  })
  it('nome opcional e atribuições pertencem somente ao conjunto; desagrupar mantém os valores efetivos', () => {
    let p = createKumi(fixture(), 'a', 'k', ['drum', 'shime'])
    p = changeKumi(p, 'a', 'k', { name: ' Formação ', playerIds: ['ana'] })
    p = changeKumi(p, 'a', 'k', {})
    expect(p.maps[0]!.kumis![0]!.name).toBe('Formação')
    p = changeKumi(p, 'a', 'k', { name: ' ' })
    p = assignInstrumentPlayers(p, 'a', 'shime', ['joao'])
    expect(p.maps[0]!.kumis![0]!.playerIds).toEqual(['joao'])
    expect(() => changeKumi(p, 'a', 'k', { name: 'a'.repeat(81) })).toThrow()
    expect(() => changeKumi(p, 'a', 'missing', {})).toThrow()
    expect(() => changeKumi(fixture(), 'a', 'missing', {})).toThrow()
    expect(() => changeKumi(p, 'a', 'k', { playerIds: ['absent'] })).toThrow()
    const next = ungroupKumi(p, 'a', ['k'])
    expect(next.maps[0]!.kumis).toEqual([])
    expect(next.maps[0]!.instruments).toEqual(p.maps[0]!.instruments)
    expect(() => ungroupKumi(fixture(), 'a', ['k'])).toThrow()
    const removed = removePresentationPerson(p, 'joao')
    expect(removed.maps[0]!.kumis![0]!.playerIds).toEqual([])
  })
  it('remove referências de componentes apagados e elimina apenas conjuntos vazios', () => {
    const p = createKumi(fixture(), 'a', 'k', ['drum', 'shime'])
    const one = removeMapInstrument(p, 'a', 'shime')
    expect(one.maps[0]!.kumis![0]!.instrumentIds).toEqual(['drum'])
    const empty = removeMapInstrument(one, 'a', 'drum')
    expect(empty.maps[0]!.kumis).toEqual([])
    expect(pruneKumis(fixture().maps[0]!)).toEqual(fixture().maps[0]!)
  })
  it('duplica mapas com identidades independentes e rejeita identidades inválidas de Kumi', () => {
    const p = createKumi(fixture(), 'a', 'k', ['drum', 'shime'])
    const next = duplicateMap(p, 'a', 'copy', ['d2', 's2'], ['k2'])
    expect(next.maps.at(-1)!.kumis![0]).toEqual({
      ...p.maps[0]!.kumis![0],
      id: 'k2',
      instrumentIds: ['d2', 's2'],
    })
    expect(() => duplicateMap(p, 'a', 'copy', ['d2', 's2'])).toThrow(
      'cada Kumi',
    )
    expect(() => duplicateMap(p, 'a', 'copy', ['d2', 's2'], ['ana'])).toThrow()
    const four = addMapInstrument(
      addMapInstrument(p, 'a', 'd3', 'okedo'),
      'a',
      'd4',
      'shime',
    )
    const two = createKumi(four, 'a', 'other', ['d3', 'd4'])
    const renamed = changeKumi(two, 'a', 'other', { name: 'Outro' })
    expect(renamed.maps[0]!.kumis![0]!.id).toBe('k')
    expect(renamed.maps[0]!.instruments[0]).toBe(two.maps[0]!.instruments[0])
    expect(() =>
      duplicateMap(
        two,
        'a',
        'copy',
        ['x1', 'x2', 'x3', 'x4'],
        ['same', 'same'],
      ),
    ).toThrow('repetidos')
  })
})
