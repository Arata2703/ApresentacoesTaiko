import { describe, it, expect } from 'vitest'
import { presentationFixture } from '../../test/presentationFixture'
import { createKumi } from '../../domain/presentation/kumi'
import { addMapInstrument } from '../../domain/presentation/maps'
import { importPresentation, serializePresentation } from './index'

function fixture() {
  return createKumi(
    addMapInstrument(presentationFixture(), 'a', 's', 'shime'),
    'a',
    'k',
    ['drum', 's'],
  )
}
describe('arquivo com Kumi', () => {
  it('salva na versão 3 e reabre sem perder composição, posições e tocadores', () => {
    const p = fixture(),
      source = serializePresentation(p)
    expect(JSON.parse(source).version).toBe(3)
    expect(importPresentation(source)).toMatchObject({
      status: 'valid',
      presentation: p,
    })
  })
  it.each([
    'vazio',
    'ausente',
    'repetido',
    'tocador',
    'identidade',
    'pessoa',
    'nome',
    'lista',
  ])('rejeita grupo inválido: %s, preservando o arquivo original', (kind) => {
    const source = JSON.parse(serializePresentation(fixture())),
      map = source.presentation.maps[0],
      group = map.kumis[0]
    if (kind === 'vazio') group.instrumentIds = []
    if (kind === 'ausente') group.instrumentIds = ['none']
    if (kind === 'repetido') map.kumis.push({ ...group, id: 'another' })
    if (kind === 'tocador') map.instruments[0].playerIds = []
    if (kind === 'identidade') group.id = 'ana'
    if (kind === 'pessoa') {
      group.playerIds = ['absent']
      map.instruments.forEach(
        (i: { playerIds: string[] }) => (i.playerIds = ['absent']),
      )
    }
    if (kind === 'nome') group.name = 'x'.repeat(81)
    if (kind === 'lista') group.instrumentIds = ['drum', 'drum']
    expect(importPresentation(JSON.stringify(source)).status).toBe('error')
  })
})
