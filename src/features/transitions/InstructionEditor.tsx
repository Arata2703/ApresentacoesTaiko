import { useEffect, useId, useRef, useState } from 'react'
import { instructionHtml, sanitizeInstructions } from './instructionContent'
import styles from './instructionEditor.module.css'

const tools = [
  ['bold', 'Negrito', 'N', 'Ctrl/Cmd + B'],
  ['italic', 'Itálico', 'I', 'Ctrl/Cmd + I'],
  [
    'insertUnorderedList',
    'Lista com marcadores',
    '• Lista',
    'Lista com marcadores',
  ],
  ['insertOrderedList', 'Lista numerada', '1. Lista', 'Lista numerada'],
] as const

export function InstructionEditor({
  value,
  format,
  onChange,
}: {
  value: string
  format?: 'html'
  onChange: (value: string) => void
}) {
  const id = useId()
  const field = useRef<HTMLDivElement>(null)
  const saved = useRef<Range | null>(null)
  const emitted = useRef<string | null>(null)
  const [active, setActive] = useState<string[]>([])
  function remember() {
    const selection = window.getSelection()
    if (
      selection?.rangeCount &&
      field.current!.contains(selection.anchorNode) &&
      field.current!.contains(selection.focusNode)
    ) {
      saved.current = selection.getRangeAt(0).cloneRange()
      setActive(
        tools
          .filter(([command]) => document.queryCommandState?.(command))
          .map(([command]) => command),
      )
    }
  }
  useEffect(() => {
    if (value !== emitted.current) {
      field.current!.innerHTML = instructionHtml(value, format)
      saved.current = null
    }
  }, [value, format])
  useEffect(() => {
    document.addEventListener('selectionchange', remember)
    return () => document.removeEventListener('selectionchange', remember)
  }, [])
  function publish() {
    const html = sanitizeInstructions(field.current!.innerHTML)
    emitted.current = html
    onChange(html)
    remember()
  }
  function command(name: string, content?: string) {
    const selection = window.getSelection()!
    const inside =
      field.current!.contains(selection.anchorNode) &&
      field.current!.contains(selection.focusNode)
    const range = inside ? selection.getRangeAt(0).cloneRange() : saved.current
    const needsFocus = document.activeElement !== field.current
    if (needsFocus) field.current!.focus()
    if (
      (!inside || needsFocus) &&
      range &&
      field.current!.contains(range.commonAncestorContainer)
    ) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    document.execCommand(name, false, content)
    publish()
  }
  return (
    <div className={styles.editor}>
      <div id={id} className={styles.label}>
        Instruções da transição
      </div>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Ferramentas de texto"
      >
        {tools.map(([name, label, text, hint]) => (
          <button
            key={name}
            type="button"
            aria-label={label}
            title={hint}
            aria-pressed={active.includes(name)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(name)}
          >
            {text}
          </button>
        ))}
      </div>
      <div
        ref={field}
        role="textbox"
        aria-labelledby={id}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        className={styles.input}
        data-placeholder="Descreva a movimentação dos instrumentos e integrantes…"
        onInput={publish}
        onKeyUp={remember}
        onMouseUp={remember}
        onKeyDown={(event) => {
          if (
            (event.ctrlKey || event.metaKey) &&
            !event.altKey &&
            ['b', 'i'].includes(event.key.toLowerCase())
          ) {
            event.preventDefault()
            event.stopPropagation()
            command(event.key.toLowerCase() === 'i' ? 'italic' : 'bold')
          }
        }}
        onPaste={(event) => {
          event.preventDefault()
          const html = event.clipboardData.getData('text/html')
          if (html) command('insertHTML', sanitizeInstructions(html))
          else command('insertText', event.clipboardData.getData('text/plain'))
        }}
        onDrop={(event) => {
          event.preventDefault()
        }}
      />
    </div>
  )
}
