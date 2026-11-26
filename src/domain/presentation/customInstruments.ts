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
  return {
    ...presentation,
    customInstruments: [
      ...(presentation.customInstruments ?? []),
      validatedInstrument(instrument),
    ],
  }
}

export function normalizeInstrumentAbbreviation(
  value?: string,
): string | undefined {
  const abbreviation = value?.trim()
  return abbreviation ? named(abbreviation) : undefined
}

function validatedInstrument(instrument: CustomInstrument): CustomInstrument {
  const abbreviation = normalizeInstrumentAbbreviation(instrument.abbreviation)
  if (!isInstrumentKind(instrument.kind)) throw new Error('Ícone desconhecido.')
  return {
    id: instrument.id,
    name: named(instrument.name),
    ...(abbreviation === undefined ? {} : { abbreviation }),
    kind: instrument.kind,
    ...(instrument.png === undefined
      ? {}
      : { png: validateIconPng(instrument.png) }),
  }
}

export function updateCustomInstrument(
  presentation: Presentation,
  id: string,
  input: Omit<CustomInstrument, 'id'>,
): Presentation {
  byId(presentation.customInstruments ?? [], id)
  const instrument = validatedInstrument({ ...input, id })
  return {
    ...presentation,
    customInstruments: presentation.customInstruments!.map((item) =>
      item.id === id ? instrument : item,
    ),
    maps: presentation.maps.map((map) => ({
      ...map,
      instruments: map.instruments.map((item) =>
        item.customInstrumentId === id
          ? { ...item, kind: instrument.kind }
          : item,
      ),
    })),
  }
}

export function customInstrumentUsage(presentation: Presentation, id: string) {
  byId(presentation.customInstruments ?? [], id)
  return presentation.maps.filter((map) =>
    map.instruments.some((item) => item.customInstrumentId === id),
  )
}

export function removeCustomInstrument(
  presentation: Presentation,
  id: string,
): Presentation {
  const maps = customInstrumentUsage(presentation, id)
  if (maps.length) throw new Error('O instrumento ainda está em uso nos mapas.')
  return {
    ...presentation,
    customInstruments: presentation.customInstruments!.filter(
      (item) => item.id !== id,
    ),
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
