import fontUrl from '@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url'
import type { ManualMaterial } from '../domain/presentation/model'
import { download } from './download'

export async function exportMaterials(
  title: string,
  materials: readonly ManualMaterial[],
) {
  const [response, { createMaterialsPdf }] = await Promise.all([
    fetch(fontUrl),
    import('./materialsPdf'),
  ])
  if (!response.ok)
    throw new Error(
      'Não foi possível carregar a fonte do PDF. Tente novamente.',
    )
  const pdf = await createMaterialsPdf(
    title,
    materials,
    new Uint8Array(await response.arrayBuffer()),
  )
  download(new Blob([pdf], { type: 'application/pdf' }), 'materiais-taiko.pdf')
}
