import { useRef } from 'react'
import type { useStageEditor } from '../useStageEditor'
import type { PlayerReference } from '../../people/playerDraft'
import { useStageBounds } from '../useStageBounds'
import { useStageSelection } from '../useStageSelection'
import { InstrumentCatalog } from './InstrumentCatalog'
import { InstrumentProperties } from './InstrumentProperties'
import { StageMap } from './StageMap'
import { SelectionTools } from './SelectionTools'
import { KumiPlayerField } from './KumiPlayerField'
import styles from '../editor.module.css'

export function StageWorkspace({
  editor,
  onCommitPlayers,
  onManage,
  showNames,
  onToggleNames,
}: {
  editor: ReturnType<typeof useStageEditor>
  onCommitPlayers: (id: string, players: readonly PlayerReference[]) => void
  onManage: () => void
  showNames: boolean
  onToggleNames: () => void
}) {
  const surface = useRef<HTMLDivElement>(null)
  const geometry = useStageBounds(
    surface,
    editor.instruments,
    editor.page!.stage,
  )
  const selection = useStageSelection(editor, geometry.bounds)
  const selected =
    selection.ids.length === 1
      ? editor.instruments.find((i) => i.id === selection.ids[0])
      : undefined
  const group = selection.selectedGroup
  return (
    <div className={styles.editor}>
      <InstrumentCatalog
        key={editor.presentation.id}
        onAdd={editor.addInstrument}
        custom={editor.presentation.customInstruments ?? []}
        onCreate={editor.registerInstrument}
        presentation={editor.presentation}
        onEdit={editor.editInstrument}
        onRemove={editor.removeCatalogInstrument}
        onAddKumi={(id, mapId) => selection.duplicate([id], mapId)}
      />
      <StageMap
        stage={editor.page!.stage}
        instruments={editor.instruments}
        selectedId={editor.selectedId}
        people={editor.presentation.people}
        onCommitPlayers={onCommitPlayers}
        onSelect={editor.selectInstrument}
        onAdd={editor.addInstrument}
        surface={surface}
        onImageLoad={geometry.measure}
        surfaceSize={geometry.size}
        selection={selection}
        showNames={showNames}
      />
      <aside className={styles.properties} aria-label="Seleção e propriedades">
        <SelectionTools
          selection={selection}
          showNames={showNames}
          onToggleNames={onToggleNames}
        />
        {group ? (
          <>
            <h2>Kumi</h2>
            <label className={styles.field}>
              Nome do Kumi · opcional
              <input
                key={group.id + group.name}
                defaultValue={group.name}
                maxLength={80}
                placeholder="Adicionar à lista de instrumentos"
                onBlur={(event) =>
                  selection.rename(group.id, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur()
                }}
              />
            </label>
            <KumiPlayerField
              people={editor.presentation.people}
              group={group}
              onCommit={onCommitPlayers}
            />
          </>
        ) : selection.ids.length > 1 ? (
          <p>{selection.ids.length} elementos selecionados</p>
        ) : (
          <InstrumentProperties
            embedded
            hidePlayers={Boolean(selection.editing)}
            selected={selected}
            people={editor.presentation.people}
            onAssign={editor.assignPlayers}
            onManage={onManage}
            stage={editor.page!.stage}
            onChange={editor.changeSelected}
            onRemove={editor.removeSelected}
            onBaseChange={editor.changeBase}
          />
        )}
      </aside>
    </div>
  )
}
