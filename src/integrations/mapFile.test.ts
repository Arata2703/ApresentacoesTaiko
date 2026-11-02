import { describe, expect, it } from 'vitest'
import { createInstrument } from '../domain/stage'
import { parseMap, serializeMap } from './mapFile'

const map = {
  title: 'Mostra Japão',
  song: 'Ibuki',
  instruments: [createInstrument('okedo', 'a', 0)],
}
describe('arquivo editável do mapa', () => {
  it('não exporta seleção, mensagens ou outros dados da interface', () => {
    const editorState = { ...map, selectedId: 'a', message: 'interno' }
    expect(JSON.parse(serializeMap(editorState))).toEqual({
      format: 'taiko-map',
      version: 1,
      ...map,
    })
  })
  it('preserva títulos, nomes, posições e rotação no ciclo completo', () => {
    const original = {
      ...map,
      instruments: [{ ...map.instruments[0]!, player: 'João', rotation: 90 }],
    }
    expect(parseMap(serializeMap(original))).toEqual(original)
    expect(
      parseMap(serializeMap({ ...map, instruments: [] })).instruments,
    ).toEqual([])
  })
  it.each([
    'não é json',
    'null',
    '[]',
    '0',
    '{}',
    JSON.stringify({ ...map, format: 'outro', version: 1 }),
    JSON.stringify({ ...map, format: 'taiko-map', version: 2 }),
    ...[
      { title: 1 },
      { title: 'a'.repeat(81) },
      { song: null },
      { instruments: null },
      { instruments: Array(501).fill(map.instruments[0]) },
    ].map((change) =>
      JSON.stringify({ format: 'taiko-map', version: 1, ...map, ...change }),
    ),
  ])('rejeita formato inválido: %s', (source) => {
    expect(() => parseMap(source)).toThrow()
  })
  it('limita tamanho antes de analisar JSON', () => {
    expect(() => parseMap(' '.repeat(1_000_001))).toThrow('muito grande')
  })
  it.each([
    null,
    [],
    { id: undefined },
    { id: '' },
    { id: 1 },
    { kind: 'desconhecido' },
    { player: null },
    { player: 'a'.repeat(81) },
    { x: null },
    { x: 0 },
    { x: 10 },
    { y: 0 },
    { y: 6 },
    { rotation: -1 },
    { rotation: 360 },
  ])('rejeita instrumento inválido %j', (change) => {
    const item =
      change === null || Array.isArray(change)
        ? change
        : { ...map.instruments[0], ...change }
    expect(() =>
      parseMap(serializeMap({ ...map, instruments: [item] } as never)),
    ).toThrow('Instrumento inválido')
  })
  it('rejeita identificadores duplicados e descarta propriedades externas', () => {
    expect(() =>
      parseMap(
        serializeMap({
          ...map,
          instruments: [...map.instruments, ...map.instruments],
        }),
      ),
    ).toThrow('Instrumento inválido')
    expect(
      parseMap(
        JSON.stringify({
          format: 'taiko-map',
          version: 1,
          ...map,
          extra: true,
        }),
      ),
    ).toEqual(map)
  })
})
