import { describe, expect, it } from 'vitest'
import { createInstrument, updateInstrument } from './stage'

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
})
