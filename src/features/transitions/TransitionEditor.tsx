import { useState } from 'react'
import { ConfirmationPopup } from '../../components/ConfirmationPopup'
import type {
  Presentation,
  TextTransition,
} from '../../domain/presentation/model'
import { transitionMaps } from '../../domain/presentation/sequence'
import { projectMap } from '../editor/editorProjection'
import { MapPreview } from './MapPreview'
import styles from './transitions.module.css'
import { InstructionEditor } from './InstructionEditor'

export function TransitionEditor({
  presentation: p,
  transition: t,
  onChange,
  onReview,
  onRemove,
  onOpenMap,
}: {
  presentation: Presentation
  transition: TextTransition
  onChange: (name: string, text: string, format?: 'html') => void
  onReview: (id: string) => void
  onRemove: () => void
  onOpenMap: (id: string) => void
}) {
  const [name, setName] = useState(t.tsunagiName)
  const [removing, setRemoving] = useState(false)
  const { previous, next } = transitionMaps(p, t.id)
  return (
    <section className={styles.editor} aria-label="Editor de transição">
      <h1>Transição</h1>
      <label className={styles.field}>
        Nome do tsunagi
        <input
          maxLength={80}
          placeholder="Nome"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            onChange(event.target.value, t.instructions)
          }}
        />
      </label>
      {t.needsReview && (
        <div className={styles.warning} role="alert">
          <p>
            A sequência mudou. Confira os mapas e revise as instruções desta
            transição.
          </p>
          <button onClick={() => onReview(t.id)}>
            Marcar transição como revisada
          </button>
        </div>
      )}
      <div className={styles.maps}>
        <MapPreview
          map={projectMap(p, previous?.id ?? null)}
          label="Mapa anterior"
          empty="Sem mapa anterior · entrada da apresentação"
          onOpen={() => onOpenMap(previous!.id)}
        />
        <MapPreview
          map={projectMap(p, next?.id ?? null)}
          label="Próximo mapa"
          empty="Sem próximo mapa · saída da apresentação"
          onOpen={() => onOpenMap(next!.id)}
        />
      </div>
      <InstructionEditor
        value={t.instructions}
        format={t.instructionsFormat}
        onChange={(text) => onChange(name, text, 'html')}
      />
      <button onClick={() => setRemoving(true)}>Remover transição</button>
      {removing && (
        <ConfirmationPopup
          title="Remover transição"
          dismissActionIndex={1}
          actions={[
            { label: 'Confirmar remoção da transição', onClick: onRemove },
            { label: 'Cancelar', onClick: () => setRemoving(false) },
          ]}
        >
          {' '}
          <p>
            Remover esta transição e suas instruções? Os mapas e integrantes
            serão mantidos.
          </p>
        </ConfirmationPopup>
      )}
    </section>
  )
}
