import { useRef, useState } from 'react'
import type { Person } from '../../domain/presentation/model'
import styles from './people.module.css'

interface Props {
  person: Person
  number: number
  assigned: boolean
  onRename: (id: string, name: string) => void
  onRemove: (id: string) => void
}

export function PersonRow({
  person,
  number,
  assigned,
  onRename,
  onRemove,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [draft, setDraft] = useState(person.name)
  const [error, setError] = useState('')
  const finished = useRef(false)
  const label = `${person.name} (pessoa ${number})`

  function edit() {
    setDraft(person.name)
    finished.current = false
    setEditing(true)
  }
  function commit() {
    if (finished.current) return
    try {
      onRename(person.id, draft)
      finished.current = true
      setEditing(false)
      setError('')
    } catch {
      setError('Informe um nome de 1 a 80 caracteres.')
    }
  }
  function cancel() {
    finished.current = true
    setEditing(false)
    setError('')
  }

  return (
    <>
      <tr aria-label={`Pessoa ${number}: ${person.name}`}>
        <td
          className={styles.nameCell}
          onDoubleClick={() => {
            if (!editing) edit()
          }}
        >
          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                commit()
              }}
            >
              <input
                className={styles.nameInput}
                autoFocus
                aria-label={`Novo nome de ${label}`}
                value={draft}
                maxLength={80}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    cancel()
                  }
                }}
              />
              {error && <p role="alert">{error}</p>}
            </form>
          ) : (
            <span
              className={styles.editableName}
              role="button"
              tabIndex={0}
              aria-label={`Editar nome de ${label}`}
              title="Duplo clique para editar. Enter ou F2 pelo teclado."
              onKeyDown={(event) => {
                if (['Enter', 'F2', ' '].includes(event.key)) {
                  event.preventDefault()
                  edit()
                }
              }}
            >
              {person.name}
            </span>
          )}
        </td>
        <td>
          <button
            className={styles.iconButton}
            title={`Remover ${person.name}`}
            aria-label={`Remover ${label}`}
            onClick={() => {
              if (assigned) setRemoving(true)
              else onRemove(person.id)
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6" />
            </svg>
          </button>
        </td>
      </tr>
      {removing && (
        <tr>
          <td colSpan={2}>
            <div role="alertdialog" aria-label={`Remover ${label}`}>
              <p>
                Remover {person.name} da apresentação também retira suas
                atribuições dos instrumentos e transições. Os instrumentos e
                textos serão mantidos.
              </p>
              <div className={styles.actions}>
                <button
                  aria-label={`Confirmar remoção de ${label}`}
                  onClick={() => onRemove(person.id)}
                >
                  Confirmar remoção
                </button>
                <button
                  aria-label={`Cancelar remoção de ${label}`}
                  onClick={() => setRemoving(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
