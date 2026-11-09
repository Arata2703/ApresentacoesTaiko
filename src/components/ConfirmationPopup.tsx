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
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const initialIndex = useRef(dismissActionIndex)
  useLayoutEffect(() => {
    const popup = dialog.current!
    const origin = document.activeElement
    popup.showModal?.()
    popup.open = true
    const initialButton = buttons.current[initialIndex.current]
    if (initialButton) initialButton.focus()
    else content.current!.focus()
    return () => {
      if (popup.open) popup.close?.()
      if (origin instanceof HTMLElement && origin.isConnected) origin.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className={styles.popup}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-content`}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss?.()
      }}
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
      <div
        className={styles.actions}
        onKeyDown={(event) => {
          const keys = [
            'ArrowLeft',
            'ArrowUp',
            'ArrowRight',
            'ArrowDown',
            'Home',
            'End',
          ]
          if (!keys.includes(event.key)) return
          const index = buttons.current.indexOf(
            event.target as HTMLButtonElement,
          )
          if (index < 0) return
          event.preventDefault()
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? actions.length - 1
                : (index +
                    (event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                      ? -1
                      : 1) +
                    actions.length) %
                  actions.length
          buttons.current[next]?.focus()
        }}
      >
        {actions.map(({ label, onClick }, index) => (
          <button
            ref={(button) => {
              buttons.current[index] = button
            }}
            key={label}
            type="button"
            onClick={onClick}
          >
            {label}
          </button>
        ))}
      </div>
    </dialog>
  )
}
