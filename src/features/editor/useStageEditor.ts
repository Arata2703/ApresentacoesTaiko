import { useState } from 'react'
import type {
  BaseId,
  Presentation,
  StageDimensions,
} from '../../domain/presentation/model'
import {
  createPresentation,
  renamePresentation,
} from '../../domain/presentation/presentation'
import {
  addMap,
  addMapInstrument,
  assignInstrumentPlayers,
  removeMapInstrument,
  renameMap,
  updateMapInstrument,
  setInstrumentBase,
  resizeStage,
} from '../../domain/presentation/maps'
import { getInstrumentType, type InstrumentKind } from '../../domain/stage'
import { addPerson } from '../../domain/presentation/people'
import { named } from '../../domain/presentation/rules'
import type { PlayerReference } from '../people/playerDraft'
import {
  firstMapId,
  projectMap,
  type InstrumentTransform,
} from './editorProjection'
import { mapActions, type EditorState } from './mapActions'
import {
  readPresentationCache,
  type CachedPresentation,
} from '../../integrations/presentationCache'
import { usePresentationCache } from './usePresentationCache'

function includeAllPeople(p: Presentation): Presentation {
  return p.rosterIds.length === p.people.length &&
    p.people.every((person) => p.rosterIds.includes(person.id))
    ? p
    : { ...p, rosterIds: p.people.map((person) => person.id) }
}

function initialState(cached: CachedPresentation) {
  if (cached) {
    const presentation = includeAllPeople(cached.presentation)
    const mapId = presentation.maps.some((map) => map.id === cached.mapId)
      ? cached.mapId
      : firstMapId(presentation)
    return {
      presentation,
      mapId,
      selectedId: null,
      titleDraft: presentation.title,
      songDraft: projectMap(presentation, mapId)?.song ?? '',
    }
  }
  const presentation = addMap(
    createPresentation(crypto.randomUUID(), 'Minha apresentação'),
    crypto.randomUUID(),
    'Primeira música',
    { width: 10, depth: 6 },
  )
  return {
    presentation,
    mapId: firstMapId(presentation),
    selectedId: null as string | null,
    titleDraft: presentation.title,
    songDraft: 'Primeira música',
  }
}

