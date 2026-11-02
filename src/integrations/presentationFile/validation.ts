import type { InstrumentKind } from '../../domain/stage'
import {
  assertCompatibleBase,
  instrumentDefinition,
} from '../../domain/presentation/catalog'
import type {
  BaseId,
  MapInstrument,
  MusicMap,
  Presentation,
  SequenceItem,
  TextTransition,
} from '../../domain/presentation/model'

export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Era esperado um objeto de dados.')
  return value as Record<string, unknown>
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Era esperada uma lista.')
  return value
}

function string(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Era esperado um texto.')
  return value
}

function id(value: unknown): string {
  const result = string(value)
  if (!result || result !== result.trim())
    throw new Error('ID vazio ou com espaços nas extremidades.')
  return result
}

function name(value: unknown, allowEmpty = false): string {
  const result = string(value)
  if (
    (!allowEmpty && !result) ||
    result.length > 80 ||
    result !== result.trim()
  )
    throw new Error(
      'Nome inválido: use até 80 caracteres sem espaços nas extremidades.',
    )
  return result
}

function number(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Era esperado um número finito.')
  return value
}

function references(value: unknown): string[] {
  const ids = array(value).map(id)
  if (new Set(ids).size !== ids.length)
    throw new Error('Referência repetida em uma lista.')
  return ids
}

function instrument(
  value: unknown,
  width: number,
  depth: number,
): MapInstrument {
  const data = record(value)
  const kind = string(data.kind) as InstrumentKind
  instrumentDefinition(kind)
  const baseId = data.baseId === null ? null : (string(data.baseId) as BaseId)
  assertCompatibleBase(kind, baseId)
  const point = record(data.position)
  const x = number(point.x),
    y = number(point.y),
    rotation = number(data.rotation)
  if (
    x < 0 ||
    x > width ||
    y < 0 ||
    y > depth ||
    rotation < 0 ||
    rotation >= 360
  )
    throw new Error(
      'Posição fora do palco ou rotação fora do intervalo [0, 360).',
    )
  return {
    id: id(data.id),
    kind,
    baseId,
    playerIds: references(data.playerIds),
    position: { x, y },
    rotation,
  }
}

function map(value: unknown): MusicMap {
  const data = record(value),
    stage = record(data.stage)
  const width = number(stage.width),
    depth = number(stage.depth)
  if (width <= 0 || depth <= 0)
    throw new Error('As medidas do palco devem ser positivas.')
  return {
    id: id(data.id),
    title: name(data.title),
    stage: { width, depth },
    instruments: array(data.instruments).map((item) =>
      instrument(item, width, depth),
    ),
  }
}

function transition(value: unknown): TextTransition {
  const data = record(value)
  if (typeof data.needsReview !== 'boolean')
    throw new Error('O indicador de revisão deve ser verdadeiro ou falso.')
  return {
    id: id(data.id),
    tsunagiName: name(data.tsunagiName, true),
    instructions: string(data.instructions),
    participantIds: references(data.participantIds),
    needsReview: data.needsReview,
  }
}

function sequenceItem(value: unknown): SequenceItem {
  const data = record(value)
  if (data.kind !== 'map' && data.kind !== 'transition')
    throw new Error('Tipo de item da sequência desconhecido.')
  return { kind: data.kind, id: id(data.id) }
}

/** Construct fresh, whitelisted data; never return objects supplied by the caller. */
export function validateStructure(value: unknown): Presentation {
  const data = record(value)
  return {
    id: id(data.id),
    title: name(data.title),
    people: array(data.people).map((value) => {
      const person = record(value)
      return { id: id(person.id), name: name(person.name) }
    }),
    rosterIds: references(data.rosterIds),
    maps: array(data.maps).map(map),
    transitions: array(data.transitions).map(transition),
    sequence: array(data.sequence).map(sequenceItem),
    materials: array(data.materials).map((value) => {
      const item = record(value),
        quantity = number(item.quantity)
      if (!Number.isInteger(quantity) || quantity <= 0)
        throw new Error('Quantidade de material deve ser um inteiro positivo.')
      return { id: id(item.id), name: name(item.name), quantity }
    }),
  }
}
