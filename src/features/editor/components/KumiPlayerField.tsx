import { useState } from 'react'
import type { Kumi, Person } from '../../../domain/presentation/model'
import { StagePlayerEditor } from '../../people/StagePlayerEditor'
import type { PlayerReference } from '../../people/playerDraft'
import css from '../stageSelection.module.css'

export function KumiPlayerField({
  group,
  people,
  onCommit,
}: {
  group: Kumi
  people: readonly Person[]
  onCommit: (id: string, players: readonly PlayerReference[]) => void
}) {
  const [revision, setRevision] = useState(0)
  return (
    <div className={css.playerField}>
      <span>Integrante do Kumi</span>
      <StagePlayerEditor
        key={group.id + JSON.stringify(group.playerIds) + revision}
        label="Integrante do Kumi"
        autoFocus={false}
        people={people}
        selectedIds={group.playerIds}
        onCommit={(players) => {
          onCommit(group.id, players)
          setRevision((n) => n + 1)
        }}
        onCancel={() => setRevision((n) => n + 1)}
      />
    </div>
  )
}
