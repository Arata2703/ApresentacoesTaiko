import { createPresentation } from '../domain/presentation/presentation'
import { addPerson } from '../domain/presentation/people'
import {
  addMap,
  addMapInstrument,
  assignInstrumentPlayers,
  setInstrumentBase,
  updateMapInstrument,
} from '../domain/presentation/maps'
import {
  addTransition,
  assignTransitionParticipants,
  reorderSequence,
} from '../domain/presentation/sequence'
import { addMaterial } from '../domain/presentation/materials'

export function presentationFixture() {
  let p = createPresentation('show', 'Mostra Japão')
  p = addPerson(p, 'ana', 'Ana')
  p = addPerson(p, 'joao', 'João', false)
  p = addMap(p, 'a', 'Ibuki', { width: 12, depth: 8 })
  p = addMap(p, 'b', 'Yatai', { width: 10, depth: 6 })
  p = addMapInstrument(p, 'a', 'drum', 'okedo')
  p = setInstrumentBase(p, 'a', 'drum', 'okedo-eitetsu')
  p = assignInstrumentPlayers(p, 'a', 'drum', ['ana', 'joao'])
  p = updateMapInstrument(p, 'a', 'drum', {
    position: { x: 3.25, y: 1.5 },
    rotation: 315,
  })
  p = addMapInstrument(p, 'b', 'flute', 'fue')
  p = addTransition(p, 'entry', 0, '', 'Entrada')
  p = addTransition(
    p,
    'middle',
    2,
    'Ponte',
    'Mover okedo.\nLevar bases para o fundo.',
  )
  p = addTransition(p, 'exit', p.sequence.length, '', 'Saída')
  p = assignTransitionParticipants(p, 'middle', ['joao'])
  p = reorderSequence(p, ['entry', 'b', 'middle', 'a', 'exit'])
  p = addMaterial(p, 'banner', 'Banner', 1)
  return p
}
