import fontUrl from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import type { MapDraft } from './mapFile'
import { download } from './download'

export async function exportMap(map: MapDraft) {
  const [response, { createMapPdf }] = await Promise.all([
    fetch(fontUrl),
    import('./mapPdf'),
  ])
  if (!response.ok)
    throw new Error(
      'Não foi possível carregar a fonte do PDF. Tente novamente.',
    )
  const bytes = await createMapPdf(
    map,
    new Uint8Array(await response.arrayBuffer()),
  )
  download(new Blob([bytes], { type: 'application/pdf' }), 'mapa-taiko.pdf')
}
