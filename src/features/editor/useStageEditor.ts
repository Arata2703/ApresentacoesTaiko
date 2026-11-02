import { useState } from 'react'
import {
  createInstrument,
  getInstrumentType,
  updateInstrument,
  type InstrumentChanges,
  type InstrumentKind,
  type StageInstrument,
} from '../../domain/stage'

export function useStageEditor() {
  const [title, setTitle] = useState('Minha apresentação')
  const [song, setSong] = useState('Primeira música')
  const [instruments, setInstruments] = useState<StageInstrument[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState(
    'Escolha um instrumento no catálogo para começar.',
  )
  const selected = instruments.find((item) => item.id === selectedId)

  function addInstrument(kind: InstrumentKind) {
    const id = crypto.randomUUID()
    setInstruments((current) => [
      ...current,
      createInstrument(kind, id, current.length),
    ])
    setSelectedId(id)
    setMessage(`${getInstrumentType(kind).name} adicionado ao palco.`)
  }

  function changeSelected(changes: InstrumentChanges) {
    if (!selectedId) return
    setInstruments((current) => updateInstrument(current, selectedId, changes))
  }

  function removeSelected() {
    if (!selected) return
    setInstruments((current) =>
      current.filter((item) => item.id !== selected.id),
    )
    setSelectedId(null)
    setMessage(`${getInstrumentType(selected.kind).name} removido.`)
  }

  function moveInstrument(id: string, dx: number, dy: number) {
    setSelectedId(id)
    setInstruments((current) => {
      const item = current.find((instrument) => instrument.id === id)
      if (!item) return current
      return updateInstrument(current, id, { x: item.x + dx, y: item.y + dy })
    })
  }

  return {
    title,
    song,
    instruments,
    selectedId,
    selected,
    message,
    setTitle,
    setSong,
    selectInstrument: setSelectedId,
    addInstrument,
    changeSelected,
    removeSelected,
    moveInstrument,
  }
}
