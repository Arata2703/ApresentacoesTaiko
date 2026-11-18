import { useId, useRef, useState } from 'react'
import type { CustomInstrument } from '../../../domain/presentation/model'
import { catalog } from '../../../domain/stage'
import { readInstrumentIcon } from '../../../integrations/instrumentIconFile'
import { InstrumentSymbol } from './InstrumentSymbol'
import styles from './newInstrumentForm.module.css'
import editorStyles from '../editor.module.css'

export function NewInstrumentForm({
  custom,
  onCreate,
}: {
  custom: readonly CustomInstrument[]
  onCreate: (input: Omit<CustomInstrument, 'id'>) => void
}) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [reference, setReference] = useState('okedo')
  const [png, setPng] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const upload = reference === 'upload'
  const icons = [
    ...catalog.map(({ kind, name }) => ({
      id: kind,
      name,
      kind,
      png: undefined,
    })),
    ...custom.map((item) => ({ ...item, id: `custom:${item.id}` })),
  ]
  const selected = icons.find((item) => item.id === reference) ?? icons[0]!

  async function chooseFile(file: File | undefined) {
    const current = ++request.current
    setPng(undefined)
    setError('')
    setLoading(Boolean(file))
    if (!file) return
    try {
      const image = await readInstrumentIcon(file)
      if (request.current === current) setPng(image)
    } catch (failure) {
      if (request.current === current) setError((failure as Error).message)
    } finally {
      if (request.current === current) setLoading(false)
    }
  }

  return (
    <div className={styles.action}>
      <button
        type="button"
        data-button-style="instrument"
        className={`${editorStyles.catalogItem} ${styles.toggle}`}
        aria-controls={formId}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">＋</span>
        <span>Novo instrumento</span>
      </button>
      <form
        id={formId}
        hidden={!open}
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (upload && !png) return
          try {
            onCreate({
              name,
              kind: upload ? 'okedo' : selected.kind,
              png: upload ? png : selected.png,
            })
            event.currentTarget.reset()
            setName('')
            setReference('okedo')
            setPng(undefined)
            setError('')
            setOpen(false)
          } catch (failure) {
            setError((failure as Error).message)
          }
        }}
      >
        <label>
          Nome{' '}
          <input
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Ícone
          <select
            value={upload ? 'upload' : selected.id}
            onChange={(event) => {
              if (event.target.value === 'upload') {
                fileInput.current?.click()
              } else {
                setReference(event.target.value)
                void chooseFile(undefined)
              }
            }}
          >
            <option value="upload">Enviar imagem</option>
            {icons.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <input
          ref={fileInput}
          hidden
          aria-label="Ícone em SVG ou PNG"
          type="file"
          accept=".svg,.png,image/svg+xml,image/png"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) {
              setReference('upload')
              void chooseFile(file)
            }
          }}
        />
        {upload && (png || error) && (
          <button type="button" onClick={() => fileInput.current?.click()}>
            Trocar imagem
          </button>
        )}
        {(!upload || png) && (
          <span role="img" aria-label="Prévia do ícone">
            <InstrumentSymbol
              kind={selected.kind}
              png={upload ? png : selected.png}
            />
          </span>
        )}
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading || (upload && !png)}>
          Cadastrar instrumento
        </button>
      </form>
    </div>
  )
}
