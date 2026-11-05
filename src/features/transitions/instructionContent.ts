/** Only these text-formatting elements enter the editable surface; attributes are never copied. */
export function sanitizeInstructions(html: string): string {
  const source = new DOMParser().parseFromString(html, 'text/html')
  const output = document.createElement('div')
  function copy(node: Node, parent: HTMLElement) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent!))
      return
    }
    if (!(node instanceof HTMLElement)) return
    const tag = node.tagName.toLowerCase()
    if (
      [
        'script',
        'style',
        'iframe',
        'object',
        'template',
        'svg',
        'math',
      ].includes(tag)
    )
      return
    const normalized = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag
    const next = ['p', 'div', 'br', 'strong', 'em', 'ul', 'ol', 'li'].includes(
      normalized,
    )
      ? document.createElement(normalized)
      : parent
    for (const child of node.childNodes) copy(child, next)
    if (next !== parent) parent.append(next)
  }
  for (const node of source.body.childNodes) copy(node, output)
  return output.textContent?.trim() ? output.innerHTML : ''
}

function escaped(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
function inline(text: string) {
  return escaped(text).replace(
    /\*\*\*([^\n]+?)\*\*\*|\*\*([^\n]+?)\*\*|\*([^\n]+?)\*/g,
    (_, both: string, bold: string, italic: string) =>
      both
        ? `<strong><em>${both}</em></strong>`
        : bold
          ? `<strong>${bold}</strong>`
          : `<em>${italic}</em>`,
  )
}
/** Old plain/Markdown instructions stay readable; new HTML is explicitly identified in the project. */
export function instructionHtml(value: string, format?: 'html'): string {
  if (format === 'html') return sanitizeInstructions(value)
  let html = '',
    list = ''
  for (const line of value.split('\n')) {
    const item = line.match(/^(-|\d+\.)\s+(.*)$/)
    const next = item ? (item[1] === '-' ? 'ul' : 'ol') : ''
    if (list !== next) {
      if (list) html += `</${list}>`
      if (next) html += `<${next}>`
      list = next
    }
    html += item
      ? `<li>${inline(item[2]!)}</li>`
      : `<p>${inline(line) || '<br>'}</p>`
  }
  if (list) html += `</${list}>`
  return html
}
