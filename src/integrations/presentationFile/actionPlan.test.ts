import { describe, expect, it } from 'vitest'
import { importPresentation, serializePresentation } from './index'
import { presentationFixture } from '../../test/presentationFixture'

describe('arquivo editável com etapas de transição', () => {
  it.each([true, false])(
    'recupera textos do modo experimental %s na caixa única sem numeração',
    (enabled) => {
      const p = presentationFixture()
      const next = {
        ...p,
        transitions: p.transitions.map((t, i) =>
          i === 0
            ? {
                ...t,
                actionPlan: {
                  enabled,
                  steps: [['**Mover**', 'Retirar'], ['Aguardar']],
                },
              }
            : t,
        ),
      }
      const result = importPresentation(serializePresentation(next))
      expect(result.status).toBe('valid')
      if (result.status === 'valid') {
        expect(result.presentation.transitions[0]!.instructions).toBe(
          [
            p.transitions[0]!.instructions,
            '**Mover**',
            'Retirar',
            'Aguardar',
          ].join('\n'),
        )
        expect(result.presentation.transitions[0]).not.toHaveProperty(
          'actionPlan',
        )
        expect(
          importPresentation(serializePresentation(result.presentation)),
        ).toMatchObject({ status: 'valid', presentation: result.presentation })
      }
    },
  )
  it.each([
    null,
    { enabled: 'sim', steps: [] },
    { enabled: true, steps: {} },
    { enabled: true, steps: [[]] },
    { enabled: false, steps: [[1]] },
  ])('rejeita plano malformado %j', (actionPlan) => {
    const envelope = JSON.parse(serializePresentation(presentationFixture()))
    envelope.presentation.transitions[0].actionPlan = actionPlan
    expect(importPresentation(JSON.stringify(envelope))).toMatchObject({
      status: 'error',
      code: 'invalid-data',
    })
  })
  it('mantém HTML identificado ao salvar e reabrir e rejeita formatos desconhecidos', () => {
    const p = presentationFixture()
    const next = {
      ...p,
      transitions: p.transitions.map((t) => ({
        ...t,
        instructions: '<p><strong>Mover</strong> <em>agora</em></p>',
        instructionsFormat: 'html' as const,
      })),
    }
    expect(importPresentation(serializePresentation(next))).toMatchObject({
      status: 'valid',
      presentation: next,
    })
    const envelope = JSON.parse(serializePresentation(next))
    envelope.presentation.transitions[0].instructionsFormat = 'outro'
    expect(importPresentation(JSON.stringify(envelope))).toMatchObject({
      status: 'error',
      code: 'invalid-data',
    })
  })
})
