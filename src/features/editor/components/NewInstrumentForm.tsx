import { useId, useState } from 'react'
import type { CustomInstrument } from '../../../domain/presentation/model'
import { InstrumentForm } from './InstrumentForm'
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
        <span className={styles.toggleLabel}>Novo instrumento</span>
      </button>
      <div id={formId}>
        {open && (
          <InstrumentForm
            custom={custom}
            onSave={(input) => {
              onCreate(input)
              setOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
