import type { Presentation } from '../../../domain/presentation/model'
import { customInstrumentUsage } from '../../../domain/presentation/customInstruments'
import { byId } from '../../../domain/presentation/rules'
import { ConfirmationPopup } from '../../../components/ConfirmationPopup'

export function CustomInstrumentRemoval({
  presentation,
  id,
  onClose,
  onConfirm,
}: {
  presentation: Presentation
  id: string
  onClose: () => void
  onConfirm: () => void
}) {
  const instrument = byId(presentation.customInstruments ?? [], id)
  const maps = customInstrumentUsage(presentation, id)
  return (
    <ConfirmationPopup
      title={maps.length ? 'Instrumento em uso' : 'Remover instrumento?'}
      dismissActionIndex={0}
      actions={
        maps.length
          ? [{ label: 'Voltar', onClick: onClose }]
          : [
              { label: 'Cancelar', onClick: onClose },
              { label: 'Confirmar', onClick: onConfirm },
            ]
      }
    >
      {maps.length ? (
        <>
          <p>{instrument.name} está em uso nas músicas:</p>
          <ul>
            {maps.map((map) => (
              <li key={map.id}>{map.title}</li>
            ))}
          </ul>
          <p>
            Remova suas ocorrências desses mapas antes de excluí-lo do catálogo.
          </p>
        </>
      ) : (
        <p>Deseja remover {instrument.name} do catálogo desta apresentação?</p>
      )}
    </ConfirmationPopup>
  )
}
