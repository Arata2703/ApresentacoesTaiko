import { isInstrumentKind } from '../stage'
import type { CustomInstrument, MapInstrument, Presentation } from './model'
import { assertNewId, byId, named } from './rules'

export const maxIconDataLength = 100_000

export function validateIconPng(png: string) {
  if (
    png.length > maxIconDataLength ||
    png.length % 4 !== 0 ||
    // PNG signature and IHDR for the 128 × 128 canvas used by the editor.
    !/^iVBORw0KGgoAAAANSUhEUgAAAIAAAACA[A-Za-z0-9+/]+={0,2}$/.test(png)
  ) {
    throw new Error('Ícone inválido. Envie uma imagem SVG ou PNG menor.')
  }
  return png
}

export function addCustomInstrument(
  presentation: Presentation,
  instrument: CustomInstrument,
): Presentation {
  assertNewId(presentation, instrument.id)
  if (!isInstrumentKind(instrument.kind)) throw new Error('Ícone desconhecido.')
  const name = named(instrument.name)
  const png =
    instrument.png === undefined ? undefined : validateIconPng(instrument.png)
  return {
    ...presentation,
    customInstruments: [
      ...(presentation.customInstruments ?? []),
      {
        id: instrument.id,
        name,
        kind: instrument.kind,
        ...(png === undefined ? {} : { png }),
      },
    ],
  }
}

export function customInstrumentFor(
  presentation: Pick<Presentation, 'customInstruments'>,
  instrument: Pick<MapInstrument, 'customInstrumentId'>,
) {
  return instrument.customInstrumentId === undefined
    ? undefined
    : byId(presentation.customInstruments ?? [], instrument.customInstrumentId)
}

export function instrumentPngUrl(png: string) {
  return `data:image/png;base64,${png}`
}
