import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import styles from './confirmationPopup.module.css'

interface Props {
  title: string
  children: ReactNode
  actions: readonly { label: string; onClick: () => void }[]
  dismissActionIndex: number
}

export function ConfirmationPopup({
  title,
  children,
  actions,
  dismissActionIndex,
}: Props) {
  const onDismiss = actions[dismissActionIndex]?.onClick
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const popup = dialog.current!
    popup.showModal?.()
    popup.open = true
    content.current!.focus()
  }, [])

  return (
    <dialog
      ref={dialog}
      className={styles.popup}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-content`}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const { left, right, top, bottom } =
          event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < left ||
          event.clientX > right ||
          event.clientY < top ||
          event.clientY > bottom
        )
          onDismiss?.()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onDismiss?.()
        }
      }}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      <div
        ref={content}
        id={`${id}-content`}
        tabIndex={-1}
        className={styles.content}
      >
        {children}
      </div>
      <div className={styles.actions}>
        {actions.map(({ label, onClick }) => (
          <button key={label} type="button" onClick={onClick}>
            {label}
          </button>
        ))}
      </div>
    </dialog>
  )
}
