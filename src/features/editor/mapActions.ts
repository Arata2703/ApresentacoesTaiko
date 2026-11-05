import type { Dispatch, SetStateAction } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import { addMap, removeMap } from '../../domain/presentation/maps'
import { duplicateMap } from '../../domain/presentation/duplicateMap'
import { reorderSequence } from '../../domain/presentation/sequence'
import type { DropSide } from './slideDropTarget'

export interface EditorState {
  presentation: Presentation
  mapId: string | null
  selectedId: string | null
  titleDraft: string
  songDraft: string
}
function activate(
  state: EditorState,
  presentation: Presentation,
  id: string | null,
): EditorState {
  return {
    ...state,
    presentation,
    mapId: id,
    selectedId: null,
    songDraft: presentation.maps.find((map) => map.id === id)?.title ?? '',
  }
}
export function mapActions(
  state: EditorState,
  update: Dispatch<SetStateAction<EditorState>>,
) {
  return {
    reorderMusic: (id: string, targetId: string, side: DropSide = 'after') =>
      update((s) => {
        const maps = s.presentation.sequence
          .filter((item) => item.kind === 'map')
          .map((item) => item.id)
        const source = maps.indexOf(id)
        const target = maps.indexOf(targetId)
        if (source < 0 || target < 0 || source === target) return s
        maps.splice(source, 1)
        const insertion = maps.indexOf(targetId) + (side === 'after' ? 1 : 0)
        maps.splice(insertion, 0, id)
        let index = 0
        const ids = s.presentation.sequence.map((item) =>
          item.kind === 'map' ? maps[index++]! : item.id,
        )
        return { ...s, presentation: reorderSequence(s.presentation, ids) }
      }),
    addMusic: () => {
      const id = crypto.randomUUID()
      update((s) =>
        activate(
          s,
          addMap(
            s.presentation,
            id,
            `Música ${s.presentation.maps.length + 1}`,
            { width: 10, depth: 6 },
          ),
          id,
        ),
      )
    },
    duplicateMusic: () => {
      const source = state.presentation.maps.find(
        (map) => map.id === state.mapId,
      )
      if (!source) return
      const id = crypto.randomUUID()
      const ids = source.instruments.map(() => crypto.randomUUID())
      update((s) =>
        activate(s, duplicateMap(s.presentation, source.id, id, ids), id),
      )
    },
    removeMusic: () => {
      if (state.mapId === null) return
      update((s) => {
        const maps = s.presentation.sequence.filter(
          (item) => item.kind === 'map',
        )
        const index = maps.findIndex((item) => item.id === state.mapId)
        const nextId = maps[index + 1]?.id ?? maps[index - 1]?.id ?? null
        return activate(s, removeMap(s.presentation, state.mapId!), nextId)
      })
    },
    moveMusic: (id: string, direction: -1 | 1) =>
      update((s) => {
        const sequence = s.presentation.sequence
        const index = sequence.findIndex((item) => item.id === id)
        let target = index + direction
        while (
          target >= 0 &&
          target < sequence.length &&
          sequence[target]!.kind !== 'map'
        )
          target += direction
        if (index < 0 || target < 0 || target >= sequence.length) return s
        const ids = sequence.map((item) => item.id)
        ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
        return { ...s, presentation: reorderSequence(s.presentation, ids) }
      }),
  }
}
