import { ConfirmationPopup } from '../../components/ConfirmationPopup'

export function PlayerRegistrationDialog({
  names,
  onConfirm,
  onCancel,
}: {
  names: readonly string[]
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ConfirmationPopup
      title="Confirmar cadastro de tocadores"
      dismissActionIndex={0}
      actions={[
        { label: 'Cancelar', onClick: onCancel },
        { label: 'Confirmar', onClick: onConfirm },
      ]}
    >
      <p>
        <strong>{names.join(', ')}</strong>
        {names.length === 1
          ? ' não está na lista de integrantes. Deseja adicionar?'
          : ' não estão na lista de integrantes. Deseja adicionar?'}
      </p>
    </ConfirmationPopup>
  )
}
