import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
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
} from '../../domain/presentation/maps'
import { addPerson, renamePerson } from '../../domain/presentation/people'
import {
  getInstrumentType,
  type InstrumentChanges,
  type InstrumentKind,
} from '../../domain/stage'
import { firstMapId, projectMap } from './editorProjection'

function initialState() {
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
    playerDraft: null as string | null,
  }
}

export function useStageEditor() {
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState(
    'Escolha um instrumento no catálogo para começar.',
  )
  const page = projectMap(state.presentation, state.mapId)
  const instruments = page?.instruments ?? []
  const item = instruments.find((entry) => entry.id === state.selectedId)
  const selected = item && { ...item, player: state.playerDraft ?? item.player }

  function selectInstrument(id: string) {
    setState((s) => ({ ...s, selectedId: id, playerDraft: null }))
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
      return { ...s, presentation, selectedId: id, playerDraft: null }
    })
    setMessage(`${getInstrumentType(kind).name} adicionado ao palco.`)
  }

  function changeSelected(changes: InstrumentChanges) {
    const personId = crypto.randomUUID()
    setState((s) => {
      const map = s.presentation.maps.find((entry) => entry.id === s.mapId)
      const instrument = map?.instruments.find(
        (entry) => entry.id === s.selectedId,
      )
      if (!map || !instrument) return s
      let p = s.presentation
      let playerDraft = s.playerDraft
      if (changes.player !== undefined && instrument.playerIds.length <= 1) {
        playerDraft = changes.player
        const name = changes.player.trim()
        if (!name) p = assignInstrumentPlayers(p, map.id, instrument.id, [])
        else if (instrument.playerIds.length === 1)
          p = renamePerson(p, instrument.playerIds[0]!, name)
        else {
          p = addPerson(p, personId, name, false)
          p = assignInstrumentPlayers(p, map.id, instrument.id, [personId])
        }
      }
      p = updateMapInstrument(p, map.id, instrument.id, {
        position: {
          x: Number.isFinite(changes.x) ? changes.x! : instrument.position.x,
          y: Number.isFinite(changes.y) ? changes.y! : instrument.position.y,
        },
        rotation: Number.isFinite(changes.rotation)
          ? changes.rotation
          : instrument.rotation,
      })
      return { ...s, presentation: p, playerDraft }
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
      playerDraft: null,
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
      return { ...s, presentation, selectedId: id, playerDraft: null }
    })
  }

  return {
    presentation: state.presentation,
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
              playerDraft: null,
            }
          : s
      }),
    openPresentation: (presentation: Presentation) => {
      const mapId = firstMapId(presentation)
      setState({
        presentation,
        mapId,
        selectedId: null,
        titleDraft: presentation.title,
        songDraft: projectMap(presentation, mapId)?.song ?? '',
        playerDraft: null,
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