export function useStageEditor() {
  const [cached] = useState(readPresentationCache)
  const [state, setState] = useState<EditorState>(() =>
    initialState(cached.data),
  )
  const cache = usePresentationCache(
    state.presentation,
    state.mapId,
    cached.error,
  )
  const [message, setMessage] = useState(
    'Escolha um instrumento no catálogo para começar.',
  )
  const page = projectMap(state.presentation, state.mapId)
  const instruments = page?.instruments ?? []
  const selected = instruments.find((entry) => entry.id === state.selectedId)

  function selectInstrument(id: string | null) {
    setState((s) => ({ ...s, selectedId: id }))
  }

  function addInstrument(kind: InstrumentKind) {
    const id = crypto.randomUUID()
    setState((s) => {
      if (s.mapId === null) return s
      const map = s.presentation.maps.find((entry) => entry.id === s.mapId)!
      const count = map.instruments.length
      const p = addMapInstrument(s.presentation, s.mapId, id, kind)
      const presentation = updateMapInstrument(p, map.id, id, {
        position: {
          x: map.stage.width * (0.2 + (count % 4) * 0.2),
          y: map.stage.depth * (1 / 3 + (Math.floor(count / 4) % 3) / 6),
        },
      })
      return { ...s, presentation, selectedId: id }
    })
    setMessage(`${getInstrumentType(kind).name} adicionado ao palco.`)
  }

  function changeSelected(changes: InstrumentTransform) {
    setState((s) => {
      const map = s.presentation.maps.find((entry) => entry.id === s.mapId)
      const instrument = map?.instruments.find(
        (entry) => entry.id === s.selectedId,
      )
      if (!map || !instrument) return s
      const p = updateMapInstrument(s.presentation, map.id, instrument.id, {
        position: {
          x: Number.isFinite(changes.x) ? changes.x! : instrument.position.x,
          y: Number.isFinite(changes.y) ? changes.y! : instrument.position.y,
        },
        rotation: Number.isFinite(changes.rotation)
          ? changes.rotation
          : instrument.rotation,
      })
      return { ...s, presentation: p }
    })
  }

  function removeSelected() {
    if (!selected || state.mapId === null) return
    setState((s) => ({
      ...s,
      presentation: removeMapInstrument(
        s.presentation,
        state.mapId!,
        selected.id,
      ),
      selectedId: null,
    }))
    setMessage(`${getInstrumentType(selected.kind).name} removido.`)
  }

  function moveInstrument(id: string, dx: number, dy: number) {
    setState((s) => {
      const map = s.presentation.maps.find((entry) => entry.id === s.mapId)
      const instrument = map?.instruments.find((entry) => entry.id === id)
      if (!map || !instrument) return s
      const presentation = updateMapInstrument(s.presentation, map.id, id, {
        position: {
          x: Number((instrument.position.x + dx).toFixed(3)),
          y: Number((instrument.position.y + dy).toFixed(3)),
        },
      })
      return { ...s, presentation, selectedId: id }
    })
  }

  return {
    changeBase: (baseId: BaseId | null) =>
      setState((s) =>
        s.mapId === null || s.selectedId === null
          ? s
          : {
              ...s,
              presentation: setInstrumentBase(
                s.presentation,
                s.mapId,
                s.selectedId,
                baseId,
              ),
            },
      ),
    resizeStage: (stage: StageDimensions, allowReposition = false) =>
      setState({
        ...state,
        presentation: resizeStage(state.presentation, stage, allowReposition),
      }),
    ...mapActions(state, setState),
    cache,
    commitPlayers: (
      instrumentId: string,
      players: readonly PlayerReference[],
    ) => {
      const additions = new Map<string, { id: string; name: string }>()
      const ids = players.map((player) => {
        if ('id' in player) return player.id
        const name = named(player.name)
        if (!additions.has(name))
          additions.set(name, { id: crypto.randomUUID(), name })
        return additions.get(name)!.id
      })
      setState((s) => {
        const map = s.presentation.maps.find((item) =>
          item.instruments.some((instrument) => instrument.id === instrumentId),
        )
        if (!map) return s
        let p = s.presentation
        for (const person of additions.values())
          p = addPerson(p, person.id, person.name)
        return {
          ...s,
          presentation: assignInstrumentPlayers(p, map.id, instrumentId, ids),
        }
      })
    },
    updatePresentation: (change: (p: Presentation) => Presentation) =>
      setState((s) => ({ ...s, presentation: change(s.presentation) })),
    assignPlayers: (ids: readonly string[]) =>
      setState((s) => {
        if (s.mapId === null || s.selectedId === null) return s
        return {
          ...s,
          presentation: assignInstrumentPlayers(
            s.presentation,
            s.mapId,
            s.selectedId,
            ids,
          ),
        }
      }),
    presentation: includeAllPeople(state.presentation),
    page,
    instruments,
    selected,
    selectedId: state.selectedId,
    message,
    title: state.titleDraft,
    song: state.songDraft,
    selectInstrument,
    addInstrument,
    changeSelected,
    removeSelected,
    moveInstrument,
    setTitle: (title: string) =>
      setState((s) => ({
        ...s,
        titleDraft: title,
        presentation: renamePresentation(
          s.presentation,
          title.trim() || 'Apresentação sem título',
        ),
      })),
    setSong: (song: string) =>
      setState((s) =>
        s.mapId === null
          ? s
          : {
              ...s,
              songDraft: song,
              presentation: renameMap(
                s.presentation,
                s.mapId,
                song.trim() || 'Música sem título',
              ),
            },
      ),
    selectMap: (id: string) =>
      setState((s) => {
        const map = s.presentation.maps.find((entry) => entry.id === id)
        return map
          ? {
              ...s,
              mapId: id,
              songDraft: map.title,
              selectedId: null,
            }
          : s
      }),
    openPresentation: (presentation: Presentation) => {
      cache.enable()
      presentation = includeAllPeople(presentation)
      const mapId = firstMapId(presentation)
      setState({
        presentation,
        mapId,
        selectedId: null,
        titleDraft: presentation.title,
        songDraft: projectMap(presentation, mapId)?.song ?? '',
      })
      setMessage('Apresentação carregada do arquivo editável.')
    },
    createFirstMap: () => {
      const id = crypto.randomUUID()
      setState((s) =>
        s.presentation.maps.length
          ? s
          : {
              ...s,
              presentation: addMap(s.presentation, id, 'Primeira música', {
                width: 10,
                depth: 6,
              }),
              mapId: id,
              songDraft: 'Primeira música',
            },
      )
    },
    activeMapId: state.mapId,
  }
}
