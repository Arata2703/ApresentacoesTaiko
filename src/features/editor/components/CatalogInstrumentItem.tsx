import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InstrumentKind } from '../../../domain/stage'
import { InstrumentSymbol } from './InstrumentSymbol'
import styles from '../editor.module.css'

interface Props {
  name: string
  abbreviation?: string
  kind: InstrumentKind
  png?: string
  onAdd: () => void
  actions?: { onEdit: () => void; onRemove: () => void }
}

export function CatalogInstrumentItem({
  name,
  abbreviation,
  kind,
  png,
  onAdd,
  actions,
}: Props) {
  const row = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const icon = useRef<HTMLSpanElement>(null)
  const plus = useRef<HTMLSpanElement>(null)
  const measure = useRef<HTMLSpanElement>(null)
  const controls = useRef<HTMLSpanElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touch = useRef({ x: 0, y: 0, held: false })
  const [layout, setLayout] = useState({ compact: false, actions: true })
  const [menuOpen, setMenuOpen] = useState(false)
  const [keyboardMenu, setKeyboardMenu] = useState(false)

  useLayoutEffect(() => {
    function update() {
      const width = row.current!.getBoundingClientRect().width
      if (!width) return
      const css = getComputedStyle(trigger.current!)
      const inset = [
        'paddingLeft',
        'paddingRight',
        'borderLeftWidth',
        'borderRightWidth',
      ].reduce(
        (sum, key) =>
          sum +
          (parseFloat(css[key as keyof CSSStyleDeclaration] as string) || 0),
        0,
      )
      const fullWidth =
        measure.current!.getBoundingClientRect().width +
        icon.current!.getBoundingClientRect().width +
        plus.current!.getBoundingClientRect().width +
        2 * (parseFloat(css.columnGap) || 0) +
        inset
      const actionsWidth = controls.current?.getBoundingClientRect().width ?? 0
      const next = {
        compact: fullWidth > width,
        actions: fullWidth + actionsWidth + 3 <= width,
      }
      setLayout((previous) =>
        previous.compact === next.compact && previous.actions === next.actions
          ? previous
          : next,
      )
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(row.current!)
    observer.observe(measure.current!)
    return () => observer.disconnect()
  }, [name, abbreviation])

  function stopHold() {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => stopHold, [])
  useEffect(() => {
    if (!menuOpen) return
    const bounds = menu.current!.getBoundingClientRect()
    menu.current!.style.translate = `${Math.max(8 - bounds.left, Math.min(0, window.innerWidth - 8 - bounds.right))}px`
    menu.current!.querySelector<HTMLButtonElement>('button')!.focus()
    function outside(event: PointerEvent) {
      if (!row.current!.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
    trigger.current!.focus()
  }
  return (
    <div ref={row} className={styles.catalogRow} data-compact={layout.compact}>
      <button
        ref={trigger}
        type="button"
        className={styles.catalogItem}
        data-button-style="instrument"
        aria-label={`Adicionar ${name}`}
        title={name}
        aria-haspopup={actions ? 'menu' : undefined}
        aria-expanded={actions ? menuOpen : undefined}
        onClick={() => {
          if (!touch.current.held) onAdd()
        }}
        onContextMenu={(event) => {
          if (actions) {
            event.preventDefault()
            stopHold()
            setKeyboardMenu(false)
            setMenuOpen(true)
          }
        }}
        onKeyDown={(event) => {
          touch.current.held = false
          if (
            actions &&
            ((event.shiftKey && event.key === 'F10') ||
              event.key === 'ContextMenu')
          ) {
            event.preventDefault()
            setKeyboardMenu(true)
            setMenuOpen(true)
          }
        }}
        onPointerDown={(event) => {
          stopHold()
          touch.current = { x: event.clientX, y: event.clientY, held: false }
          if (
            actions &&
            (event.pointerType === 'touch' || event.pointerType === 'pen')
          ) {
            timer.current = setTimeout(() => {
              touch.current.held = true
              setKeyboardMenu(false)
              setMenuOpen(true)
            }, 550)
          }
        }}
        onPointerMove={(event) => {
          if (
            Math.hypot(
              event.clientX - touch.current.x,
              event.clientY - touch.current.y,
            ) > 8
          )
            stopHold()
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
      >
        <span ref={icon} className={styles.catalogSymbol}>
          <InstrumentSymbol kind={kind} png={png} small />
        </span>
        <span className={styles.catalogLabel}>
          <span
            ref={measure}
            className={styles.catalogMeasure}
            aria-hidden="true"
          >
            {name}
          </span>
          {layout.compact && abbreviation ? abbreviation : name}
        </span>
        <span ref={plus} className={styles.addSign} aria-hidden="true">
          +
        </span>
      </button>
      {actions && (
        <span
          ref={controls}
          className={styles.catalogActions}
          data-visible={layout.actions}
          aria-hidden={!layout.actions}
        >
          <button
            type="button"
            className={styles.catalogAction}
            tabIndex={layout.actions ? undefined : -1}
            aria-label={`Editar ${name}`}
            title="Editar instrumento"
            onClick={actions.onEdit}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m16 3 5 5-12 12-6 1 1-6Z M13 6l5 5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.catalogAction}
            tabIndex={layout.actions ? undefined : -1}
            aria-label={`Remover ${name}`}
            title="Remover instrumento"
            onClick={actions.onRemove}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7" />
            </svg>
          </button>
        </span>
      )}
      {menuOpen && actions && (
        <div
          ref={menu}
          role="menu"
          aria-label={`Ações de ${name}`}
          className={styles.catalogMenu}
          data-keyboard={keyboardMenu}
          onKeyDown={(event) => {
            const buttons = Array.from(
              menu.current!.querySelectorAll<HTMLButtonElement>('button'),
            )
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            )
            if (event.key === 'Escape') {
              event.preventDefault()
              closeMenu()
            } else if (event.key === 'Tab') setMenuOpen(false)
            else if (
              ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
            ) {
              event.preventDefault()
              setKeyboardMenu(true)
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? 1
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + 2) % 2
              buttons[next]!.focus()
            }
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              actions.onEdit()
            }}
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              actions.onRemove()
            }}
          >
            Remover
          </button>
        </div>
      )}
    </div>
  )
}
