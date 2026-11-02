import type { Presentation } from './model'
import { assertNewId, byId, peopleReferences } from './rules'

function neighbors(p: Presentation, id: string) {
  const index = p.sequence.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Transição ausente da sequência.')
  return {
    previousMapId:
      p.sequence
        .slice(0, index)
        .filter((item) => item.kind === 'map')
        .at(-1)?.id ?? null,
    nextMapId:
      p.sequence.slice(index + 1).find((item) => item.kind === 'map')?.id ??
      null,
  }
}

export function transitionMaps(p: Presentation, id: string) {
  byId(p.transitions, id)
  const context = neighbors(p, id)
  return {
    previous:
      context.previousMapId === null
        ? null
        : byId(p.maps, context.previousMapId),
    next: context.nextMapId === null ? null : byId(p.maps, context.nextMapId),
  }
}

/** Derived neighbors avoid dangling map references; text survives sequence edits. */
export function reconcileSequence(
  previous: Presentation,
  next: Presentation,
): Presentation {
  return {
    ...next,
    transitions: next.transitions.map((transition) => {
      const before = neighbors(previous, transition.id)
      const after = neighbors(next, transition.id)
      const changed =
        before.previousMapId !== after.previousMapId ||
        before.nextMapId !== after.nextMapId
      return changed ? { ...transition, needsReview: true } : transition
    }),
  }
}

export function reorderSequence(
  p: Presentation,
  ids: readonly string[],
): Presentation {
  if (ids.length !== p.sequence.length || new Set(ids).size !== ids.length)
    throw new Error('Informe todos os itens da sequência exatamente uma vez.')
  const sequence = ids.map((id) => byId(p.sequence, id))
  return reconcileSequence(p, { ...p, sequence })
}

function transitionText(tsunagiName: string, instructions: string) {
  const name = tsunagiName.trim()
  if (name.length > 80)
    throw new Error('O nome do tsunagi deve ter até 80 caracteres.')
  return { tsunagiName: name, instructions }
}

export function addTransition(
  p: Presentation,
  id: string,
  index: number,
  tsunagiName: string,
  instructions: string,
): Presentation {
  assertNewId(p, id)
  if (!Number.isInteger(index) || index < 0 || index > p.sequence.length)
    throw new Error('Posição inválida na sequência.')
  return {
    ...p,
    transitions: [
      ...p.transitions,
      {
        id,
        ...transitionText(tsunagiName, instructions),
        participantIds: [],
        needsReview: false,
      },
    ],
    sequence: [
      ...p.sequence.slice(0, index),
      { kind: 'transition', id },
      ...p.sequence.slice(index),
    ],
  }
}

export function updateTransition(
  p: Presentation,
  id: string,
  tsunagiName: string,
  instructions: string,
): Presentation {
  byId(p.transitions, id)
  const text = transitionText(tsunagiName, instructions)
  return {
    ...p,
    transitions: p.transitions.map((item) =>
      item.id === id ? { ...item, ...text } : item,
    ),
  }
}

export function assignTransitionParticipants(
  p: Presentation,
  id: string,
  personIds: readonly string[],
): Presentation {
  byId(p.transitions, id)
  const participantIds = peopleReferences(p, personIds)
  return {
    ...p,
    transitions: p.transitions.map((item) =>
      item.id === id ? { ...item, participantIds } : item,
    ),
  }
}

export function reviewTransition(p: Presentation, id: string): Presentation {
  byId(p.transitions, id)
  return {
    ...p,
    transitions: p.transitions.map((item) =>
      item.id === id ? { ...item, needsReview: false } : item,
    ),
  }
}

export function removeTransition(p: Presentation, id: string): Presentation {
  byId(p.transitions, id)
  return {
    ...p,
    transitions: p.transitions.filter((item) => item.id !== id),
    sequence: p.sequence.filter((item) => item.id !== id),
  }
}
