import { useState } from 'react'
import type {
  ManualMaterial,
  Presentation,
} from '../../domain/presentation/model'
import {
  addMaterial,
  removeMaterial,
  updateMaterial,
  validateMaterial,
} from '../../domain/presentation/materials'
import { exportMaterials } from '../../integrations/exportMaterials'
import styles from './materials.module.css'

interface Props {
  presentation: Presentation
  onUpdate: (change: (presentation: Presentation) => Presentation) => void
  onBack: () => void
}

export function MaterialsPage({ presentation, onUpdate, onBack }: Props) {
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [pdfStatus, setPdfStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const materials = presentation.materials

  function select(item: ManualMaterial | null) {
    setEditing(item?.id ?? null)
    setName(item?.name ?? '')
    setQuantity(item ? String(item.quantity) : '1')
    setError('')
  }

  function save() {
    try {
      const values = validateMaterial(name, Number(quantity))
      if (editing) {
        onUpdate((current) =>
          updateMaterial(current, editing, values.name, values.quantity),
        )
      } else {
        const id = crypto.randomUUID()
        onUpdate((current) =>
          addMaterial(current, id, values.name, values.quantity),
        )
      }
      select(null)
    } catch (error) {
      setError((error as Error).message)
    }
  }

  async function downloadPdf() {
    setExporting(true)
    setPdfStatus('')
    try {
      await exportMaterials(presentation.title, materials)
      setPdfStatus('PDF dos materiais manuais baixado.')
    } catch (error) {
      setPdfStatus((error as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="materials-title">
      <div className={styles.heading}>
        <h1 id="materials-title">Materiais manuais</h1>
        <button type="button" onClick={onBack}>
          Voltar aos mapas
        </button>
      </div>
      <p>Informe os itens e as quantidades desta apresentação.</p>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <label>
          Nome do material
          <input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Quantidade
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <button type="submit">
          {editing ? 'Salvar material' : 'Adicionar material'}
        </button>
        {editing && (
          <button type="button" onClick={() => select(null)}>
            Cancelar edição
          </button>
        )}
      </form>
      {error && <p role="alert">{error}</p>}
      {materials.length === 0 ? (
        <p>Nenhum material cadastrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col">Quantidade</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      aria-label={`Editar ${item.name}`}
                      onClick={() => select(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover ${item.name}`}
                      onClick={() => {
                        onUpdate((current) => removeMaterial(current, item.id))
                        if (editing === item.id) select(null)
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button
        type="button"
        disabled={exporting || materials.length === 0}
        onClick={() => void downloadPdf()}
      >
        {exporting ? 'Gerando PDF…' : 'Exportar PDF dos materiais'}
      </button>
      <p role="status">{pdfStatus}</p>
    </section>
  )
}
