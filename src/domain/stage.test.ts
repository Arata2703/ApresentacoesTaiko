import { describe, expect, it } from 'vitest'
import {
  catalog,
  createInstrument,
  getInstrumentType,
  stageSize,
  updateInstrument,
} from './stage'

describe('catálogo e criação', () => {
  it('oferece os 12 tipos sem identidades duplicadas', () => {
    expect(catalog).toHaveLength(12)
    expect(new Set(catalog.map((item) => item.kind)).size).toBe(12)
    for (const type of catalog) expect(getInstrumentType(type.kind)).toBe(type)
  })
  it.each(['okedo', 'shime', 'nagado-p', 'nagado-m', 'nagado-g'] as const)(
    '%s começa com a base suwaridai',
    (kind) => {
      expect(getInstrumentType(kind).base).toBe('Suwaridai')
    },
  )
  it('cria instâncias independentes em posições dentro do palco', () => {
    for (let count = 0; count < 20; count++) {
      const item = createInstrument('okedo', `id-${count}`, count)
      expect(item).toMatchObject({
        id: `id-${count}`,
        kind: 'okedo',
        player: '',
        rotation: 0,
      })
      expect(item.x).toBeGreaterThan(0)
      expect(item.x).toBeLessThan(stageSize.width)
      expect(item.y).toBeGreaterThan(0)
      expect(item.y).toBeLessThan(stageSize.depth)
    }
    expect(createInstrument('okedo', 'a', 0)).not.toBe(
      createInstrument('okedo', 'b', 0),
    )
  })
})

describe('posição e rotação no palco', () => {
  const original = [
    createInstrument('okedo', 'a', 0),
    createInstrument('shime', 'b', 1),
  ]
  it('mantém a posição nos limites e normaliza rotação sem modificar o original', () => {
    const result = updateInstrument(original, 'a', {
      x: -20,
      y: 100,
      rotation: -90,
    })
    expect(result[0]).toMatchObject({ x: 0.5, y: 5.4, rotation: 270 })
    expect(original[0]).toMatchObject({ x: 2, y: 2, rotation: 0 })
    expect(result[1]).toBe(original[1])
  })
  it('preserva coordenadas válidas ao receber números inválidos', () => {
    const result = updateInstrument(original, 'a', {
      x: NaN,
      y: Infinity,
      rotation: NaN,
      player: 'Ana',
    })
    expect(result[0]).toMatchObject({ x: 2, y: 2, rotation: 0, player: 'Ana' })
  })
  it('limita também o lado direito e a frente do palco', () => {
    expect(updateInstrument(original, 'a', { x: 20, y: -10 })[0]).toMatchObject(
      { x: 9.5, y: 0.6 },
    )
  })
  it.each([
    [450, 90],
    [360, 0],
    [-450, 270],
    [45, 45],
  ])('normaliza %s graus para %s', (input, expected) => {
    expect(
      updateInstrument(original, 'a', { rotation: input })[0].rotation,
    ).toBe(expected)
  })
  it('mantém os dados se o identificador não existir', () => {
    expect(updateInstrument(original, 'ausente', { player: 'Outro' })).toEqual(
      original,
    )
    expect(updateInstrument([], 'ausente', { x: 3 })).toEqual([])
  })
})
