import type { PDFFont, PDFPage } from 'pdf-lib'
import { instructionHtml } from '../features/transitions/instructionContent'
import type { TextTransition } from '../domain/presentation/model'
import { pdfTextWidth } from './pdfText'

type Style = 0 | 1 | 2 | 3
export type Fonts = readonly [PDFFont, PDFFont, PDFFont, PDFFont]
type Run = { text: string; style: Style }
type Line = Run[]

const size = 13
const leading = 19
const gap = 4

export function instructionBlocks(transition: TextTransition) {
  const doc = new DOMParser().parseFromString(
    instructionHtml(transition.instructions, transition.instructionsFormat),
    'text/html',
  )
  const blocks: Run[][] = []
  let runs: Run[] = []
  function flush() {
    if (runs.length) blocks.push(runs)
    runs = []
  }
  function visit(node: Node, style: Style) {
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push({ text: node.textContent!.replace(/\s+/g, ' '), style })
      return
    }
    if (!(node instanceof HTMLElement)) return
    const tag = node.tagName
    const block = ['P', 'DIV', 'LI'].includes(tag)
    if (block) flush()
    if (tag === 'LI') {
      const parent = node.parentElement!
      const prefix =
        parent.tagName === 'OL'
          ? `${Array.from(parent.children).indexOf(node) + 1}. `
          : '• '
      runs.push({ text: prefix, style: 1 })
    }
    if (tag === 'BR') runs.push({ text: '\n', style })
    const next = (style |
      (tag === 'STRONG' ? 1 : 0) |
      (tag === 'EM' ? 2 : 0)) as Style
    node.childNodes.forEach((child) => visit(child, next))
    if (block) flush()
  }
  doc.body.childNodes.forEach((node) => visit(node, 0))
  flush()
  return blocks
}

export function paginateInstructions(
  blocks: Run[][],
  width: number,
  height: number,
  measure: (text: string, style: Style) => number,
) {
  const pages: { line: Line; offset: number }[][] = [[]]
  let used = 0
  function newPage() {
    pages.push([])
    used = 0
  }
  for (const block of blocks) {
    const lines: Line[] = [[]]
    let length = 0
    const wrap = () => {
      lines.push([])
      length = 0
    }
    function append(text: string, style: Style) {
      lines.at(-1)!.push({ text, style })
      length += measure(text, style)
    }
    for (const run of block) {
      for (const part of run.text.match(/\n| +|[^ \n]+/g) ?? []) {
        if (part === '\n') {
          wrap()
          continue
        }
        if (part.startsWith(' ')) {
          if (length && length + measure(' ', run.style) <= width)
            append(' ', run.style)
          continue
        }
        if (length && length + measure(part, run.style) > width) wrap()
        if (measure(part, run.style) <= width) append(part, run.style)
        else {
          for (const char of part) {
            if (length + measure(char, run.style) > width) wrap()
            append(char, run.style)
          }
        }
      }
    }
    if (lines.length > 1 && !lines.at(-1)!.length) lines.pop()
    const blockHeight = lines.length * leading
    if (used && blockHeight <= height && used + blockHeight > height) newPage()
    for (const line of lines) {
      if (used + leading > height) newPage()
      pages.at(-1)!.push({ line, offset: used })
      used += leading
    }
    used += gap
  }
  return pages
}

export function instructionPages(
  transition: TextTransition,
  fonts: Fonts,
  width: number,
  height: number,
) {
  return paginateInstructions(
    instructionBlocks(transition),
    width,
    height,
    (text, style) => pdfTextWidth(fonts[style], text, size),
  )
}

export function drawInstructions(
  page: PDFPage,
  lines: ReturnType<typeof instructionPages>[number],
  fonts: Fonts,
  x: number,
  top: number,
) {
  for (const { line, offset } of lines) {
    let cursor = x
    for (const run of line) {
      const font = fonts[run.style]
      page.drawText(run.text, { x: cursor, y: top - size - offset, font, size })
      cursor += font.widthOfTextAtSize(run.text, size)
    }
  }
}
