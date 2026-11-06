import { useState } from 'react'
import type { Presentation } from '../../domain/presentation/model'
import {
  addMaterial,
  removeMaterial,
  updateMaterial,
  validateMaterial,
} from '../../domain/presentation/materials'
import { exportMaterials } from '../../integrations/exportMaterials'
import { DataTable } from '../../components/DataTable'
import styles from './materials.module.css'

interface Props {
  presentation: Presentation
  onUpdate: (change: (presentation: Presentation) => Presentation) => void
  onBack: () => void
}

export function MaterialsPage({ presentation, onUpdate, onBack }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [pdfStatus, setPdfStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const materials = presentation.materials

  function save() {
    try {
      const values = validateMaterial(name, Number(quantity))
      const id = crypto.randomUUID()
      onUpdate((current) =>
        addMaterial(current, id, values.name, values.quantity),
      )
      setName('')
      setQuantity('1')
      setError('')
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
        <button type="submit">Adicionar material</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {materials.length === 0 ? (
        <p>Nenhum material cadastrado.</p>
      ) : (
        <DataTable
          rows={materials}
          rowId={(item) => item.id}
          rowLabel={(item) => `${item.name} ${item.quantity}`}
          columns={[
            {
              id: 'name',
              title: 'Material',
              kind: 'editable',
              input: 'text',
              maxLength: 80,
              label: (item) => `Editar nome de ${item.name}`,
              value: (item) => item.name,
              validate: (value) =>
                value.trim() ? '' : 'Informe um nome de 1 a 80 caracteres.',
              save: (item, name) =>
                onUpdate((current) =>
                  updateMaterial(current, item.id, name, item.quantity),
                ),
            },
            {
              id: 'quantity',
              title: 'Quantidade',
              kind: 'editable',
              input: 'number',
              min: 1,
              label: (item) => `Editar quantidade de ${item.name}`,
              value: (item) => item.quantity,
              validate: (value) =>
                Number.isSafeInteger(Number(value)) && Number(value) >= 1
                  ? ''
                  : 'A quantidade deve ser um inteiro positivo.',
              save: (item, quantity) =>
                onUpdate((current) =>
                  updateMaterial(current, item.id, item.name, quantity),
                ),
            },
            {
              id: 'remove',
              kind: 'remove',
              label: (item) => `Remover ${item.name}`,
              confirmation: (item) => (
                <p>
                  Deseja remover {item.name} do inventário? Quantidade:{' '}
                  {item.quantity}.
                </p>
              ),
              remove: (item) =>
                onUpdate((current) => removeMaterial(current, item.id)),
            },
          ]}
        />
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
