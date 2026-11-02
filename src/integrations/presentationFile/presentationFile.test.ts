import { describe, expect, it } from 'vitest'
import example from '../../../examples/presentation-v1.json'
import type { Presentation } from '../../domain/presentation/model'
import { createPresentation } from '../../domain/presentation/presentation'
import { transitionMaps } from '../../domain/presentation/sequence'
import { presentationFixture } from '../../test/presentationFixture'
import { freeze } from '../../test/freeze'
import { serializeMap } from '../mapFile'
import {
  importPresentation,
  maxProjectBytes,
  serializePresentation,
} from './index'

function changed(path: string, value: unknown) {
  const data: Record<string, unknown> = JSON.parse(
    serializePresentation(presentationFixture()),
  )
  const parts = path.split('.')
  let target = data
  for (const key of parts.slice(0, -1))
    target = target[key] as Record<string, unknown>
  target[parts.at(-1)!] = value
  return JSON.stringify(data)
}

describe('contrato versionado da apresentação', () => {
  it('recusa arquivo compacto que ultrapassaria o limite ao ser reexportado', () => {
    const envelope = structuredClone(example)
    envelope.presentation.transitions[0]!.instructions = ''
    const baseSize = new TextEncoder().encode(
      JSON.stringify(envelope),
    ).byteLength
    envelope.presentation.transitions[0]!.instructions = 'a'.repeat(
      maxProjectBytes - baseSize,
    )
    const source = JSON.stringify(envelope)
    expect(new TextEncoder().encode(source).byteLength).toBe(maxProjectBytes)
    expect(importPresentation(source)).toMatchObject({
      status: 'error',
      code: 'too-large',
    })
  })
  it('mantém o arquivo de exemplo versionado válido e editável pelo domínio', () => {
    const result = importPresentation(JSON.stringify(example))
    expect(result.status).toBe('valid')
    if (result.status !== 'valid') throw new Error('Exemplo deveria ser válido')
    expect(transitionMaps(result.presentation, 'middle').previous!.id).toBe('b')
    expect(
      importPresentation(serializePresentation(result.presentation)),
    ).toEqual(result)
  })
  it('preserva todo o estado no ciclo completo, sem compartilhar objetos com o original', () => {
    const p = freeze(presentationFixture())
    const source = serializePresentation(p)
    expect(JSON.parse(source)).toMatchObject({
      format: 'taiko-presentation',
      version: 1,
    })
    const result = importPresentation(source)
    expect(result.status).toBe('valid')
    if (result.status !== 'valid')
      throw new Error('Importação deveria ser válida')
    expect(result.presentation).toEqual(p)
    expect(result.presentation).not.toBe(p)
    expect(result.presentation.maps[0]).not.toBe(p.maps[0])
    expect(result.migrated).toBe(false)
    expect(result.warnings).toEqual([])
    expect(transitionMaps(result.presentation, 'middle').previous!.id).toBe('b')
    expect(serializePresentation(result.presentation)).toBe(source)
  })
  it('aceita apresentação vazia e coordenadas nas bordas sem arredondar ou corrigir', () => {
    const empty = createPresentation('show', 'Show')
    expect(importPresentation(serializePresentation(empty))).toMatchObject({
      status: 'valid',
      presentation: empty,
    })
    const result = importPresentation(
      changed('presentation.maps.0.instruments.0.position', { x: 0, y: 8 }),
    )
    expect(result.status).toBe('valid')
    const edge = importPresentation(
      changed('presentation.maps.0.instruments.0.position', { x: 12, y: 0 }),
    )
    expect(edge.status).toBe('valid')
  })
  it('exporta somente dados conhecidos e ignora objetos da interface', () => {
    const p = {
      ...presentationFixture(),
      selectedId: 'drum',
      canvas: { arbitrary: true },
    }
    const encoded = JSON.parse(serializePresentation(p))
    expect(encoded.presentation.selectedId).toBeUndefined()
    expect(encoded.presentation.canvas).toBeUndefined()
    expect(
      importPresentation(changed('presentation.extra', { data: true })).status,
    ).toBe('valid')
  })
  it.each(['', '{', 'texto', '{"format":'])(
    'identifica JSON inválido: %j',
    (source) => {
      expect(importPresentation(source)).toMatchObject({
        status: 'error',
        code: 'invalid-json',
      })
    },
  )
  it.each([null, [], 4, 'texto'])('recusa raiz sem objeto: %j', (value) => {
    expect(importPresentation(JSON.stringify(value))).toMatchObject({
      status: 'error',
      code: 'invalid-data',
    })
  })
  it.each([{}, { format: 'outro', version: 1 }])(
    'distingue formato desconhecido %j',
    (data) => {
      expect(importPresentation(JSON.stringify(data))).toMatchObject({
        status: 'error',
        code: 'unknown-format',
      })
    },
  )
  it.each([0, -1, 1.5, null, '1'])('recusa versão malformada %j', (version) => {
    expect(importPresentation(changed('version', version))).toMatchObject({
      status: 'error',
      code: 'invalid-data',
    })
  })
  it.each(['taiko-presentation', 'taiko-map'])(
    'não tenta converter versão futura de %s',
    (format) => {
      expect(
        importPresentation(JSON.stringify({ format, version: 2 })),
      ).toMatchObject({ status: 'unsupported-version' })
    },
  )
  it.each([
    ['presentation', null],
    ['presentation.id', ''],
    ['presentation.id', ' show'],
    ['presentation.title', 7],
    ['presentation.title', ''],
    ['presentation.title', 'a'.repeat(81)],
    ['presentation.title', ' Show '],
    ['presentation.people', {}],
    ['presentation.people.0.name', null],
    ['presentation.rosterIds', ['ana', 'ana']],
    ['presentation.rosterIds', [1]],
    ['presentation.maps.0.stage', null],
    ['presentation.maps.0.stage.width', 0],
    ['presentation.maps.0.stage.depth', -1],
    ['presentation.maps.0.stage.width', '10'],
    ['presentation.maps.0.instruments.0.kind', 'desconhecido'],
    ['presentation.maps.0.instruments.0.baseId', 'missing'],
    ['presentation.maps.0.instruments.0.baseId', 'shime-suwaridai'],
    ['presentation.maps.0.instruments.0.playerIds', null],
    ['presentation.maps.0.instruments.0.position.x', -1],
    ['presentation.maps.0.instruments.0.position.x', 13],
    ['presentation.maps.0.instruments.0.position.y', -1],
    ['presentation.maps.0.instruments.0.position.y', 9],
    ['presentation.maps.0.instruments.0.rotation', -1],
    ['presentation.maps.0.instruments.0.rotation', 360],
    ['presentation.transitions.0.needsReview', 1],
    ['presentation.transitions.0.tsunagiName', 'a'.repeat(81)],
    ['presentation.transitions.0.instructions', {}],
    ['presentation.sequence.0.kind', 'unknown'],
    ['presentation.materials.0.quantity', 0],
    ['presentation.materials.0.quantity', 1.5],
  ])('rejeita campo malformado %s', (path, value) => {
    const result = importPresentation(changed(path as string, value))
    expect(result).toMatchObject({ status: 'error', code: 'invalid-data' })
  })
  it.each([
    ['presentation.people.0.id', 'show'],
    ['presentation.maps.1.id', 'a'],
    ['presentation.maps.1.instruments.0.id', 'drum'],
    ['presentation.materials.0.id', 'entry'],
    ['presentation.rosterIds', ['missing']],
    ['presentation.maps.0.instruments.0.playerIds', ['missing']],
    ['presentation.transitions.0.participantIds', ['missing']],
    ['presentation.sequence.0.id', 'missing'],
    ['presentation.sequence.0', { kind: 'map', id: 'entry' }],
    ['presentation.sequence.4', { kind: 'map', id: 'a' }],
    ['presentation.sequence', []],
  ])('recusa referências inválidas %s', (path, value) => {
    expect(importPresentation(changed(path as string, value))).toMatchObject({
      status: 'error',
      code: 'invalid-data',
    })
  })
  it('limita bytes UTF-8 na importação e exportação, com o mesmo limite', () => {
    const tooLarge = 'あ'.repeat(Math.floor(maxProjectBytes / 3) + 1)
    expect(tooLarge.length).toBeLessThan(maxProjectBytes)
    expect(importPresentation(tooLarge)).toMatchObject({
      status: 'error',
      code: 'too-large',
    })
    const p = presentationFixture()
    const oversized: Presentation = {
      ...p,
      transitions: [
        { ...p.transitions[0]!, instructions: tooLarge },
        ...p.transitions.slice(1),
      ],
    }
    expect(() => serializePresentation(oversized)).toThrow('5 MB')
  })
  it('recusa estados inválidos na exportação em vez de gerar backup irrecuperável', () => {
    const p = presentationFixture()
    expect(() =>
      serializePresentation({ ...p, rosterIds: ['missing'] }),
    ).toThrow('pessoa inexistente')
    expect(() =>
      serializePresentation({
        ...p,
        materials: [{ id: 'bad', name: 'Banner', quantity: Infinity }],
      }),
    ).toThrow('finito')
  })
  it('não altera o projeto aberto ao validar um candidato, válido ou inválido', () => {
    const current = freeze(presentationFixture())
    const before = serializePresentation(current)
    const invalid = importPresentation(
      changed('presentation.rosterIds', ['missing']),
    )
    const valid = importPresentation(before)
    expect(invalid.status).toBe('error')
    expect(valid.status).toBe('valid')
    expect(serializePresentation(current)).toBe(before)
    expect(current.title).toBe('Mostra Japão')
  })
})

