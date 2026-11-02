import { useId, useRef, useState } from 'react'
import type { Person } from '../../domain/presentation/model'
import { playerSuggestions, type PlayerSuggestion } from './playerSuggestions'
import { resolvePlayerDraft, type PlayerReference } from './playerDraft'
import styles from './stagePlayerEditor.module.css'

interface Props {
  people: readonly Person[]
  selectedIds: readonly string[]
  onCommit: (players: readonly PlayerReference[]) => void
  onCancel: () => void
}

export function StagePlayerEditor({
  people,
  selectedIds,
  onCommit,
  onCancel,
}: Props) {
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
  const options = playerSuggestions(people, parts.at(-1)!)
  const activeIndex = Math.min(active, options.length - 1)

  function commit(value = text, selected = choices) {
    if (finished.current) return
    try {
      const players = resolvePlayerDraft(value, people, selectedIds, selected)
      onCommit(players)
      finished.current = true
    } catch (failure) {
      setError((failure as Error).message)
    }
  }
  function choose(option: PlayerSuggestion) {
    const name =
      option.kind === 'person'
        ? people.find((person) => person.id === option.id)!.name
        : option.name
    const selected = { ...choices }
    if (option.kind === 'person') selected[parts.length - 1] = option.id
    setChoices(selected)
    const value = [...parts.slice(0, -1), name].join('/')
    setText(value)
    commit(value, selected)
  }

  return (
    <div className={styles.editor}>
      <input
        className={`${styles.nameField} ${styles.editing}`}
        autoFocus
        id={id}
        role="combobox"
        aria-label="Tocadores no instrumento"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        placeholder="Nome ou A/B"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          setActive(0)
          setOpen(Boolean(event.target.value.trim()))
          setError('')
        }}
        onBlur={() => commit()}
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
      {open && (
        <ul
          id={`${id}-options`}
          role="listbox"
          aria-label="Sugestões de tocadores"
          className={styles.options}
        >
          {options.map((option, index) => (
            <li
              key={option.kind === 'person' ? option.id : 'create'}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option.label}
            </li>
          ))}
          {!options.length && (
            <li className={styles.empty}>Nenhum integrante encontrado.</li>
          )}
        </ul>
      )}
      {error && (
        <p role="alert" id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
