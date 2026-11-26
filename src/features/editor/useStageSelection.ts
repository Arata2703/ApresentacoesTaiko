import { useState } from 'react'
import {
  changeKumi,
  createKumi,
  ungroupKumi,
} from '../../domain/presentation/kumi'
import type { Bounds, Align, Axis } from './selectionGeometry'
import { fitDelta, transformSelection, union } from './selectionGeometry'
import {
  deleteMembers,
  duplicateEntities,
  membersOf,
  translateMembers,
} from './stageSelectionActions'
import type { useStageEditor } from './useStageEditor'

export function useStageSelection(
  editor: ReturnType<typeof useStageEditor>,
  bounds: ReadonlyMap<string, Bounds>,
) {
  const map = editor.presentation.maps.find((m) => m.id === editor.activeMapId)!
  const [state, setState] = useState<{
    ids: string[]
    editing: string | null
    anchor: string | null
  }>({
    ids: editor.selectedId ? [editor.selectedId] : [],
    editing: null,
    anchor: editor.selectedId,
  })
  if (state.anchor !== editor.selectedId)
    setState({
      ...state,
      anchor: editor.selectedId,
      ids: editor.selectedId ? [editor.selectedId] : [],
    })
  const ids = state.ids.filter(
    (id) =>
      map.instruments.some((i) => i.id === id) ||
      (map.kumis ?? []).some((k) => k.id === id),
  )
  const editing = map.kumis?.find((k) => k.id === state.editing)
  const keyFor = (id: string) =>
    editing?.instrumentIds.includes(id)
      ? id
      : (map.kumis?.find((k) => k.instrumentIds.includes(id))?.id ?? id)
  const entityIds = editing
    ? [...editing.instrumentIds]
    : [
        ...(map.kumis ?? []).map((k) => k.id),
        ...map.instruments
          .filter(
            (i) => !map.kumis?.some((k) => k.instrumentIds.includes(i.id)),
          )
          .map((i) => i.id),
      ]
  const box = (id: string) =>
    union(membersOf(map, id).map((member) => bounds.get(member)!))
  function select(next: readonly string[]) {
    const single =
      next.length === 1 && map.instruments.some((i) => i.id === next[0])
        ? next[0]!
        : null
    editor.selectInstrument(single)
    setState((s) => ({ ...s, ids: [...next], anchor: single }))
  }
  function move(keys: readonly string[], dx: number, dy: number) {
    const memberIds = keys.flatMap((id) => membersOf(map, id))
    const delta = fitDelta(union(keys.map(box)), { x: dx, y: dy }, map.stage)
    editor.updatePresentation((p) =>
      translateMembers(p, map.id, memberIds, delta),
    )
  }
  function transform(
    action: Align | 'spaceX' | 'spaceY' | 'mirrorX' | 'mirrorY',
  ) {
    const deltas = transformSelection(ids.map(box), action, map.stage)
    editor.updatePresentation((p) =>
      ids.reduce(
        (next, id, index) =>
          translateMembers(
            next,
            map.id,
            membersOf(map, id),
            fitDelta(box(id), deltas[index]!, map.stage),
          ),
        p,
      ),
    )
  }
  function duplicate(keys = ids, sourceMapId = map.id) {
    const source = editor.presentation.maps.find((m) => m.id === sourceMapId)!
    const sourceIds = keys.flatMap((id) => membersOf(source, id))
    const sourcePoints = source.instruments.filter((i) =>
      sourceIds.includes(i.id),
    )
    const minX = Math.min(...sourcePoints.map((i) => i.position.x)),
      maxX = Math.max(...sourcePoints.map((i) => i.position.x)),
      minY = Math.min(...sourcePoints.map((i) => i.position.y)),
      maxY = Math.max(...sourcePoints.map((i) => i.position.y))
    if (maxX - minX > map.stage.width || maxY - minY > map.stage.depth) return
    const delta = {
      x: Math.max(-minX, Math.min(map.stage.width - maxX, 0.5)),
      y: Math.max(-minY, Math.min(map.stage.depth - maxY, 0.5)),
    }
    const result = duplicateEntities(
      editor.presentation,
      sourceMapId,
      keys,
      () => crypto.randomUUID(),
      delta,
      map.id,
    )
    editor.updatePresentation(() => result.presentation)
    select(result.ids)
  }
  return {
    ids,
    editing,
    keyFor,
    entityIds,
    box,
    select,
    move,
    transform,
    align: (action: Align) => transform(action),
    space: (axis: Axis) => transform(axis === 'x' ? 'spaceX' : 'spaceY'),
    mirror: (axis: Axis) => transform(axis === 'x' ? 'mirrorX' : 'mirrorY'),
    form: () => {
      const id = crypto.randomUUID()
      editor.updatePresentation((p) => createKumi(p, map.id, id, ids))
      select([id])
    },
    rename: (id: string, name: string) =>
      editor.updatePresentation((p) => changeKumi(p, map.id, id, { name })),
    edit: (id: string | null) => {
      setState((s) => ({ ...s, editing: id }))
      select(id ? [] : editing ? [editing.id] : [])
    },
    ungroup: () => {
      const groups = ids.filter((id) => map.kumis?.some((k) => k.id === id))
      const next = ids.flatMap((id) => membersOf(map, id))
      editor.updatePresentation((p) => ungroupKumi(p, map.id, groups))
      select(next)
    },
    remove: () => {
      const name =
        ids.length === 1
          ? editor.instruments.find((i) => i.id === ids[0])?.name
          : undefined
      editor.updatePresentation((p) =>
        deleteMembers(
          p,
          map.id,
          ids.flatMap((id) => membersOf(map, id)),
        ),
      )
      select([])
      editor.announce(name ? `${name} removido.` : 'Seleção apagada.')
    },
    duplicate,
    canForm:
      !editing &&
      ids.length > 1 &&
      ids.every((id) => !map.kumis?.some((k) => k.id === id)),
    groups: map.kumis ?? [],
    selectedGroup:
      ids.length === 1 ? map.kumis?.find((k) => k.id === ids[0]) : undefined,
  }
}
export type StageSelection = ReturnType<typeof useStageSelection>
