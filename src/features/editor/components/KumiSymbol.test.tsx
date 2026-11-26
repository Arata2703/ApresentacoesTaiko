import { render, screen } from '@testing-library/react'
import { it, expect } from 'vitest'
import { presentationFixture } from '../../../test/presentationFixture'
import { addCustomInstrument } from '../../../domain/presentation/customInstruments'
import {
  addMapInstrument,
  updateMapInstrument,
} from '../../../domain/presentation/maps'
import { iconPng } from '../../../test/iconPng'
import { KumiSymbol } from './KumiSymbol'

it.each([1, 2, 4, 5])(
  'representa Kumi com %s componentes em miniatura ou símbolo padrão',
  (count) => {
    let p = addCustomInstrument(presentationFixture(), {
      id: 'custom',
      name: 'Próprio',
      kind: 'okedo',
      png: iconPng,
    })
    for (let i = 0; i < count; i++) {
      p = addMapInstrument(
        p,
        'a',
        'i' + i,
        'okedo',
        i === 0 ? 'custom' : undefined,
      )
      p = updateMapInstrument(p, 'a', 'i' + i, { rotation: i * 30 })
    }
    const map = p.maps[0]!,
      kumi = {
        id: 'k',
        name: 'Kumi',
        playerIds: [],
        instrumentIds: Array.from({ length: count }, (_, i) => 'i' + i),
      }
    render(<KumiSymbol kumi={kumi} map={map} presentation={p} />)
    if (count > 4) {
      expect(
        screen.getByRole('img', {
          name: 'Símbolo padrão de Kumi com 5 instrumentos',
        }),
      ).toBeVisible()
    } else {
      const icon = screen.getByRole('img', {
        name: 'Miniatura dos instrumentos do Kumi',
      })
      expect(icon.querySelectorAll('img')).toHaveLength(count)
      expect(icon.querySelector('img')).toHaveAttribute(
        'src',
        `data:image/png;base64,${iconPng}`,
      )
    }
  },
)
