import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { NumberColumn, TextColumn } from './tableColumns'
import styles from './dataTable.module.css'

export function EditableCell<Row>({
  column,
  row,
  index,
}: {
  column: TextColumn<Row> | NumberColumn<Row>
  row: Row
  index: number
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)
  const errorId = useId()
  const valueElement = useRef<HTMLSpanElement>(null)
  const restoreFocus = useRef(false)
  const value = String(column.value(row))
  const editing = draft !== null
  const current = draft ?? value
  const error = column.validate(current, row)
  const showError = editing && error && (attempted || column.input === 'number')
  const label = column.label(row, index)
  useLayoutEffect(() => {
    if (!editing && restoreFocus.current) {
      restoreFocus.current = false
      valueElement.current?.focus()
    }
  }, [editing])

  function open() {
    if (!editing) {
      setDraft(value)
      setAttempted(false)
    }
  }

  function save(next: string) {
    if (column.input === 'number') column.save(row, Number(next))
    else column.save(row, next)
  }

  function commit(focusCell = false) {
    if (draft === null) return
    if (error) {
      setAttempted(true)
      return
    }
    if (draft !== value) save(draft)
    restoreFocus.current = focusCell
    setDraft(null)
  }

  function step(delta: number) {
    const next = String(Number(current) + delta)
    if (editing) setDraft(next)
    else save(next)
  }

  return (
    <td
      className={
        showError ? styles.invalid : editing ? styles.editing : undefined
      }
      onDoubleClick={open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) commit()
      }}
    >
      <div className={styles.cell}>
        {editing ? (
          <input
            className={styles.input}
            autoFocus
            aria-label={column.inputLabel?.(row, index) ?? label}
            aria-invalid={Boolean(showError)}
            aria-describedby={showError ? errorId : undefined}
            inputMode={column.input === 'number' ? 'numeric' : undefined}
            maxLength={column.input === 'text' ? column.maxLength : undefined}
            value={draft}
            onChange={(event) => {
              const next = event.target.value
              if (column.input === 'text' || /^-?\d*$/.test(next))
                setDraft(next)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault()
                if (event.key === 'Enter') commit(true)
                else {
                  restoreFocus.current = true
                  setDraft(null)
                }
              }
            }}
          />
        ) : (
          <span
            ref={valueElement}
            role="button"
            tabIndex={0}
            className={styles.value}
            aria-label={label}
            onKeyDown={(event) => {
              if (['Enter', 'F2', ' '].includes(event.key)) {
                event.preventDefault()
                open()
              }
            }}
          >
            {value}
          </span>
        )}
        {column.input === 'number' && (
          <div
            className={styles.arrows}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={`Aumentar: ${label}`}
              disabled={Boolean(
                error || column.validate(String(Number(current) + 1), row),
              )}
              onMouseDown={(event) => {
                if (editing) event.preventDefault()
              }}
              onClick={() => step(1)}
            >
              ▴
            </button>
            <button
              type="button"
              aria-label={`Diminuir: ${label}`}
              disabled={Boolean(
                error ||
                Number(current) <= column.min ||
                column.validate(String(Number(current) - 1), row),
              )}
              onMouseDown={(event) => {
                if (editing) event.preventDefault()
              }}
              onClick={() => step(-1)}
            >
              ▾
            </button>
          </div>
        )}
      </div>
      {showError && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </td>
  )
}
