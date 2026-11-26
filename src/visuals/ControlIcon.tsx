import type { CSSProperties } from 'react'
import styles from './controlIcon.module.css'

export type ControlIconName =
  | 'align-start-vertical'
  | 'align-center-vertical'
  | 'align-end-vertical'
  | 'align-start-horizontal'
  | 'align-center-horizontal'
  | 'align-end-horizontal'
  | 'align-horizontal-distribute-center'
  | 'align-vertical-distribute-center'
  | 'flip-horizontal-2'
  | 'flip-vertical-2'
  | 'group'
const urls = import.meta.glob<string>('./controls/*.svg', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

/** Bundled Lucide SVGs use a mask so they inherit the surrounding text color. */
export function ControlIcon({ name }: { name: ControlIconName }) {
  return (
    <span
      aria-hidden="true"
      className={styles.icon}
      style={
        {
          maskImage: `url("${urls[`./controls/${name}.svg`]}")`,
        } as CSSProperties
      }
    />
  )
}
