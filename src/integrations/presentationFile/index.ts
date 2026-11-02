import type { Presentation } from '../../domain/presentation/model'
import { validateStructure, record } from './validation'
import { validateReferences } from './references'
import { migrateMap } from './legacy'

export const presentationFormat = 'taiko-presentation'
export const presentationVersion = 1
export const maxProjectBytes = 5_000_000
export type ImportResult =
  | {
      status: 'valid'
      presentation: Presentation
      migrated: boolean
      warnings: readonly string[]
    }
  | { status: 'unsupported-version'; message: string }
  | {
      status: 'error'
      code: 'too-large' | 'invalid-json' | 'invalid-data' | 'unknown-format'
      message: string
    }

function validate(value: unknown): Presentation {
  const p = validateStructure(value)
  validateReferences(p)
  return p
}

class ProjectSizeError extends Error {}

function checkSize(source: string) {
  if (new TextEncoder().encode(source).byteLength > maxProjectBytes)
    throw new ProjectSizeError('O arquivo ultrapassa o limite de 5 MB.')
}

function encode(data: Presentation): string {
  const source = JSON.stringify(
    {
      format: presentationFormat,
      version: presentationVersion,
      presentation: data,
    },
    null,
    2,
  )
  checkSize(source)
  return source
}

export function serializePresentation(presentation: Presentation): string {
  return encode(validate(presentation))
}

/** Produces a candidate only. Applying it to the open editor is a separate UI action. */
export function importPresentation(source: string): ImportResult {
  try {
    checkSize(source)
  } catch {
    return {
      status: 'error',
      code: 'too-large',
      message: 'O arquivo ultrapassa o limite de 5 MB.',
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    return {
      status: 'error',
      code: 'invalid-json',
      message: 'O arquivo não contém um JSON válido.',
    }
  }
  try {
    const envelope = record(parsed)
    if (
      envelope.format !== presentationFormat &&
      envelope.format !== 'taiko-map'
    )
      return {
        status: 'error',
        code: 'unknown-format',
        message: 'Formato de arquivo não reconhecido.',
      }
    if (!Number.isInteger(envelope.version) || (envelope.version as number) < 1)
      throw new Error('Versão ausente ou inválida.')
    const supportedVersion =
      envelope.format === presentationFormat ? presentationVersion : 1
    if (envelope.version !== supportedVersion)
      return {
        status: 'unsupported-version',
        message:
          'Esta versão do arquivo ainda não é suportada. Abra-o em uma versão compatível do aplicativo.',
      }
    const migrated = envelope.format === 'taiko-map'
    const presentation = validate(
      migrated ? migrateMap(source) : envelope.presentation,
    )
    // An accepted compact file must also fit after canonical re-export.
    encode(presentation)
    return {
      status: 'valid',
      presentation,
      migrated,
      warnings: migrated
        ? [
            'Mapa M02 convertido. Revise a lista de integrantes e os tocadores: cada rótulo de tocador virou uma identidade independente, sem unir homônimos. IDs novos foram atribuídos e as bases padrão foram aplicadas.',
          ]
        : [],
    }
  } catch (error) {
    return {
      status: 'error',
      code: error instanceof ProjectSizeError ? 'too-large' : 'invalid-data',
      message: `Arquivo inválido: ${(error as Error).message}`,
    }
  }
}
