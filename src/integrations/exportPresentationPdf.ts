import regular from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import bold from '@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url'
import italic from '@fontsource/noto-sans/files/noto-sans-latin-400-italic.woff?url'
import boldItalic from '@fontsource/noto-sans/files/noto-sans-latin-700-italic.woff?url'
import type { Presentation } from '../domain/presentation/model'
import { download } from './download'

async function loadFont(url: string) {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(
      'Não foi possível carregar a fonte do PDF. Tente novamente.',
    )
  return new Uint8Array(await response.arrayBuffer())
}

export async function exportPresentationPdf(presentation: Presentation) {
  const [{ createPresentationPdf }, fonts] = await Promise.all([
    import('./presentationPdf'),
    Promise.all([
      loadFont(regular),
      loadFont(bold),
      loadFont(italic),
      loadFont(boldItalic),
    ]),
  ])
  const bytes = await createPresentationPdf(presentation, fonts)
  download(
    new Blob([bytes], { type: 'application/pdf' }),
    'apresentacao-taiko.pdf',
  )
}
