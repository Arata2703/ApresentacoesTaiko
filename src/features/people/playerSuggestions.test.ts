import { describe, expect, it } from 'vitest'
import { playerSuggestions } from './playerSuggestions'
import { resolvePlayerDraft } from './playerDraft'

const people = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'João' },
  { id: 'c', name: 'Ana' },
]
describe('sugestões e resolução de nomes', () => {
  it('busca sem diferenciar acentos/maiúsculas e distingue homônimos', () => {
    expect(playerSuggestions(people, 'JOA')).toContainEqual({
      id: 'b',
      name: 'João',
      label: 'João · pessoa 2',
    })
    expect(playerSuggestions(people, 'ana')).toEqual([
      { id: 'a', name: 'Ana', label: 'Ana · pessoa 1' },
      { id: 'c', name: 'Ana', label: 'Ana · pessoa 3' },
    ])
  })
  it('limita sugestões e retorna apenas integrantes existentes', () => {
    expect(
      playerSuggestions(
        Array.from({ length: 12 }, (_, index) => ({
          id: `${index}`,
          name: `Pessoa ${index}`,
        })),
        '',
      ),
    ).toHaveLength(8)
    expect(playerSuggestions([], ' Bia ')).toEqual([])
    expect(playerSuggestions([], 'x'.repeat(81))).toEqual([])
    expect(playerSuggestions([], '')).toEqual([])
  })
  it('preserva IDs originais de homônimos e aceita escolha explícita', () => {
    expect(resolvePlayerDraft('Ana/Ana', people, ['a', 'c'], {})).toEqual([
      { id: 'a' },
      { id: 'c' },
    ])
    expect(resolvePlayerDraft('Ana', people, [], { 0: 'c' })).toEqual([
      { id: 'c' },
    ])
    expect(() => resolvePlayerDraft('Ana', people, [], {})).toThrow(
      'mesmo nome',
    )
  })
  it('resolve integrantes existentes, novos nomes e remoção, recusando entradas incompletas', () => {
    expect(resolvePlayerDraft('joao/Bia', people, ['a'], {})).toEqual([
      { id: 'b' },
      { name: 'Bia' },
    ])
    expect(resolvePlayerDraft(' ', people, ['a'], {})).toEqual([])
    expect(() => resolvePlayerDraft('Ana/', people, ['a'], {})).toThrow(
      '1 a 80',
    )
  })
})
