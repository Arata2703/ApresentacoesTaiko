import { useState } from 'react'
import type { Person } from '../../domain/presentation/model'
import styles from './people.module.css'

interface Props {
  person: Person
  number: number
  included: boolean
  assigned: boolean
  onRename: (id: string, name: string) => void
  onMembership: (id: string, included: boolean) => void
  onRemove: (id: string) => void
}

export function PersonRow({
  person,
  number,
  included,
  assigned,
  onRename,
  onMembership,
  onRemove,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(person.name)
  const [error, setError] = useState('')
  const label = `${person.name} (pessoa ${number})`
  return (
    <article
      className={styles.card}
      aria-label={`Pessoa ${number}: ${person.name}`}
    >
      <div className={styles.personHeading}>
        <h2>{person.name}</h2>
        <span>Pessoa {number}</span>
      </div>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={included}
          onChange={(event) => onMembership(person.id, event.target.checked)}
        />
        Na lista de integrantes · {label}
      </label>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            try {
              onRename(person.id, draft)
              setEditing(false)
              setError('')
            } catch {
              setError('Informe um nome de 1 a 80 caracteres.')
            }
          }}
        >
          <label>
            Novo nome de {label}
            <input
              value={draft}
              maxLength={80}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="submit">Salvar nome de {label}</button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError('')
              }}
            >
              Cancelar renomeação de {label}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setDraft(person.name)
            setEditing(true)
          }}
        >
          Renomear {label}
        </button>
      )}
      <p className={styles.hint}>
        {assigned
          ? 'Pessoa atribuída a instrumento ou transição. Para excluir o cadastro, retire antes essas atribuições. Você pode retirá-la da lista sem apagar o trabalho.'
          : 'Cadastro sem atribuições; pode ser excluído.'}
      </p>
      <button disabled={assigned} onClick={() => onRemove(person.id)}>
        Excluir cadastro de {label}
      </button>
    </article>
  )
}
