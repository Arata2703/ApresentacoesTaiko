const maxUploadBytes = 1_000_000
const iconSide = 128

export async function readInstrumentIcon(file: File): Promise<string> {
  const extension = file.name.split('.').at(-1)?.toLowerCase()
  if (extension !== 'svg' && extension !== 'png')
    throw new Error('Escolha um arquivo SVG ou PNG.')
  if (file.size > maxUploadBytes)
    throw new Error('Escolha uma imagem de até 1 MB.')
  // Decode as an image, never as markup in the page. Keep only its pixels.
  const url = URL.createObjectURL(
    new Blob([file], {
      type: extension === 'svg' ? 'image/svg+xml' : 'image/png',
    }),
  )
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = iconSide
    const context = canvas.getContext('2d')
    if (!context || !image.naturalWidth || !image.naturalHeight)
      throw new Error('Imagem sem dimensões.')
    const scale = iconSide / Math.max(image.naturalWidth, image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    context.drawImage(
      image,
      (iconSide - width) / 2,
      (iconSide - height) / 2,
      width,
      height,
    )
    return canvas.toDataURL('image/png').slice('data:image/png;base64,'.length)
  } catch {
    throw new Error(
      'Não foi possível abrir esta imagem. Confira o arquivo e tente novamente.',
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
