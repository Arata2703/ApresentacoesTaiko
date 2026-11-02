import { useState, type ChangeEvent } from 'react'
import {
  parseMap,
  serializeMap,
  type MapDraft,
} from '../../../integrations/mapFile'
import { download } from '../../../integrations/download'
import { exportMap } from '../../../integrations/exportMap'
import styles from '../editor.module.css'

interface Props {
  map: MapDraft
  onOpen: (map: MapDraft) => void
}

export function MapFiles({ map, onOpen }: Props) {
  const [pending, setPending] = useState<MapDraft | null>(null)
  const [message, setMessage] = useState(
    'Baixe o mapa para guardar seu trabalho. O navegador ainda não salva automaticamente.',
  )
  const [busy, setBusy] = useState(false)

  function save() {
    const source = serializeMap(map)
    try {
      // Never offer a backup that this same version cannot reopen.
      parseMap(source)
    } catch {
      setMessage(
        'Não foi possível baixar o mapa. Esta demonstração aceita até 500 instrumentos e nomes de até 80 caracteres.',
      )
      return
    }
    download(
      new Blob([source], { type: 'application/json' }),
      'mapa-taiko.json',
    )
    setMessage('Arquivo editável baixado. Guarde-o para reabrir este mapa.')
  }

  async function open(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setPending(null)
    try {
      if (file.size > 1_000_000)
        throw new Error('Arquivo muito grande para esta demonstração.')
      setPending(parseMap(await file.text()))
    } catch {
      setMessage(
        'Não foi possível abrir este arquivo. Escolha um mapa JSON válido da versão 1. Seu mapa atual foi preservado.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function pdf() {
    setBusy(true)
    try {
      await exportMap(map)
      setMessage(
        'PDF A4 horizontal baixado. Baixe também o mapa editável para continuar depois.',
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Falha ao gerar PDF. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={styles.fileActions} aria-label="Arquivos do mapa">
      <div className={styles.fileButtons}>
        <button onClick={save} disabled={busy}>
          Baixar mapa editável
        </button>
        <label>
          Abrir mapa
          <input
            aria-label="Abrir mapa"
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(event) => void open(event)}
          />
        </label>
        <button onClick={() => void pdf()} disabled={busy}>
          {busy ? 'Processando…' : 'Exportar PDF'}
        </button>
      </div>
      <p aria-live="polite">{message}</p>
      {pending && (
        <div
          role="alertdialog"
          aria-label="Substituir mapa atual"
          aria-describedby="replace-map-description"
        >
          <p id="replace-map-description">
            Abrir “{pending.title}” substituirá o mapa atual. Baixe seu trabalho
            antes de continuar.
          </p>
          <button
            onClick={() => {
              onOpen(pending)
              setPending(null)
              setMessage(
                'Mapa reaberto. Continue editando e baixe uma nova cópia ao terminar.',
              )
            }}
          >
            Substituir e abrir
          </button>
          <button onClick={() => setPending(null)}>Cancelar abertura</button>
        </div>
      )}
    </section>
  )
}
