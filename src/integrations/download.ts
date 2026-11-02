export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Let the browser start reading the URL before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
