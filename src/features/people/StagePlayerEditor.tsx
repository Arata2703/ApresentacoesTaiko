import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { Person } from '../../domain/presentation/model'
import { playerSuggestions, type PlayerSuggestion } from './playerSuggestions'
import { resolvePlayerDraft, type PlayerReference } from './playerDraft'
import styles from './stagePlayerEditor.module.css'

interface Props {
  people: readonly Person[]
  selectedIds: readonly string[]
  onCommit: (players: readonly PlayerReference[]) => void
  onCancel: () => void
  initialCaret?: number
}

export function StagePlayerEditor({
  people,
  selectedIds,
  onCommit,
  onCancel,
  initialCaret,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (initialCaret !== undefined)
      input.current!.setSelectionRange(initialCaret, initialCaret)
  }, [initialCaret])
  const id = useId()
  const [text, setText] = useState(
    selectedIds
      .map((personId) => people.find((person) => person.id === personId)!.name)
      .join('/'),
  )
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [choices, setChoices] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const finished = useRef(false)
  const parts = text.split('/')
  const query = parts.at(-1)!.trim()
  const options = playerSuggestions(people, query)
  const activeIndex = Math.min(active, options.length - 1)
  const showOptions = open && options.length > 0
  const showNotice = open && !options.length && Boolean(query)

  function commit(value = text, selected = choices, allowRegistration = true) {
    if (finished.current) return
    try {
      const players = resolvePlayerDraft(value, people, selectedIds, selected)
      finished.current = true
      if (!allowRegistration && players.some((player) => 'name' in player))
        onCancel()
      else onCommit(players)
    } catch (failure) {
      setError((failure as Error).message)
    }
  }
  function choose(option: PlayerSuggestion) {
    const name = people.find((person) => person.id === option.id)!.name
    const selected = { ...choices, [parts.length - 1]: option.id }
    setChoices(selected)
    const value = [...parts.slice(0, -1), name].join('/')
    setText(value)
    commit(value, selected)
  }

  return (
    <div className={styles.editor}>
      <input
        ref={input}
        className={`${styles.nameField} ${styles.editing}`}
        autoFocus
        id={id}
        role="combobox"
        aria-label="Tocadores no instrumento"
        aria-autocomplete="list"
        aria-expanded={showOptions}
        aria-controls={`${id}-options`}
        aria-describedby={
          error ? `${id}-error` : showNotice ? `${id}-notice` : undefined
        }
        aria-activedescendant={
          open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        placeholder="Nome"
        value={text}
        onDoubleClick={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setText(event.target.value)
          setActive(0)
          setOpen(Boolean(event.target.value.trim()))
          setError('')
        }}
        onBlur={() => commit(text, choices, false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            finished.current = true
            onCancel()
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setActive((index) =>
              !options.length
                ? 0
                : !open
                  ? event.key === 'ArrowDown'
                    ? 0
                    : options.length - 1
                  : (index +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      options.length) %
                    options.length,
            )
          } else if (event.key === 'Enter') {
            event.preventDefault()
            if (open && activeIndex >= 0) choose(options[activeIndex]!)
            else commit()
          }
        }}
      />
      {showOptions && (
        <ul
          id={`${id}-options`}
          role="listbox"
          aria-label="Sugestões de tocadores"
          className={styles.options}
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
      {showNotice && (
        <p
          id={`${id}-notice`}
          role="status"
          className={`${styles.options} ${styles.empty}`}
        >
          {query} não está na lista de integrantes.
        </p>
      )}
      {error && (
        <p role="alert" id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
