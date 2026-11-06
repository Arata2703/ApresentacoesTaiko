import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import { DataTable } from '../../components/DataTable'
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
      <DataTable
        rows={presentation.people}
        rowId={(person) => person.id}
        rowLabel={(person, index) => `Pessoa ${index + 1}: ${person.name}`}
        columns={[
          {
            id: 'name',
            title: 'Nome do integrante',
            kind: 'editable',
            input: 'text',
            maxLength: 80,
            value: (person) => person.name,
            label: (person, index) =>
              `Editar nome de ${person.name} (pessoa ${index + 1})`,
            inputLabel: (person, index) =>
              `Novo nome de ${person.name} (pessoa ${index + 1})`,
            validate: (value) =>
              value.trim() ? '' : 'Informe um nome de 1 a 80 caracteres.',
            save: (person, value) => actions.rename(person.id, value),
          },
          {
            id: 'remove',
            kind: 'remove',
            label: (person, index) =>
              `Remover ${person.name} (pessoa ${index + 1})`,
            confirmation: (person) => {
              const songs = presentation.maps.filter((map) =>
                map.instruments.some((item) =>
                  item.playerIds.includes(person.id),
                ),
              )
              const transitions = presentation.transitions.filter((item) =>
                item.participantIds.includes(person.id),
              )
              return (
                <>
                  <p>Deseja remover {person.name} da apresentação?</p>
                  {(songs.length > 0 || transitions.length > 0) && (
                    <p>A remoção também retira suas atribuições.</p>
                  )}
                  {songs.length > 0 && (
                    <p>
                      <strong>Músicas:</strong>{' '}
                      {songs.map((map) => map.title).join(', ')}
                    </p>
                  )}
                  {transitions.length > 0 && (
                    <p>
                      <strong>Tsunagis:</strong>{' '}
                      {transitions
                        .map((item) => item.tsunagiName || 'Sem nome')
                        .join(', ')}
                    </p>
                  )}
                </>
              )
            },
            remove: (person) => actions.remove(person.id),
          },
        ]}
      />
      <p className={styles.hint}>
        Guarde as alterações em Baixar apresentação editável. O PDF da lista de
        integrantes ainda não está disponível.
      </p>
    </section>
  )
}
