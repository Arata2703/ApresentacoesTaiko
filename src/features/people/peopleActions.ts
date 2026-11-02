import type { Presentation } from '../../domain/presentation/model'
import {
  addPerson,
  renamePerson,
  setRosterMembership,
  removePerson,
  personIsAssigned,
} from '../../domain/presentation/people'
import { named } from '../../domain/presentation/rules'

export function peopleActions(
  update: (change: (p: Presentation) => Presentation) => void,
) {
  return {
    add: (name: string) => {
      const normalized = named(name)
      const id = crypto.randomUUID()
      update((p) => addPerson(p, id, normalized))
    },
    rename: (id: string, name: string) => {
      const normalized = named(name)
      update((p) => renamePerson(p, id, normalized))
    },
    membership: (id: string, included: boolean) =>
      update((p) => setRosterMembership(p, id, included)),
    remove: (id: string) =>
      update((p) => (personIsAssigned(p, id) ? p : removePerson(p, id))),
  }
}
