import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import { personIsAssigned } from '../../domain/presentation/people'
import { PersonRow } from './PersonRow'
import type { peopleActions } from './peopleActions'
import styles from './people.module.css'

interface Props {
  presentation: Presentation
  actions: ReturnType<typeof peopleActions>
}

export function PeoplePage({ presentation, actions }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  return (
    <section className={styles.page} aria-labelledby="people-title">
      <h1 id="people-title">Integrantes</h1>
      <p>
        Cadastre as pessoas e marque quem faz parte da lista desta apresentação.
        Os números distinguem pessoas com o mesmo nome.
      </p>
      <p>
        {presentation.rosterIds.length} na lista · {presentation.people.length}{' '}
        no cadastro
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
        <p>Nenhuma pessoa cadastrada. Adicione o primeiro integrante acima.</p>
      )}
      <div className={styles.list}>
        {presentation.people.map((person, index) => (
          <PersonRow
            key={person.id}
            person={person}
            number={index + 1}
            included={presentation.rosterIds.includes(person.id)}
            assigned={personIsAssigned(presentation, person.id)}
            onRename={actions.rename}
            onMembership={actions.membership}
            onRemove={actions.remove}
          />
        ))}
      </div>
      <p className={styles.hint}>
        Guarde as alterações em Baixar apresentação editável. O PDF da lista de
        integrantes ainda não está disponível.
      </p>
    </section>
  )
}