describe('migração do mapa M02', () => {
  it('preserva posições/rotação, aplica bases e não une homônimos automaticamente', () => {
    const source = serializeMap({
      title: 'Mostra Japão',
      song: 'Ibuki',
      instruments: [
        { id: 'a', kind: 'okedo', player: 'Ana', x: 2.5, y: 3, rotation: 90 },
        { id: 'b', kind: 'shime', player: 'Ana', x: 5, y: 2, rotation: 315 },
        { id: 'c', kind: 'fue', player: '', x: 8, y: 4, rotation: 0 },
      ],
    })
    const result = importPresentation(source)
    expect(result.status).toBe('valid')
    if (result.status !== 'valid') throw new Error('Migração deveria funcionar')
    expect(result.migrated).toBe(true)
    expect(result.warnings).toHaveLength(1)
    const p = result.presentation
    expect(p.title).toBe('Mostra Japão')
    expect(p.people.map((person) => person.name)).toEqual(['Ana', 'Ana'])
    expect(p.rosterIds).toEqual([])
    expect(p.maps[0]!.instruments[0]).toMatchObject({
      baseId: 'okedo-suwaridai',
      position: { x: 2.5, y: 3 },
      rotation: 90,
      playerIds: [p.people[0]!.id],
    })
    expect(p.maps[0]!.instruments[1]!.playerIds).toEqual([p.people[1]!.id])
    expect(p.maps[0]!.instruments[2]).toMatchObject({
      baseId: null,
      playerIds: [],
    })
    expect(importPresentation(serializePresentation(p))).toMatchObject({
      status: 'valid',
      presentation: p,
      migrated: false,
    })
    expect(importPresentation(source)).toEqual(result)
  })
  it('usa títulos alternativos para mapa vazio e ignora nome de tocador só com espaços', () => {
    const result = importPresentation(
      serializeMap({
        title: '',
        song: ' ',
        instruments: [
          { id: 'a', kind: 'okedo', player: ' ', x: 2, y: 2, rotation: 0 },
        ],
      }),
    )
    expect(result).toMatchObject({
      status: 'valid',
      presentation: {
        title: 'Apresentação sem título',
        people: [],
        maps: [{ title: 'Música sem título', stage: { width: 10, depth: 6 } }],
      },
    })
    expect(
      importPresentation(serializeMap({ title: '', song: '', instruments: [] }))
        .status,
    ).toBe('valid')
  })
  it('não converte mapa legado inválido', () => {
    expect(
      importPresentation(
        JSON.stringify({ format: 'taiko-map', version: 1, title: 'Mapa' }),
      ),
    ).toMatchObject({ status: 'error', code: 'invalid-data' })
  })
})
