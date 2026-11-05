import type { Presentation } from '../domain/presentation/model'
import { importPresentation, serializePresentation } from './presentationFile'

export const presentationCacheKey = 'taiko-editor-draft-v1'
export type CachedPresentation = {
  presentation: Presentation
  mapId: string | null
} | null
export function readPresentationCache(): {
  data: CachedPresentation
  error: string
} {
  try {
    const source = localStorage.getItem(presentationCacheKey)
    if (source === null) return { data: null, error: '' }
    const value: unknown = JSON.parse(source)
    if (
      !value ||
      typeof value !== 'object' ||
      !('file' in value) ||
      typeof value.file !== 'string'
    )
      throw new Error()
    const result = importPresentation(value.file)
    if (result.status !== 'valid') throw new Error()
    const mapId =
      'mapId' in value && typeof value.mapId === 'string' ? value.mapId : null
    return { data: { presentation: result.presentation, mapId }, error: '' }
  } catch {
    return {
      data: null,
      error:
        'Não foi possível restaurar a cópia local. Ela foi preservada. Abra um arquivo editável ou substitua a cópia local pelos dados atuais.',
    }
  }
}
export function savePresentationCache(
  presentation: Presentation,
  mapId: string | null,
): string {
  try {
    localStorage.setItem(
      presentationCacheKey,
      JSON.stringify({ file: serializePresentation(presentation), mapId }),
    )
    return ''
  } catch {
    return 'Não foi possível salvar no navegador. Baixe a apresentação editável antes de atualizar ou sair.'
  }
}
