import { afterEach, expect, it, vi } from 'vitest'
import { download } from './download'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
it('inicia download com nome e libera a URL após leitura do navegador', () => {
  vi.useFakeTimers()
  const create = vi.fn(() => 'blob:map')
  const revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
  let name = ''
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    name = this.download
    expect(this.href).toBe('blob:map')
  })
  const blob = new Blob(['map'])
  download(blob, 'mapa.json')
  expect(name).toBe('mapa.json')
  expect(create).toHaveBeenCalledWith(blob)
  expect(document.querySelector('a')).toBeNull()
  expect(revoke).not.toHaveBeenCalled()
  vi.runAllTimers()
  expect(revoke).toHaveBeenCalledWith('blob:map')
})
