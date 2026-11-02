import { describe, expect, it } from 'vitest'
import { createPresentation } from './presentation'
import { addPerson } from './people'
import {
  addMap,
  addMapInstrument,
  assignInstrumentPlayers,
  removeMapInstrument,
  renameMap,
  resizeStage,
  setInstrumentBase,
  updateMapInstrument,
} from './maps'
import { bases, instrumentDefinitions, instrumentDefinition } from './catalog'
import { freeze } from '../../test/freeze'
import type { InstrumentKind } from '../stage'
import type { BaseId } from './model'

function example() {
  let p = addMap(createPresentation('show', 'Festival'), 'one', 'Ibuki', {
    width: 10,
    depth: 6,
  })
  p = addMap(p, 'two', 'Yatai', { width: 8, depth: 4 })
  p = addMapInstrument(p, 'one', 'a', 'okedo')
  p = addMapInstrument(p, 'one', 'b', 'shime')
  return freeze(p)
}

describe('catálogo do MVP', () => {
  it('contém os 12 tipos e as 8 bases, sem fingir dimensões reais', () => {
    expect(instrumentDefinitions).toHaveLength(12)
    expect(bases).toHaveLength(8)
    expect(new Set(bases.map((base) => base.id)).size).toBe(8)
    for (const type of instrumentDefinitions) {
      expect(type.dimensions).toBeNull()
      expect(instrumentDefinition(type.kind)).toBe(type)
    }
    expect(() => instrumentDefinition('missing' as InstrumentKind)).toThrow(
      'fora do catálogo',
    )
  })
  it.each(instrumentDefinitions)(
    'adiciona $name com base padrão, posição central e sem tocadores',
    (type) => {
      const p = example()
      const next = addMapInstrument(p, 'two', 'new', type.kind)
      expect(next.maps[1]!.instruments[0]).toEqual({
        id: 'new',
        kind: type.kind,
        baseId: type.defaultBaseId,
        playerIds: [],
        position: { x: 4, y: 2 },
        rotation: 0,
      })
      expect(p.maps[1]!.instruments).toEqual([])
      expect(next.maps[0]).toBe(p.maps[0])
    },
  )
  it('associa variações compatíveis e permite remover a base', () => {
    let p = example()
    for (const base of bases) {
      for (const kind of base.kinds) {
        const id = `${base.id}-${kind}`
        p = addMapInstrument(p, 'two', id, kind)
        p = setInstrumentBase(p, 'two', id, base.id)
        expect(
          p.maps[1]!.instruments.find((item) => item.id === id)!.baseId,
        ).toBe(base.id)
      }
    }
    const changed = setInstrumentBase(p, 'one', 'a', null)
    expect(changed.maps[0]!.instruments[0]!.baseId).toBeNull()
    expect(changed.maps[0]!.instruments[1]).toBe(p.maps[0]!.instruments[1])
    expect(() => setInstrumentBase(p, 'one', 'a', 'shime-tachidai')).toThrow(
      'incompatível',
    )
    expect(() => setInstrumentBase(p, 'one', 'a', 'missing' as BaseId)).toThrow(
      'incompatível',
    )
  })
})

describe('operações do mapa', () => {
  it('renomeia e movimenta por metros, preservando IDs, seleção alheia e entrada', () => {
    const p = example()
    const renamed = renameMap(p, 'one', 'Nova música')
    const moved = updateMapInstrument(renamed, 'one', 'a', {
      position: { x: 3.25, y: 1.5 },
    })
    const rotated = updateMapInstrument(moved, 'one', 'a', { rotation: -45 })
    expect(rotated.maps[0]!.title).toBe('Nova música')
    expect(rotated.maps[0]!.instruments[0]).toEqual({
      ...p.maps[0]!.instruments[0],
      position: { x: 3.25, y: 1.5 },
      rotation: 315,
    })
    expect(rotated.maps[0]!.instruments[1]).toBe(p.maps[0]!.instruments[1])
    expect(rotated.maps[1]).toBe(p.maps[1])
    expect(p.maps[0]!.title).toBe('Ibuki')
    expect(p.maps[0]!.instruments[0]!.rotation).toBe(0)
    expect(
      updateMapInstrument(p, 'one', 'a', {}).maps[0]!.instruments[0],
    ).toEqual(p.maps[0]!.instruments[0])
  })
  it('limita o centro aos limites do palco e normaliza rotações', () => {
    const p = example()
    const first = updateMapInstrument(p, 'one', 'a', {
      position: { x: -10, y: 99 },
      rotation: 810,
    })
    expect(first.maps[0]!.instruments[0]!.position).toEqual({ x: 0, y: 6 })
    expect(first.maps[0]!.instruments[0]!.rotation).toBe(90)
    const second = updateMapInstrument(p, 'one', 'a', {
      position: { x: 99, y: -10 },
    })
    expect(second.maps[0]!.instruments[0]!.position).toEqual({ x: 10, y: 0 })
  })
  it('copia medidas recebidas e reposiciona instrumentos ao reduzir o palco', () => {
    const stage = { width: 10, depth: 6 }
    const p = addMap(createPresentation('show', 'Show'), 'one', 'Música', stage)
    stage.width = 99
    expect(p.maps[0]!.stage.width).toBe(10)
    const next = resizeStage(example(), 'one', { width: 3, depth: 2 })
    expect(next.maps[0]!.stage).toEqual({ width: 3, depth: 2 })
    expect(next.maps[0]!.instruments.map((item) => item.position)).toEqual([
      { x: 3, y: 2 },
      { x: 3, y: 2 },
    ])
  })
  it.each([
    { width: 0, depth: 6 },
    { width: -1, depth: 6 },
    { width: NaN, depth: 6 },
    { width: 10, depth: Infinity },
    { width: 10, depth: 0 },
  ])('recusa medidas inválidas %j', (stage) => {
    expect(() => resizeStage(example(), 'one', stage)).toThrow(
      'positivas e finitas',
    )
  })
  it.each([
    { position: { x: NaN, y: 1 } },
    { position: { x: 1, y: Infinity } },
    { rotation: NaN },
    { rotation: Infinity },
  ])('recusa transformações inválidas sem mudar o mapa %j', (changes) => {
    const p = example()
    expect(() => updateMapInstrument(p, 'one', 'a', changes)).toThrow('finit')
    expect(p.maps[0]!.instruments[0]!.position).toEqual({ x: 5, y: 3 })
  })
  it('atribui múltiplas pessoas, evita repetição e remove apenas a instância escolhida', () => {
    let p = addPerson(addPerson(example(), 'ana', 'Ana'), 'bia', 'Bia')
    p = assignInstrumentPlayers(p, 'one', 'a', ['ana', 'bia', 'ana'])
    expect(p.maps[0]!.instruments[0]!.playerIds).toEqual(['ana', 'bia'])
    p = assignInstrumentPlayers(p, 'one', 'a', [])
    expect(p.maps[0]!.instruments[0]!.playerIds).toEqual([])
    const removed = removeMapInstrument(p, 'one', 'a')
    expect(removed.maps[0]!.instruments.map((item) => item.id)).toEqual(['b'])
    expect(removed.people).toBe(p.people)
    expect(p.maps[0]!.instruments).toHaveLength(2)
    expect(() => removeMapInstrument(p, 'one', 'missing')).toThrow(
      'Referência inexistente',
    )
    expect(() => addMapInstrument(p, 'missing', 'new', 'okedo')).toThrow(
      'Referência inexistente',
    )
  })
})
