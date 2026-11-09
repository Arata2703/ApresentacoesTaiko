import regular from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import bold from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url'
import italic from '@fontsource/noto-sans/files/noto-sans-latin-400-italic.woff?url'
import boldItalic from '@fontsource/noto-sans/files/noto-sans-latin-700-italic.woff?url'
import type { Presentation } from '../domain/presentation/model'
import { download } from './download'
import { serializePresentation } from './presentationFile'

async function loadFont(url: string) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(
      'Não foi possível carregar a fonte do PDF. Tente novamente.',
    )
  return new Uint8Array(await response.arrayBuffer())
}

export async function exportPresentation(presentation: Presentation) {
  const project = serializePresentation(presentation)
  // Both outputs read the serialized snapshot captured before any asynchronous work.
  const snapshot = JSON.parse(project) as { presentation: Presentation }
  const [{ createPresentationPdf }, { zipSync, strToU8 }, fonts] =
    await Promise.all([
      import('./presentationPdf'),
      import('fflate'),
      Promise.all([
        loadFont(regular),
        loadFont(bold),
        loadFont(italic),
        loadFont(boldItalic),
      ]),
    ])
  const bytes = await createPresentationPdf(snapshot.presentation, fonts)
  const archive = zipSync(
    {
      'apresentacao-taiko.pdf': bytes,
      'apresentacao-taiko.json': strToU8(project),
    },
    { level: 0 },
  )
  download(
    new Blob([new Uint8Array(archive)], { type: 'application/zip' }),
    'apresentacao-taiko.zip',
  )
}
