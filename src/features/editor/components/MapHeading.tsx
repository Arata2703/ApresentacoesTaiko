import { useEffect, useRef } from 'react'
import styles from '../editor.module.css'

interface Props {
  song: string
  onSongChange: (song: string) => void
}
export function MapHeading(props: Props) {
  const { song, onSongChange } = props
  const title = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const field = title.current!
    function leaveTitle(event: PointerEvent) {
      if (document.activeElement === field && event.target !== field)
        field.blur()
    }
    document.addEventListener('pointerdown', leaveTitle, true)
    return () => document.removeEventListener('pointerdown', leaveTitle, true)
  }, [])
  return (
    <div className={styles.workspaceHeading}>
      <div>
        <p className={styles.eyebrow}>MONTE A SUA FORMAÇÃO</p>
        <label className={styles.srOnly} htmlFor="song-title">
          Nome da música
        </label>
        <input
          id="song-title"
          ref={title}
          className={styles.songTitle}
          value={song}
          onChange={(event) => onSongChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing)
              event.currentTarget.blur()
          }}
          maxLength={80}
        />
      </div>
      <span className={styles.mapBadge}>Mapa de palco</span>
    </div>
  )
}
