import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import { personIsAssigned } from '../../domain/presentation/people'
import { PersonRow } from './PersonRow'
import type { peopleActions } from './peopleActions'
import styles from './people.module.css'

interface Props {
  presentation: Presentation
  actions: ReturnType<typeof peopleActions>
  onBack: () => void
}

export function PeoplePage({ presentation, actions, onBack }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  return (
    <section className={styles.page} aria-labelledby="people-title">
      <div className={styles.personHeading}>
        <h1 id="people-title">Integrantes</h1>
        <button onClick={onBack}>Voltar aos mapas</button>
      </div>
      <p>Duplo clique no nome para editar. Enter salva; Esc cancela.</p>
      <p>
        {presentation.people.length}{' '}
        {presentation.people.length === 1 ? 'integrante' : 'integrantes'}
      </p>
      <form
        className={styles.addForm}
        onSubmit={(event) => {
          event.preventDefault()
          try {
            actions.add(name)
            setName('')
            setError('')
          } catch {
            setError('Informe um nome de 1 a 80 caracteres.')
          }
        }}
      >
        <label>
          Nome do novo integrante
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="submit">Adicionar integrante</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {!presentation.people.length && (
        <p>Nenhum integrante. Adicione o primeiro integrante acima.</p>
      )}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Nome do integrante</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {presentation.people.map((person, index) => (
              <PersonRow
                key={person.id}
                person={person}
                number={index + 1}
                assigned={personIsAssigned(presentation, person.id)}
                onRename={actions.rename}
                onRemove={actions.remove}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>
        Guarde as alterações em Baixar apresentação editável. O PDF da lista de
        integrantes ainda não está disponível.
      </p>
    </section>
  )
}
