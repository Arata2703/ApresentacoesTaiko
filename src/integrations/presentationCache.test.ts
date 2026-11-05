import { describe, expect, it, vi } from 'vitest'
import { presentationFixture } from '../test/presentationFixture'
import {
  presentationCacheKey,
  readPresentationCache,
  savePresentationCache,
} from './presentationCache'
import { serializePresentation } from './presentationFile'

describe('cópia local da apresentação', () => {
  it('grava e restaura o documento completo e o mapa aberto', () => {
    expect(readPresentationCache()).toEqual({ data: null, error: '' })
    const p = presentationFixture()
    expect(savePresentationCache(p, 'a')).toBe('')
    expect(readPresentationCache()).toEqual({
      data: { presentation: p, mapId: 'a' },
      error: '',
    })
    localStorage.setItem(
      presentationCacheKey,
      JSON.stringify({ file: serializePresentation(p), mapId: 42 }),
    )
    expect(readPresentationCache().data?.mapId).toBeNull()
  })
  it('preserva fontes inválidas e trata armazenamento indisponível ou cheio', () => {
    for (const source of [
      'invalid',
      'null',
      '{}',
      '{"file":42}',
      '{"file":"{}"}',
    ]) {
      localStorage.setItem(presentationCacheKey, source)
      expect(readPresentationCache().error).toContain('restaurar')
      expect(localStorage.getItem(presentationCacheKey)).toBe(source)
    }
    const read = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked')
      })
    expect(readPresentationCache().error).toContain('preservada')
    read.mockRestore()
    const write = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota')
      })
    expect(savePresentationCache(presentationFixture(), null)).toContain(
      'Não foi possível salvar',
    )
    write.mockRestore()
  })
})
