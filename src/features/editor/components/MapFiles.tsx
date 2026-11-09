import { useState, type ChangeEvent } from 'react'
import type { Presentation } from '../../../domain/presentation/model'
import {
  importPresentation,
  serializePresentation,
  maxProjectBytes,
  type ImportResult,
} from '../../../integrations/presentationFile'
import { download } from '../../../integrations/download'
import { exportPresentation } from '../../../integrations/exportPresentation'
import { ConfirmationPopup } from '../../../components/ConfirmationPopup'
import styles from '../editor.module.css'

interface Props {
  presentation: Presentation
  onOpen: (presentation: Presentation) => void
}
type Candidate = Extract<ImportResult, { status: 'valid' }>

export function MapFiles({ presentation, onOpen }: Props) {
  const [pending, setPending] = useState<Candidate | null>(null)
  const [message, setMessage] = useState(
    'Baixe a apresentação editável para guardar uma cópia de segurança ou transferir para outro dispositivo.',
  )
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)

  function save() {
    try {
      const source = serializePresentation(presentation)
      download(
        new Blob([source], { type: 'application/json' }),
        'apresentacao-taiko.json',
      )
      setMessage(
        'Apresentação editável baixada, com todos os mapas e demais dados.',
      )
    } catch {
      setMessage(
        'Não foi possível baixar a apresentação. Revise os dados e o limite de 5 MB. Seu trabalho foi preservado.',
      )
    }
  }

  async function open(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setPending(null)
    try {
      if (file.size > maxProjectBytes)
        throw new Error('O arquivo ultrapassa o limite de 5 MB.')
      const result = importPresentation(await file.text())
      if (result.status === 'valid') setPending(result)
      else
        setMessage(`${result.message} Sua apresentação atual foi preservada.`)
    } catch {
      setMessage(
        'Não foi possível ler o arquivo. Confira o formato JSON e o limite de 5 MB. Sua apresentação atual foi preservada.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function exportFiles() {
    setBusy(true)
    setExporting(true)
    setMessage('')
    try {
      await exportPresentation(presentation)
      setMessage(
        'Apresentação exportada. O ZIP contém o PDF e o arquivo editável.',
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Falha ao exportar a apresentação. Tente novamente.',
      )
    } finally {
      setExporting(false)
      setBusy(false)
    }
  }

  return (
    <section
      className={styles.fileActions}
      aria-label="Arquivos da apresentação"
    >
      <div className={styles.fileButtons}>
        <button onClick={save} disabled={busy}>
          Baixar apresentação editável
        </button>
        <label>
          Abrir apresentação
          <input
            aria-label="Abrir apresentação"
            type="file"
            accept=".json,application/json"
            disabled={busy}
            onChange={(event) => void open(event)}
          />
        </label>
        <button onClick={() => void exportFiles()} disabled={busy}>
          {exporting ? 'Gerando arquivos…' : 'Exportar apresentação'}
        </button>
      </div>
      <p aria-live="polite">{message}</p>
      {exporting && (
        <ConfirmationPopup
          title="Exportando apresentação"
          actions={[]}
          dismissActionIndex={0}
        >
          <p role="status">Gerando o PDF e o arquivo editável. Aguarde…</p>
        </ConfirmationPopup>
      )}
      {pending && (
        <div
          role="alertdialog"
          aria-label="Substituir apresentação atual"
          aria-describedby="replace-project-description"
        >
          <p id="replace-project-description">
            Abrir “{pending.presentation.title}” substituirá a apresentação
            atual. Baixe seu trabalho antes de continuar.
          </p>
          {pending.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          <button
            onClick={() => {
              onOpen(pending.presentation)
              setPending(null)
              setMessage(
                'Apresentação reaberta. Todos os dados foram preservados.',
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
