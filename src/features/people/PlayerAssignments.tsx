import type { Person } from '../../domain/presentation/model'
import styles from './people.module.css'

interface Props {
  people: readonly Person[]
  selectedIds: readonly string[]
  onAssign: (ids: readonly string[]) => void
  onManage: () => void
}
export function PlayerAssignments({
  people,
  selectedIds,
  onAssign,
  onManage,
}: Props) {
  return (
    <fieldset className={styles.assignments}>
      <legend>Tocadores</legend>
      {!people.length && (
        <p className={styles.hint}>
          Cadastre os integrantes para atribuir tocadores.
        </p>
      )}
      <div className={styles.choices}>
        {people.map((person, index) => (
          <label key={person.id} className={styles.assignment}>
            <input
              type="checkbox"
              aria-label={`${person.name} · pessoa ${index + 1}`}
              checked={selectedIds.includes(person.id)}
              onChange={(event) =>
                onAssign(
                  event.target.checked
                    ? [...selectedIds, person.id]
                    : selectedIds.filter((id) => id !== person.id),
                )
              }
            />
            {person.name}
          </label>
        ))}
      </div>
      <button type="button" onClick={onManage}>
        Gerenciar integrantes
      </button>
    </fieldset>
  )
}
