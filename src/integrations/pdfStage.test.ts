import { PDFDocument, StandardFonts } from 'pdf-lib'
import { describe, it, expect, vi } from 'vitest'
import { drawStage } from './pdfStage'
import { presentationFixture } from '../test/presentationFixture'
import { addMapInstrument } from '../domain/presentation/maps'
import { changeKumi, createKumi } from '../domain/presentation/kumi'
describe('Kumi no PDF', () => {
  it.each([200, 600])(
    'desenha todos os componentes e somente os tocadores do conjunto (largura %s)',
    async (width) => {
      const doc = await PDFDocument.create(),
        font = await doc.embedFont(StandardFonts.Helvetica),
        page = doc.addPage()
      let p = createKumi(
        addMapInstrument(presentationFixture(), 'a', 'shime', 'shime'),
        'a',
        'k',
        ['drum', 'shime'],
      )
      p = changeKumi(p, 'a', 'k', { name: 'Dupla' })
      const drawText = vi.spyOn(page, 'drawText')
      drawStage(
        page,
        [font, font, font, font],
        p.maps[0]!,
        { ...p, images: new Map() },
        { x: 0, y: 0, width, height: 300 },
        'Sem mapa',
      )
      const labels = drawText.mock.calls.map((call) => call[0])
      expect(labels).not.toContain('Dupla')
      expect(labels.filter((text) => text === 'Ana/João')).toHaveLength(1)
      expect(labels).not.toContain('Okedo')
      expect(labels).not.toContain('Shime')
      expect((await doc.save()).length).toBeGreaterThan(1000)
    },
  )
})
